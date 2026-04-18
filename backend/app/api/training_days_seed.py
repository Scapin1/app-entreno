from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.models import TrainingDay, Profile
from app.dependencies import get_current_user
from app.schemas.user import UserResponse
from app.schemas.training_day import DayResponse

router = APIRouter()


@router.post("/{profile_id}/days/seed", response_model=List[DayResponse], status_code=status.HTTP_201_CREATED)
def seed_training_days(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Seed initial training days from plan.json (4 days).
    """
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check if already seeded
    existing_days = db.query(TrainingDay).filter(
        TrainingDay.profile_id == profile_id
    ).first()
    
    if existing_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Training days already seeded for this profile"
        )
    
    # Plan data (from plan.json)
    seed_data = [
        {
            "day_number": 1,
            "title": "Día 1: Fuerza",
            "focus": "Empuje y Tracción (Fuerza)",
            "implements": ["banda elástica", "barra", "mancuernas", "polea", "elíptica"],
            "blocks": [
                {"name": "Calentamiento", "exercises": [
                    {"name": "Mov. articular general", "type": "manual"},
                    {"name": "Rotación hombro banda interna (Izquierda)", "type": "reps", "value": 10},
                    {"name": "Rotación hombro banda interna (Derecha)", "type": "reps", "value": 10},
                    {"name": "Rotación hombro banda externa (Izquierda)", "type": "reps", "value": 10},
                    {"name": "Rotación hombro banda externa (Derecha)", "type": "reps", "value": 10},
                    {"name": "Respiraciones diafragmáticas x patrón cruzado en muro", "type": "reps", "value": 10},
                    {"name": "Sentadillas profundas", "type": "reps", "value": 20},
                    {"name": "Puentes de cadera", "type": "reps", "value": 30},
                    {"name": "Push up cerradas", "type": "reps", "value": 10},
                    {"name": "Push up abiertas", "type": "reps", "value": 20}
                ]},
                {"name": "Fase Principal", "config": {"micro_pause": 60, "macro_pause": 120}, "exercises": [
                    {"name": "Press paloff c/banda", "type": "sets", "sets": 2, "alternating": True, "value": "10 rotaciones + 10 empujes + 20s resistencia"},
                    {"name": "Peso muerto con barra", "type": "sets", "sets": 5, "reps": 8, "note": "rir 3-4"},
                    {"name": "Press banca con barra", "type": "sets", "sets": 3, "reps": 14, "note": "rir 4-5"},
                    {"name": "Pull down en polea", "type": "sets", "sets": 5, "reps": 12, "note": "rir 5"},
                    {"name": "Vuelos frontales con mancuerna", "type": "sets", "sets": 2, "reps": 8, "note": "carga baja"},
                    {"name": "Vuelos laterales con mancuerna", "type": "sets", "sets": 2, "reps": 8, "note": "carga baja"},
                    {"name": "Vuelos posteriores con mancuerna", "type": "sets", "sets": 2, "reps": 8, "note": "carga baja"},
                    {"name": "Curl de biceps con mancuerna", "type": "sets", "sets": 3, "reps": 15, "note": "carga baja"}
                ]},
                {"name": "Vuelta a la calma", "exercises": [
                    {"name": "Elíptica", "type": "timer", "value": 300},
                    {"name": "Flexibilidad general (énfasis tren inferior)", "type": "manual"}
                ]}
            ]
        },
        {
            "day_number": 2,
            "title": "Día 2: Resistencia/Funcional",
            "focus": "Cardio y Estabilidad",
            "implements": ["elíptica o bicicleta", "mancuernas", "banda elástica", "rueda abdominal"],
            "blocks": [
                {"name": "Calentamiento", "exercises": [
                    {"name": "Mov. articular general", "type": "manual"},
                    {"name": "Elíptica o bicicleta", "type": "timer", "value": 600},
                    {"name": "Sentadillas con salto", "type": "reps", "value": 10},
                    {"name": "Plancha lateral con rotación (Izquierda)", "type": "reps", "value": 15},
                    {"name": "Plancha lateral con rotación (Derecha)", "type": "reps", "value": 15},
                    {"name": "Push up en pike", "type": "reps", "value": 20}
                ]},
                {"name": "Fase Principal", "config": {"work": 45, "micro_pause": 30, "macro_pause": 150, "total_sets": 4}, "type": "circuit", "exercises": [
                    {"name": "Burpee", "type": "timer", "value": 45},
                    {"name": "Bicho muerto", "type": "timer", "value": 45},
                    {"name": "Push up", "type": "timer", "value": 45},
                    {"name": "Estocadas c/ mancuerna sobre cabeza (Izquierda)", "type": "timer", "value": 45},
                    {"name": "Estocadas c/ mancuerna sobre cabeza (Derecha)", "type": "timer", "value": 45},
                    {"name": "Salto de cuerda", "type": "timer", "value": 45},
                    {"name": "Rueda abdominal", "type": "timer", "value": 45},
                    {"name": "Dominadas c/banda elástica", "type": "timer", "value": 45},
                    {"name": "Sentadilla isométrica en muro con carga", "type": "timer", "value": 45}
                ]},
                {"name": "Vuelta a la calma", "exercises": [
                    {"name": "Elíptica a baja intensidad", "type": "timer", "value": 600}
                ]}
            ]
        },
        {
            "day_number": 3,
            "title": "Día 3: Fuerza",
            "focus": "Fuerza (Tren Inferior y Empuje)",
            "implements": ["barra", "mancuernas", "banda elástica", "polea", "bicicleta", "discos"],
            "blocks": [
                {"name": "Calentamiento", "exercises": [
                    {"name": "Mov. articular (énfasis cadera y hombro; 90-90 y rotaciones de hombro)", "type": "manual"},
                    {"name": "Respiraciones diafragmáticas en postura de puente de cadera", "type": "reps", "value": 10},
                    {"name": "Sentadillas profundas", "type": "reps", "value": 20},
                    {"name": "Dominadas con apoyo de banda", "type": "reps", "value": 10},
                    {"name": "Push up con apoyo separado", "type": "reps", "value": 20},
                    {"name": "Vuelos posteriores con discos pequeños", "type": "reps", "value": 15}
                ]},
                {"name": "Fase Principal", "config": {"micro_pause": 60, "macro_pause": 120}, "exercises": [
                    {"name": "Sentadilla c/barra frontal", "type": "sets", "sets": 5, "reps": 10, "note": "rir 4"},
                    {"name": "Remo con barra", "type": "sets", "sets": 4, "reps": 12, "note": "rir 3-4"},
                    {"name": "Press francés c/mancuernas", "type": "sets", "sets": 3, "reps": 15, "note": "carga media-baja"},
                    {"name": "Press militar c/ mancuernas", "type": "sets", "sets": 3, "reps": 12, "note": "rir 2"},
                    {"name": "Chest press en máquina de polea", "type": "sets", "sets": 3, "reps": 16, "note": "carga media"}
                ]},
                {"name": "Vuelta a la calma", "exercises": [
                    {"name": "Bicicleta", "type": "timer", "value": 300},
                    {"name": "Flexibilidad general", "type": "manual"}
                ]}
            ]
        },
        {
            "day_number": 4,
            "title": "Día 4: Resistencia",
            "focus": "Resistencia Cardiopulmonar",
            "implements": ["salto de cuerda", "bicicleta", "elíptica"],
            "blocks": [
                {"name": "Calentamiento", "exercises": [
                    {"name": "Mov. articular general", "type": "manual"},
                    {"name": "Salto de cuerda", "type": "timer", "value": 180},
                    {"name": "Bicicleta (de pie)", "type": "timer", "value": 180},
                    {"name": "Crunch abd. cortos", "type": "reps", "value": 30},
                    {"name": "Plancha", "type": "timer", "value": 60}
                ]},
                {"name": "Fase Principal (Circuito)", "config": {"work": 50, "micro_pause": 25, "macro_pause": 60, "total_sets": 4}, "type": "circuit", "exercises": [
                    {"name": "Jumping Jacks", "type": "timer", "value": 50},
                    {"name": "Escaladores", "type": "timer", "value": 50},
                    {"name": "Tuck up", "type": "timer", "value": 50},
                    {"name": "Burpees (sin flexión de codos)", "type": "timer", "value": 50},
                    {"name": "Twist rusos", "type": "timer", "value": 50}
                ]},
                {"name": "Fase Principal (Intervalos)", "config": {"micro_pause": 0, "macro_pause": 0}, "exercises": [
                    {"name": "Bicicleta: 1' sentado (veloc. media) x 30\" de pie (veloc. máx)", "type": "sets", "sets": 6, "value": "1 min sentado + 30 seg de pie"}
                ]},
                {"name": "Vuelta a la calma", "exercises": [
                    {"name": "Elíptica (intensidad baja)", "type": "timer", "value": 300},
                    {"name": "Flexibilidad general", "type": "manual"}
                ]}
            ]
        }
    ]
    
    created_days = []
    for day_data in seed_data:
        day = TrainingDay(
            profile_id=profile_id,
            day_number=day_data["day_number"],
            title=day_data["title"],
            focus=day_data.get("focus"),
            implements=json.dumps(day_data.get("implements")),
            blocks=json.dumps(day_data.get("blocks")),
            is_active=1
        )
        db.add(day)
        created_days.append(day)
    
    db.commit()
    for day in created_days:
        db.refresh(day)
    
    return created_days