## Exploration: Automatic Exercise Transitions for Circuits

### Current State
The application currently supports circuit-based training blocks where exercises are performed in a round-robin fashion. While the basic flow was implemented, the documentation lacked the specific details regarding how the session automatically progresses from one exercise to the next when a timer completes.

### Affected Areas
- `src/features/session/SessionController.jsx` — Passes `handleNext` as the `onTimerComplete` callback to `ExerciseCard`.
- `src/features/session/ExerciseCard.jsx` — Detects when a timer finishes in a circuit block and triggers the progression callback automatically.
- `openspec/changes/archive/2026-03-25-circuit-flow-and-timer/design.md` — Updated to reflect this logic.
- `openspec/changes/archive/2026-03-25-circuit-flow-and-timer/tasks.md` — Updated to track this feature as a completed task.

### Approaches
1. **Manual Progression (Baseline)** — Users click "Siguiente" after every exercise.
   - Pros: Maximum control.
   - Cons: High friction during high-intensity circuits.
   - Effort: Low (already implemented).

2. **Automatic Progression (Implemented)** — Timers trigger the next exercise flow automatically.
   - Pros: Maintains training intensity, reduces interaction with the device during sweat-inducing workouts.
   - Cons: Might catch the user off guard if they need more rest.
   - Effort: Low (logic was already present but undocumented).

### Recommendation
The automatic progression is the preferred approach for circuits to maintain a high training rhythm. This has been documented in the `design.md` to ensure future maintenance understands the intent behind the `onTimerComplete` logic.

### Risks
- **Unexpected Transitions:** Users might find the automatic jump to the next exercise (or micro-pause) too fast if they are not prepared.
- **Solution:** The current implementation includes a `micro_pause` phase which serves as a buffer.

### Ready for Proposal
Yes — The documentation has been updated and the implementation verified in the codebase.
