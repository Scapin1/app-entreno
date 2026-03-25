# Design: Circuit Flow and Timer Refinements

## Architecture
This change enhances the core session components to handle specialized training flows (circuits) and specific exercise needs (alternating sides and timer preparation).

### 1. Circuit Flow Logic
In `SessionController.jsx`, blocks marked with `type: "circuit"` in `plan.json` are treated differently:
- **Round-Robin Execution:** Instead of completing all sets of one exercise before moving to the next, the controller cycles through all exercises in the block for one set (round), then repeats the entire cycle for the next set.
- **Rest Interval Handling:** 
  - `micro_pause` is applied between exercises in the same round.
  - `macro_pause` is applied after the last exercise of a round before starting the next round.
- **Completion:** The block finishes after all exercises have been completed for `total_sets` times.

### 2. Alternating Sides Display
In `ExerciseCard.jsx`, if the exercise object has `alternating: true`:
- Displays a prominent label "Lado Izquierdo" (odd sets) or "Lado Derecho" (even sets).
- This provides visual guidance for single-sided exercises like the Pallof Press or single-arm movements.

### 3. Timer Component Enhancements
The `Timer` component is updated to support a preparation phase:
- **`withPrep` Prop:** When enabled, the timer starts a 5-second countdown ("Preparate") before starting the main exercise timer.
- **Visual Distinction:** During the prep phase, the progress circle and text use a different color (warning/orange) to distinguish it from the actual work period (primary/blue).
- **Automatic Transition:** The timer automatically starts the main countdown after the prep phase ends.

### 4. Global Navigation Header
Centralized in `App.jsx`:
- A fixed header containing the app title "Entreno App" and a back button.
- The back button visibility is controlled by the current screen state (hidden on the 'menu' screen).
- Centralized `handleGoBack` function manages transitions between `session` -> `preview` -> `menu`.

## Component Details
### `Timer.jsx`
- New state: `isPreparing` and `prepTimeLeft`.
- Logic in `useEffect` to handle the transition from preparation to the main timer.
- Dynamic color application based on `isPreparing`.

### `ExerciseCard.jsx`
- Logic to determine side: `currentSet % 2 !== 0 ? 'Izquierdo' : 'Derecho'`.
- Conditional rendering of the "Timer 20s" button for Pallof Press exercises.
- Conditional `autoStart` for timers when in a circuit block.
- Automatic execution of `onTimerComplete` (linked to `handleNext`) when a circuit timer finishes.

### `SessionController.jsx`
- `handleNext` logic updated with a dedicated conditional for `currentBlock.type === 'circuit'`.
- `handleRestComplete` similarly updated to handle circuit progression.
- Integration with `BlockSummary` for block completion feedback.
`handleRestComplete` similarly updated to handle circuit progression.
- Integration with `BlockSummary` for block completion feedback.
