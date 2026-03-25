# Proposal: Circuit Flow and Timer Refinements

## Problem
The current training application needs more specialized logic for different types of training sessions:
1. **Circuit Training (Day 2):** Resistance sessions require a round-robin approach where exercises are performed sequentially with fixed work/rest intervals (e.g., 45s work, 30s rest).
2. **Side Awareness:** Some strength exercises (like Pallof Press) are performed one side at a time, and the UI should indicate which side to work on, alternating between sets.
3. **Timer Preparation:** High-intensity strength sets (e.g., 20s hold) require a small buffer (5s) to get into position after starting the timer.
4. **Navigation:** Users need a consistent way to navigate back between screens (Session -> Preview -> Menu).

## Solution
1. **Implement Circuit Logic:** Update `SessionController` to handle blocks of type `circuit`, cycling through all exercises before repeating sets, and applying micro/macro pauses correctly.
2. **Alternating Sides:** Enhance `ExerciseCard` to detect if an exercise is `alternating` and display "Lado Izquierdo" or "Lado Derecho" based on the current set number.
3. **Timer Prep Phase:** Update the `Timer` component to include an optional 5-second "Preparate" phase before the actual countdown begins.
4. **Global Header:** Move the navigation title and back button to a global header in `App.jsx` for consistent navigation across all screens.

## Scope
- `src/App.jsx`: Add global header and centralized navigation logic.
- `src/features/session/SessionController.jsx`: Implement circuit logic and round-robin flow.
- `src/features/session/ExerciseCard.jsx`: Add alternating sides display and 20s strength timer trigger.
- `src/features/session/Timer.jsx`: Implement prep phase logic.
- `src/data/plan.json`: Update exercise and block definitions to support these features.
