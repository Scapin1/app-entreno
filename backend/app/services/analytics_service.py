from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Dict, List, Any
from datetime import datetime, timedelta
import json
import random


def get_workout_stats(
    db: Session,
    profile_id: int,
    start_date: str = None,
    end_date: str = None
) -> Dict[str, Any]:
    """
    Get workout statistics for a profile.
    """
    from app.models import WorkoutSession, ExerciseResult
    
    query = db.query(WorkoutSession).filter(
        WorkoutSession.profile_id == profile_id
    )
    
    if start_date:
        query = query.filter(WorkoutSession.date >= start_date)
    if end_date:
        query = query.filter(WorkoutSession.date <= end_date)
    
    sessions = query.all()
    completed = [s for s in sessions if s.is_completed]
    
    # Total workouts
    total_workouts = len(sessions)
    completed_workouts = len(completed)
    
    # Durations are stored in seconds
    total_duration_seconds = sum(s.total_duration or 0 for s in sessions)
    avg_duration_seconds = total_duration_seconds // total_workouts if total_workouts > 0 else 0
    
    return {
        "total_workouts": total_workouts,
        "completed_workouts": completed_workouts,
        "total_duration_seconds": total_duration_seconds,
        "average_duration_seconds": avg_duration_seconds,
        "total_duration_minutes": total_duration_seconds // 60,
        "average_duration_minutes": avg_duration_seconds // 60,
    }


