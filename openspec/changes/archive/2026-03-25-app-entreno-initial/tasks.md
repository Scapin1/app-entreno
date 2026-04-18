# Tasks: Initial Training App Implementation

## 1. Setup & Foundations
- [ ] 1.1 Create `package.json` with React, Tailwind CSS, and DaisyUI dependencies.
- [ ] 1.2 Initialize Tailwind config with DaisyUI plugin and a high-contrast theme.
- [ ] 1.3 Create folder structure (`src/features`, `src/shared`, `src/data`).
- [ ] 1.4 Create `src/data/plan.json` with the complete training plan (4 days).

## 2. Feature: Main Menu
- [ ] 2.1 Implement `MainMenu.jsx` showing the list of 4 training days.
- [ ] 2.2 Add navigation state to handle screen switching.

## 3. Feature: Training Preview
- [ ] 3.1 Implement `TrainingPreview.jsx` with full exercise list.
- [ ] 3.2 Add "Implements Required" section (banda, mancuerna, barra, etc).
- [ ] 3.3 Add "Start Warm-up" and "Back" buttons.

## 4. Feature: Training Session (Engine)
- [ ] 4.1 Implement `SessionController.jsx` to manage block/exercise indices.
- [ ] 4.2 Create `ExerciseCard.jsx` to handle different exercise types (manual, reps, timer).
- [ ] 4.3 Create `Timer.jsx` component for countdowns.
- [ ] 4.4 Implement "Block Finished" screen between Warm-up, Main Phase, and Cooldown.
- [ ] 4.5 Add "Back/Prev" exercise functionality for error correction.

## 5. UI/UX Polish
- [ ] 5.1 Apply high-contrast theme across all screens.
- [ ] 5.2 Ensure responsive design for mobile (big buttons, large fonts).
- [ ] 5.3 Verify all exercise modes from the "plani" are correctly represented.
