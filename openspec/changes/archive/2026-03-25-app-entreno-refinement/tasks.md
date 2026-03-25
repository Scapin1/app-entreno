# Tasks: App Entreno Refinement

## Phase 1: Data & UI Refinement

- [x] 1.1 Refactor `src/data/plan.json`: Split composite exercises (e.g., "interna y externa x brazo", "front/lat/post") into individual entries for accurate tracking.
- [x] 1.2 Update `src/features/menu/MainMenu.jsx`: Apply `text-center` to the "Selecciona tu entrenamiento" header and ensure the grid layout is visually balanced.
- [x] 1.3 Update `src/features/preview/TrainingPreview.jsx`: Center the day title and focus headers.
- [x] 1.4 Refine `src/features/preview/TrainingPreview.jsx` list items: Remove redundant type suffixes (e.g., avoid "10 reps reps") and simplify the display of exercise values.

## Phase 2: Session Logic & State

- [x] 2.1 Update `src/features/session/SessionController.jsx`: Add `currentSet` and `isResting` state variables to track progression within an exercise.
- [x] 2.2 Implement set progression in `SessionController.jsx`: Modify `handleNext` to increment `currentSet` if more sets remain, otherwise proceed to the next exercise or rest.
- [x] 2.3 Implement rest triggers in `SessionController.jsx`: Logic to set `isResting: true` after a set (micro_pause) or after an exercise (macro_pause) based on `plan.json` config.
- [x] 2.4 Update `src/features/session/ExerciseCard.jsx`: Display "Set X of Y" for 'sets' type exercises and update the "Siguiente" button to signal set completion.

## Phase 3: Timers & Rest Flow

- [x] 3.1 Enhance `src/features/session/Timer.jsx`: Ensure the timer supports auto-start via a prop and provides a reliable `onComplete` callback.
- [x] 3.2 Create/Integrate Rest View in `SessionController.jsx`: Render a centered `Timer` during rest periods with a "Skip Rest" button.
- [x] 3.3 Connect Rest View to progression: Ensure that timer completion or skipping correctly resets `isResting` and moves to the next set/exercise.

## Phase 4: Verification & Testing

- [ ] 4.1 Test: Verify that 'sets' exercises correctly iterate through all sets before moving to the next exercise.
- [ ] 4.2 Test: Confirm `micro_pause` timer appears between sets and `macro_pause` appears between exercises.
- [ ] 4.3 Test: Verify that skipping a rest timer immediately proceeds to the next active state.
- [ ] 4.4 Test: Ensure 'manual' and 'timer' type exercises still function correctly within the new state machine.