def get_exercise_frequency(
    db: Session,
    profile_id: int,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get most frequently performed exercises.
    """
    from app.models import WorkoutSession, ExerciseResult
    
    # Join sessions with results
    results = db.query(
        ExerciseResult.exercise_name,
        func.count(ExerciseResult.id).label('total_sets')
    ).join(
        WorkoutSession
    ).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.is_completed == 1
    ).group_by(
        ExerciseResult.exercise_name
    ).order_by(
        desc('total_sets')
    ).limit(limit).all()
    
    return [
        {"exercise": r.exercise_name, "total_sets": r.total_sets}
        for r in results
    ]


def get_weekly_workouts(
    db: Session,
    profile_id: int,
    weeks: int = 4
) -> List[Dict[str, Any]]:
    """
    Get workout count per week for the last N weeks.
    """
    from app.models import WorkoutSession
    
    today = datetime.now().date()
    current_week_start = today - timedelta(days=today.weekday())
    weeks_data = []
    
    for i in range(weeks):
        # Full week range (Monday to Sunday), oldest -> newest
        week_start = current_week_start - timedelta(weeks=(weeks - 1 - i))
        week_end = week_start + timedelta(days=6)
        
        start_str = week_start.isoformat()
        end_str = week_end.isoformat()
        
        count = db.query(WorkoutSession).filter(
            WorkoutSession.profile_id == profile_id,
            WorkoutSession.date >= start_str,
            WorkoutSession.date <= end_str,
            WorkoutSession.is_completed == 1
        ).count()
        
        weeks_data.append({
            "week": f"Week {i + 1}",
            "start_date": start_str,
            "end_date": end_str,
            "workouts": count
        })
    
    return weeks_data


def get_body_weight_progress(
    db: Session,
    profile_id: int,
    limit: int = 30
) -> List[Dict[str, Any]]:
    """
    Get body weight history.
    """
    from app.models import BodyWeight
    
    # Fetch latest N and return in chronological order (oldest -> newest)
    weights = db.query(BodyWeight).filter(
        BodyWeight.profile_id == profile_id
    ).order_by(
        BodyWeight.date.desc(),
        BodyWeight.timestamp.desc(),
        BodyWeight.id.desc(),
    ).limit(limit).all()

    ordered = list(reversed(weights))

    return [
        {
            "date": w.date,
            "weight": w.weight,
            "timestamp": w.timestamp,
        }
        for w in ordered
    ]


def get_exercise_actual_progress(
    db: Session,
    profile_id: int,
    exercise_name: str,
    start_date: str = None,
    end_date: str = None,
    limit: int = 180,
) -> Dict[str, Any]:
    """
    Get REAL performance progression for one exercise based on actual form responses
    (actual_reps / actual_weight), ordered chronologically.
    Includes planned_reps from the routine plan (TrainingDay.blocks JSON).
    """
    from app.models import WorkoutSession, ExerciseResult, TrainingDay

    query = db.query(
        ExerciseResult.id.label("result_id"),
        ExerciseResult.exercise_name,
        ExerciseResult.set_number,
        ExerciseResult.actual_reps,
        ExerciseResult.actual_weight,
        ExerciseResult.feeling,
        ExerciseResult.timestamp.label("result_timestamp"),
        WorkoutSession.id.label("session_id"),
        WorkoutSession.date.label("session_date"),
        WorkoutSession.timestamp.label("session_timestamp"),
        WorkoutSession.day_id,
    ).join(
        WorkoutSession,
        ExerciseResult.session_id == WorkoutSession.id,
    ).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.is_completed == 1,
        ExerciseResult.exercise_name == exercise_name,
    ).filter(
        (ExerciseResult.actual_reps.isnot(None)) | (ExerciseResult.actual_weight.isnot(None))
    )

    if start_date:
        query = query.filter(WorkoutSession.date >= start_date)
    if end_date:
        query = query.filter(WorkoutSession.date <= end_date)

    rows = query.order_by(
        WorkoutSession.date.desc(),
        WorkoutSession.timestamp.desc(),
        ExerciseResult.timestamp.desc(),
        ExerciseResult.id.desc(),
    ).limit(limit).all()

    ordered = list(reversed(rows))

    # Build plan_reps lookup from TrainingDay blocks
    # Maps (day_id, exercise_name) -> planned_reps
    plan_reps_lookup = {}
    day_ids = {row.day_id for row in ordered if row.day_id is not None}
    if day_ids:
        days = db.query(TrainingDay).filter(TrainingDay.id.in_(day_ids)).all()
        for day in days:
            if not day.blocks:
                continue
            try:
                blocks = json.loads(day.blocks) if isinstance(day.blocks, str) else day.blocks
            except Exception:
                continue
            if not isinstance(blocks, list):
                continue
            for block in blocks:
                exercises = block.get("exercises", []) if isinstance(block, dict) else []
                for ex in exercises:
                    if not isinstance(ex, dict):
                        continue
                    ename = ex.get("name", "").strip().lower()
                    reps = ex.get("reps")
                    if ename and reps is not None:
                        key = (day.id, ename)
                        # Keep first occurrence (earliest block wins, typically principal)
                        if key not in plan_reps_lookup:
                            plan_reps_lookup[key] = reps

    points = []
    for row in ordered:
        weight_value = None
        if row.actual_weight not in (None, ""):
            try:
                weight_value = round(float(str(row.actual_weight).replace(",", ".")), 2)
            except Exception:
                weight_value = None

        # Look up planned_reps
        planned_reps = None
        if row.day_id is not None:
            key = (row.day_id, (exercise_name or "").strip().lower())
            planned_reps = plan_reps_lookup.get(key)

        points.append({
            "session_date": row.session_date,
            "session_id": row.session_id,
            "set_number": row.set_number,
            "actual_reps": row.actual_reps,
            "actual_weight": weight_value,
            "feeling": row.feeling,
            "planned_reps": planned_reps,
            "timestamp": row.result_timestamp,
        })

    return {
        "exercise_name": exercise_name,
        "points": points,
        "total_points": len(points),
    }


def get_workout_calendar(
    db: Session,
    profile_id: int,
    month: int = None,
    year: int = None
) -> Dict[str, Any]:
    """
    Get workout days for a specific month.
    """
    from app.models import WorkoutSession
    
    if not month or not year:
        now = datetime.now()
        month = now.month
        year = now.year
    
    # Calculate month range
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.date >= start_date,
        WorkoutSession.date < end_date,
        WorkoutSession.is_completed == 1
    ).all()
    
    return {
        "month": month,
        "year": year,
        "workout_days": [s.date for s in sessions],
        "total_workouts": len(sessions)
    }


def get_progression_summary(
    db: Session,
    profile_id: int
) -> Dict[str, Any]:
    """
    Get overall progression summary.
    """
    from app.models import WorkoutSession, ExerciseResult, BodyWeight
    
    # Total sessions
    total_sessions = db.query(WorkoutSession).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.is_completed == 1
    ).count()
    
    # Total exercises logged
    total_exercises = db.query(ExerciseResult).join(WorkoutSession).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.is_completed == 1
    ).count()
    
    # First and latest weight
    first_weight = db.query(BodyWeight).filter(
        BodyWeight.profile_id == profile_id
    ).order_by(BodyWeight.date.asc()).first()
    
    latest_weight = db.query(BodyWeight).filter(
        BodyWeight.profile_id == profile_id
    ).order_by(BodyWeight.date.desc()).first()
    
    weight_change = None
    if first_weight and latest_weight:
        try:
            diff = float(latest_weight.weight) - float(first_weight.weight)
            weight_change = round(diff, 1)
        except:
            pass
    
    return {
        "total_workouts": total_sessions,
        "total_exercises_logged": total_exercises,
        "first_weight": first_weight.weight if first_weight else None,
        "latest_weight": latest_weight.weight if latest_weight else None,
        "weight_change": weight_change
    }


def get_day_insights(
    db: Session,
    profile_id: int,
    day_id: int,
) -> Dict[str, Any]:
    """
    Get adaptive insights for a training day based on historical averages:
    - estimated duration (avg completed session duration)
    - difficulty score (avg feeling across exercise results)
    """
    from app.models import WorkoutSession, ExerciseResult

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.day_id == day_id,
        WorkoutSession.is_completed == 1,
    ).all()

    session_count = len(sessions)
    total_duration_seconds = sum(s.total_duration or 0 for s in sessions)
    avg_duration_seconds = (total_duration_seconds // session_count) if session_count > 0 else 0
    avg_duration_minutes = round(avg_duration_seconds / 60) if avg_duration_seconds > 0 else 0

    feeling_score = {
        "easy": 1,
        "good": 2,
        "hard": 3,
        "failed": 4,
        "ok": 2,
    }

    feeling_rows = db.query(ExerciseResult.feeling).join(
        WorkoutSession,
        ExerciseResult.session_id == WorkoutSession.id,
    ).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.day_id == day_id,
        WorkoutSession.is_completed == 1,
        ExerciseResult.feeling.isnot(None),
    ).all()

    scores = [
        feeling_score.get((row[0] or "").lower())
        for row in feeling_rows
        if feeling_score.get((row[0] or "").lower()) is not None
    ]

    avg_difficulty_score = round(sum(scores) / len(scores), 2) if scores else None

    if avg_difficulty_score is None:
        difficulty_label = "Sin datos"
        difficulty_level = 2
    elif avg_difficulty_score <= 1.5:
        difficulty_label = "Baja"
        difficulty_level = 1
    elif avg_difficulty_score <= 2.5:
        difficulty_label = "Media"
        difficulty_level = 2
    elif avg_difficulty_score <= 3.3:
        difficulty_label = "Alta"
        difficulty_level = 3
    else:
        difficulty_label = "Muy alta"
        difficulty_level = 4

    return {
        "day_id": day_id,
        "sessions_count": session_count,
        "estimated_duration_minutes": avg_duration_minutes,
        "average_duration_seconds": avg_duration_seconds,
        "difficulty_score": avg_difficulty_score,
        "difficulty_label": difficulty_label,
        "difficulty_level": difficulty_level,
        "feedback_samples": len(scores),
    }


def get_adherence_heatmap(
    db: Session,
    profile_id: int,
    start_date: str = None,
    end_date: str = None,
) -> Dict[str, Any]:
    """
    Get daily workout counts for a date range (GitHub-style heatmap).
    """
    from app.models import WorkoutSession

    today = datetime.now().date()

    if end_date:
        parsed_end = datetime.strptime(end_date, "%Y-%m-%d").date()
    else:
        parsed_end = today

    if start_date:
        parsed_start = datetime.strptime(start_date, "%Y-%m-%d").date()
    else:
        parsed_start = parsed_end - timedelta(days=365)

    start_str = parsed_start.strftime("%Y-%m-%d")
    end_str = parsed_end.strftime("%Y-%m-%d")

    rows = db.query(
        WorkoutSession.date,
        func.count(WorkoutSession.id).label("count")
    ).filter(
        WorkoutSession.profile_id == profile_id,
        WorkoutSession.date >= start_str,
        WorkoutSession.date <= end_str,
    ).group_by(
        WorkoutSession.date
    ).order_by(
        WorkoutSession.date.asc()
    ).all()

    days = [
        {
            "date": date,
            "count": int(count),
        }
        for date, count in rows
    ]

    max_count = max((d["count"] for d in days), default=0)
    total_workouts = sum(d["count"] for d in days)

    return {
        "start_date": start_str,
        "end_date": end_str,
        "days": days,
        "max_count": max_count,
        "active_days": len(days),
        "total_workouts": total_workouts,
    }


def seed_demo_analytics_data(
    db: Session,
    profile_id: int,
    months: int = 12,
) -> Dict[str, Any]:
    """
    Seed realistic analytics demo data for a profile.

    This is additive and only fills missing data for the generated period.
    """
    from app.models import WorkoutSession, ExerciseResult, BodyWeight, TrainingDay

    months = max(1, min(months, 12))
    today = datetime.now().date()
    start_date = today - timedelta(days=months * 30)

    training_days = db.query(TrainingDay).filter(
        TrainingDay.profile_id == profile_id,
        TrainingDay.is_active == 1
    ).order_by(TrainingDay.day_number.asc()).all()

    training_day_ids = [td.id for td in training_days]

    exercise_pool = [
        "Press banca con barra",
        "Peso muerto con barra",
        "Pull down en polea",
        "Sentadilla frontal",
        "Burpee",
        "Jumping Jacks",
        "Escaladores",
        "Bicicleta",
        "Push up",
        "Remo con barra",
    ]

    strength_exercises = {
        "Press banca con barra",
        "Peso muerto con barra",
        "Pull down en polea",
        "Sentadilla frontal",
        "Remo con barra",
    }

    rng = random.Random(profile_id * 97 + months)

    existing_session_counts = {
        date: count
        for date, count in db.query(
            WorkoutSession.date,
            func.count(WorkoutSession.id)
        ).filter(
            WorkoutSession.profile_id == profile_id,
            WorkoutSession.is_completed == 1,
            WorkoutSession.date >= start_date.isoformat(),
            WorkoutSession.date <= today.isoformat(),
        ).group_by(WorkoutSession.date).all()
    }

    existing_weight_dates = {
        row[0]
        for row in db.query(BodyWeight.date).filter(
            BodyWeight.profile_id == profile_id,
            BodyWeight.date >= start_date.isoformat(),
            BodyWeight.date <= today.isoformat(),
        ).all()
    }

    created_sessions = 0
    created_results = 0
    created_weights = 0

    total_days = (today - start_date).days + 1

    base_weight = 83.5 + ((profile_id % 7) * 0.35)

    for day_offset in range(total_days):
        current = start_date + timedelta(days=day_offset)
        day_key = current.isoformat()
        weekday = current.weekday()  # Mon=0
        week_number = day_offset // 7

        target_sessions = 0
        if weekday in (0, 2, 4):
            target_sessions = 1
        if weekday == 5 and week_number % 2 == 0:
            target_sessions += 1
        if day_offset % 33 == 0:
            target_sessions += 1
        if day_offset % 61 == 0:
            target_sessions += 1

        existing_count = int(existing_session_counts.get(day_key, 0))
        to_create = max(0, target_sessions - existing_count)

        for session_idx in range(to_create):
            midday = datetime(current.year, current.month, current.day, 12, 0, 0)
            timestamp = int(midday.timestamp()) + (session_idx * 3600)

            day_id = None
            if training_day_ids:
                mapped_idx = (weekday % len(training_day_ids))
                day_id = training_day_ids[mapped_idx]

            duration = 2400 + ((day_offset * 37 + session_idx * 211) % 1800)  # 40m-70m

            session = WorkoutSession(
                profile_id=profile_id,
                day_id=day_id,
                date=day_key,
                timestamp=timestamp,
                total_duration=duration,
                is_completed=1,
            )
            db.add(session)
            db.flush()
            created_sessions += 1

            result_count = 4 + ((day_offset + session_idx) % 3)
            for result_idx in range(result_count):
                exercise_name = exercise_pool[(day_offset + result_idx + session_idx) % len(exercise_pool)]
                is_strength = exercise_name in strength_exercises

                reps = 8 + ((day_offset + result_idx) % 8)
                weight_value = None
                if is_strength:
                    weight_number = 32 + ((day_offset * 3 + result_idx * 5 + session_idx * 7) % 45)
                    weight_value = f"{weight_number}"

                result = ExerciseResult(
                    session_id=session.id,
                    exercise_name=exercise_name,
                    set_number=(result_idx % 4) + 1,
                    actual_reps=reps,
                    actual_weight=weight_value,
                    feeling=rng.choice(["easy", "good", "good", "hard"]),
                    duration=45 if not is_strength else None,
                    timestamp=timestamp + (result_idx * 90),
                )
                db.add(result)
                created_results += 1

        if (day_offset % 7 == 0) and (day_key not in existing_weight_dates):
            trend_component = (day_offset / max(1, total_days)) * -1.6
            oscillation = ((day_offset % 28) - 14) / 70
            variation = rng.uniform(-0.15, 0.15)
            weight_value = round(base_weight + trend_component + oscillation + variation, 1)

            midday = datetime(current.year, current.month, current.day, 11, 0, 0)

            weight = BodyWeight(
                profile_id=profile_id,
                weight=f"{weight_value:.1f}",
                date=day_key,
                timestamp=int(midday.timestamp()),
            )
            db.add(weight)
            created_weights += 1

    db.commit()

    return {
        "status": "ok",
        "profile_id": profile_id,
        "months": months,
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "sessions_created": created_sessions,
        "exercise_results_created": created_results,
        "weights_created": created_weights,
    }
