## Exploration: add-missing-days-and-git-sync

### Current State
- The training plan in `src/data/plan.json` only contains **Día 1: Fuerza** (Push/Pull focus) and **Día 2: Resistencia/Funcional** (Cardio/Stability circuit).
- The application (React-based) already includes logic for handling different exercise types (`reps`, `sets`, `timer`, `manual`) and supports **circuit flow** with automated micro and macro pauses.
- Most files in `src/` and configuration files like `tailwind.config.js` and `package.json` are currently **untracked** in git.
- The only commit in the repository is "Initial commit".

### Affected Areas
- `src/data/plan.json` — New workout days (3 and 4) need to be added.
- `git index` — All untracked files need to be staged.
- `git history` — A new commit needs to be created to sync the repository with current progress.

### Proposed Workout Days (3 & 4)

**Día 3: Tren Inferior y Core (Fuerza)**
- **Focus**: Lower body strength and core stability.
- **Blocks**:
  1. **Calentamiento**: Hip bridges, squats, plank.
  2. **Fase Principal**: Sets/Reps focus.
     - Hip Thrust (4 sets, 10 reps)
     - Dumbbell Lunges (3 sets, 12 reps, alternating)
     - Romanian Deadlift (4 sets, 8 reps)
     - Side Plank (3 sets, 30s timer, alternating)
     - Deadbug (3 sets, 15 reps)
  3. **Vuelta a la calma**: Walking/Elliptic, Stretching.

**Día 4: Full Body Circuit (Funcional)**
- **Focus**: High-intensity full body circuit.
- **Blocks**:
  1. **Calentamiento**: General articular movement, light cardio.
  2. **Fase Principal**: Circuit focus (3 rounds).
     - Jumping Jacks (40s)
     - Mountain Climbers (40s)
     - Dumbbell Military Press (40s)
     - Jump Squats (40s)
     - Band Row (40s)
     - Dynamic Plank (40s)
  3. **Vuelta a la calma**: Light intensity cardio (600s).

### Approaches
1. **Incremental Addition & Git Sync** — Add the missing days to `plan.json`, verify they appear in the UI, and then perform a single `git add .` followed by a descriptive commit.
   - Pros: Simple, captures all recent work in one logical point.
   - Cons: One large commit instead of separate ones for each refinement (circuit flow, timers, UI, data).
   - Effort: Low

### Recommendation
Proceed with **Approach 1**. Since the current state has many untracked files representing a cohesive state of refinements, a single "sync" commit is appropriate at this stage.

### Risks
- **Data Structure Consistency**: Adding new days to `plan.json` must strictly follow the existing schema to avoid breaking `SessionController.jsx` or `TrainingPreview.jsx`.
- **Untracked Secrets**: Ensure no sensitive information is present in the untracked files before running `git add .`. (None identified in `src/` or root so far).

### Ready for Proposal
Yes. The next step is to create a proposal to implement the missing days and sync the repository.
