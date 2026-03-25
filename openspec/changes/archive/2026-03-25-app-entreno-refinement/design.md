# Design: App Entreno Refinement

## Technical Approach

The refinement focuses on transitioning from an exercise-based progression to a set-based progression with automated rest periods. We will implement a state machine within `SessionController.jsx` to manage the flow between active sets and rest periods (micro and macro pauses). Data will be normalized in `plan.json` to ensure each entry represents a single trackable task.

## Architecture Decisions

### Decision: State Management for Progression

**Choice**: Use `currentSet` and `isResting` state variables in `SessionController.jsx`.
**Alternatives considered**: Creating a separate `RestingController` component.
**Rationale**: Keeping the state in `SessionController` allows for simpler transitions and avoids complex prop drilling or state syncing between two controllers. The `SessionController` already manages block and exercise indices.

### Decision: Rest Period Triggering

**Choice**: `SessionController` will conditionally render either the `ExerciseCard` or a new `RestingView`.
**Alternatives considered**: Adding resting logic inside `ExerciseCard`.
**Rationale**: `ExerciseCard` should remain focused on displaying exercise details and handling exercise-specific logic (like the internal timer for 'timer' type exercises). Rest periods are a session-level concern.

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline Resting Logic | Increases `ExerciseCard` complexity. | Rejected |
| Separate Controller | Overhead of state synchronization. | Rejected |
| Controller-level State | Simple, centralized control of the flow. | **Chosen** |

## Data Flow

Data flows from `plan.json` through the `SessionController` which determines the current state (Exercise vs. Rest) and passes the relevant configuration to sub-components.

```
[plan.json] ──→ [SessionController] ──┬──→ [ExerciseCard] (active set)
                                      └──→ [Timer] (during rest)
```

1. `SessionController` identifies exercise type and set count.
2. User finishes a set → `SessionController` updates `isResting = true`.
3. `SessionController` renders `Timer` with `micro_pause` or `macro_pause`.
4. Timer finishes or user skips → `SessionController` updates `currentSet` or `exerciseIndex` and sets `isResting = false`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/data/plan.json` | Modify | Split composite exercises (e.g., "interna y externa x brazo" -> 2 entries). Normalize names. |
| `src/features/menu/MainMenu.jsx` | Modify | Center headers using Tailwind `text-center`. |
| `src/features/preview/TrainingPreview.jsx` | Modify | Center headers. Remove redundant value suffixes in the exercise list. |
| `src/features/session/SessionController.jsx` | Modify | Add `currentSet` and `isResting` state. Implement state machine for set/rest transitions. |
| `src/features/session/ExerciseCard.jsx` | Modify | Add "Set X of Y" indicator for 'sets' type exercises. Update `onNext` to signal set completion. |
| `src/features/session/Timer.jsx` | Existing | Utilized for rest periods. |

## Interfaces / Contracts

The `SessionController` will pass a new prop or handle a modified `onNext` behavior from `ExerciseCard`:

```javascript
// ExerciseCard.jsx
<ExerciseCard 
  exercise={currentExercise}
  currentSet={currentSet}
  onNext={handleNextSet} // Signal that the current set is done
/>
```

The `plan.json` structure remains compatible but data content is refined:
```json
{
  "name": "Rotación hombro banda (interna)",
  "type": "sets",
  "sets": 2,
  "reps": 10
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | State transitions in `SessionController` | Verify that finishing a set triggers rest state if micro_pause is configured. |
| Unit | Data splitting | Verify `plan.json` integrity and exercise count. |
| Integration | Timer completion | Verify that `Timer` calling `onComplete` triggers the next state in the controller. |

## Migration / Rollout

No data migration required as the schema is unchanged, only the content of `plan.json` is refined for better granularity.

## Open Questions

- [ ] Should we allow global disabling of rest timers in settings? (Postponed for now).
- [ ] How to handle exercises that have 'value' but are not 'sets' type? (Keep current behavior: single 'next' action).
