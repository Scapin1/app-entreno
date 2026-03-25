# Proposal: App Entreno Refinement

## Intent

The current application has some UI redundancies in the `TrainingPreview` and doesn't support a set-by-set progression, which is critical for strength training. Additionally, rest periods (micro/macropauses) are defined in the data but not enforced or displayed in the UI. This refinement aims to improve the training flow, UI consistency, and provide automated timers for rest periods.

## Scope

### In Scope
- **UI Centering**: Align headers in `MainMenu.jsx` and `TrainingPreview.jsx`.
- **Redundancy Cleanup**: Remove redundant information between exercise names and value badges in `TrainingPreview.jsx`.
- **Data Refactoring**: Split subdivided/composite exercises in `data/plan.json` into individual, trackable entries.
- **Set-by-Set Progression**: Update `SessionController.jsx` to track current set index and require a completion action for each set.
- **Automated Rest Timers**: Implement automatic countdowns for `micro_pause` (between sets) and `macro_pause` (between exercises).

### Out of Scope
- Adding new training days or exercises to the plan (except for splitting existing ones).
- Redesigning the `ExerciseCard` beyond what's necessary for set tracking.
- Adding exercise video/image support.

## Approach

1.  **Data Refactoring**: Update `plan.json` to ensure each exercise entry is a single task. For example, "10 rotaciones de hombro con banda (interna y externa x brazo)" will be split into two separate entries.
2.  **UI Alignment**: Apply `text-center` and flex centering classes to headers in `MainMenu` and `TrainingPreview`.
3.  **Set Tracking Logic**:
    *   In `SessionController`, add `currentSetIndex` state.
    *   Modify `handleNext` to check if more sets remain for the current exercise.
    *   Introduce a "Resting" state in `SessionController`.
4.  **Timer Implementation**:
    *   When a set is completed, trigger a "Resting" view with a `Timer` based on `micro_pause`.
    *   When an exercise is completed, trigger a "Resting" view with a `Timer` based on `macro_pause`.
    *   Allow skipping the rest timer if the user is ready early.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/data/plan.json` | Modified | Split composite exercises into individual entries. |
| `src/features/preview/TrainingPreview.jsx` | Modified | Center headers, clean up list items for better readability. |
| `src/features/menu/MainMenu.jsx` | Modified | Center "Selecciona tu entrenamiento" header. |
| `src/features/session/SessionController.jsx` | Modified | Add `currentSetIndex` and rest logic. |
| `src/features/session/ExerciseCard.jsx` | Modified | Update to show `Current Set / Total Sets` and handle set completion. |
| `src/features/session/Timer.jsx` | Existing | Used for rest timers. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rest timers might be annoying if not skippable. | Med | Add a "Skip Rest" button. |
| Splitting exercises might make the list very long. | Low | The blocks already provide organization. |
| Logic for sets vs reps vs manual types might get complex. | Med | Standardize exercise types and handle each clearly in the controller. |

## Rollback Plan

Revert changes using `git checkout` for the affected files and restore `plan.json` from the latest backup/commit.

## Dependencies

- None. Uses existing `lucide-react` and standard React hooks.

## Success Criteria

- [ ] All headers in `MainMenu` and `TrainingPreview` are centered.
- [ ] `TrainingPreview` list items are concise and not redundant.
- [ ] `SessionController` tracks sets (e.g., "Set 1 of 3").
- [ ] Automatic rest timers appear after each set/exercise based on `plan.json` config.
- [ ] Users can manually skip rest timers.
