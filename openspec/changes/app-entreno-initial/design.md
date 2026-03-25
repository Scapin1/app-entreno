# Design: Training App Engine & UI

## Data Schema (JSON)
The plan will be structured as an array of days. Each day contains blocks (Warm-up, Main, Cooldown).

```json
{
  "days": [
    {
      "id": 1,
      "title": "Fuerza",
      "focus": "Fuerza / Empuje y Tracción",
      "blocks": [
        {
          "name": "Calentamiento",
          "exercises": [
            { "name": "Mov. articular general", "type": "manual" },
            { "name": "Sentadillas profundas", "type": "reps", "value": 20 }
          ]
        },
        {
          "name": "Fase Principal",
          "config": { "micro_pause": 60, "macro_pause": 120 },
          "exercises": [
            { "name": "Press Paloff", "type": "sets", "sets": 2, "value": "10 rot + 10 emp + 20s" }
          ]
        }
      ]
    }
  ]
}
```

## Screen Logic
1. **Menu**: Simple list mapping over `plan.days`.
2. **Preview**: Filter `plan.days` by selected ID. List exercises and extract "implements" (manually tagged in JSON).
3. **Session**: 
   - State `currentBlockIndex`, `currentExerciseIndex`.
   - Component `ExerciseCard`: Displays info based on `type` (reps vs timer).
   - Component `Timer`: A reusable countdown for time-based exercises and pauses.

## UI Framework Choice
**Tailwind CSS** will be used for high-contrast, mobile-first design.
- Color Palette: Deep Black (#000) for background, Neon Yellow (#ccff00) or White (#fff) for primary text/actions.
- Typography: Inter or System Sans-serif, Bold and Large.

## Vertical Slice Structure
```
src/
  features/
    menu/
      MainMenu.jsx
    preview/
      TrainingPreview.jsx
    session/
      SessionController.jsx
      ExerciseCard.jsx
      Timer.jsx
      BlockSummary.jsx (The "Warmup finished" message)
  shared/
    ui/ (Buttons, Typography)
    hooks/ (useTimer)
  data/
    training-plan.json
```
