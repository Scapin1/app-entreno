# Proposal: add-missing-days-and-git-sync

## Intent

The current workout plan in `src/data/plan.json` only contains two out of four planned days. Additionally, the repository is significantly out of sync with recent development, as core UI components (session controller, timer, preview logic) and configuration files are currently untracked. This proposal aims to complete the initial data set and establish a clean baseline in the git history.

## Scope

### In Scope
- **Data Completion**: Add Day 3 (Lower Body & Core) and Day 4 (Full Body Circuit) to `src/data/plan.json` following the established JSON schema.
- **Repository Synchronization**: Stage all untracked files in the root and `src/` directory (including UI components, logic, and `openspec/` documentation).
- **Progress Snapshot**: Create a descriptive git commit that captures all refinements made to the circuit flow, timers, and UI.

### Out of Scope
- Refactoring the `SessionController.jsx` or `TrainingPreview.jsx` logic.
- Adding new UI features beyond the data update.
- Modifying `.gitignore` unless a critical omission is found.

## Approach

1. **Schema-Compliant Data Update**: 
   - Add Day 3 using the `sets` type for strength exercises.
   - Add Day 4 using the `circuit` type for functional training.
2. **Visual Verification**: Run the application and ensure the new days are selectable in the `MainMenu`.
3. **Full Project Sync**: 
   - Execute `git add .` to track all project-related files (excluding those in `.gitignore`).
   - Create a commit with the message: `feat: add days 3 & 4 and sync project progress (UI, circuit flow, timers)`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/data/plan.json` | Modified | Added 2 new workout days. |
| Git Index | Modified | Staged untracked files and created a new commit. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data Schema Mismatch | Low | Follow existing structure of Days 1 and 2 exactly. |
| Untracked sensitive data | Low | Review `git status` output; verify no `.env` or secrets are staged. |

## Rollback Plan

- **Data**: Revert `src/data/plan.json` using `git checkout src/data/plan.json` (after commit) or manual deletion of the new JSON entries.
- **Git**: Use `git reset --soft HEAD~1` to undo the commit while keeping the changes staged, or `git reset --hard HEAD~1` to completely revert to the previous state.

## Dependencies

- None.

## Success Criteria

- [ ] `src/data/plan.json` contains 4 complete workout days.
- [ ] `git status` shows no untracked files (excluding `.gitignore` matches).
- [ ] `git log` shows a new commit summarizing the sync.
