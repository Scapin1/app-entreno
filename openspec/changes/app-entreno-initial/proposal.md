# Proposal: Initial Training App Structure

## Intent
Create the foundational structure for a React-based training application with a vertical slice architecture. The app will consume a static JSON plan and support versatile exercise types (sets/reps and time-based).

## Scope
- Setup directory structure (`src/features`, `src/shared`, `src/data`).
- Define the comprehensive JSON schema for the provided training plan.
- Implement basic routing/navigation between 3 screens: Menu, Preview, and Session.

## Approach
1. **Data layer**: Create `src/data/plan.json` containing all 4 days from the provided plan.
2. **Architecture**: Use Vertical Slices. Each screen is a feature.
3. **Session Engine**: Create a "Training Controller" in the `training-session` feature that can handle both countdowns (time-based) and manual completion (reps-based).
4. **Shared Components**: High-level Layout, Buttons, and Timer components to avoid duplication.

## Affected Areas
- `src/data/plan.json`
- `src/features/main-menu/*`
- `src/features/training-preview/*`
- `src/features/training-session/*`
- `src/App.js` (Navigation logic)

## Risks
- **Complexity of Day 4**: The bike interval at the end of Day 4 is a special case. We need to ensure the session engine can handle nested intervals.
- **State Management**: Since it's a "front-only" app, we'll use React State/Context to keep track of the current exercise during the session.
