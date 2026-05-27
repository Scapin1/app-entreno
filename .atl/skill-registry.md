# Skill Registry

## User Skills
### Code & Review
- **branch-pr**: Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review. (Scope: user, Location: `~/.config/opencode/skills/branch-pr/SKILL.md`)
- **chained-pr**: Split oversized changes into chained PRs. Trigger: PRs over 400 lines, stacked PRs, review slices. (Scope: user, Location: `~/.config/opencode/skills/chained-pr/SKILL.md`)
- **work-unit-commits**: Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs. (Scope: user, Location: `~/.config/opencode/skills/work-unit-commits/SKILL.md`)
- **comment-writer**: Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews. (Scope: user, Location: `~/.config/opencode/skills/comment-writer/SKILL.md`)

### SDD Workflow
- **sdd-init**: Bootstrap SDD context and project configuration. Trigger: sdd init, iniciar sdd, openspec init. (Scope: user, Location: `~/.config/opencode/skills/sdd-init/SKILL.md`)
- **sdd-onboard**: Walk through the full SDD cycle on a real codebase. (Scope: user, Location: `~/.config/opencode/skills/sdd-onboard/SKILL.md`)
- **sdd-explore**: Explore SDD ideas before committing to a change. (Scope: user, Location: `~/.config/opencode/skills/sdd-explore/SKILL.md`)
- **sdd-propose**: Create SDD change proposals with intent, scope, and approach. (Scope: user, Location: `~/.config/opencode/skills/sdd-propose/SKILL.md`)
- **sdd-spec**: Write SDD delta specs with requirements and scenarios. (Scope: user, Location: `~/.config/opencode/skills/sdd-spec/SKILL.md`)
- **sdd-design**: Create SDD technical design and architecture approach. (Scope: user, Location: `~/.config/opencode/skills/sdd-design/SKILL.md`)
- **sdd-tasks**: Break SDD changes into implementation tasks. (Scope: user, Location: `~/.config/opencode/skills/sdd-tasks/SKILL.md`)
- **sdd-apply**: Implement SDD tasks from specs and design. (Scope: user, Location: `~/.config/opencode/skills/sdd-apply/SKILL.md`)
- **sdd-verify**: Execute tests and prove implementation matches specs. (Scope: user, Location: `~/.config/opencode/skills/sdd-verify/SKILL.md`)
- **sdd-archive**: Archive completed SDD changes by syncing delta specs. (Scope: user, Location: `~/.config/opencode/skills/sdd-archive/SKILL.md`)

### Documentation & Quality
- **cognitive-doc-design**: Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding. (Scope: user, Location: `~/.config/opencode/skills/cognitive-doc-design/SKILL.md`)
- **judgment-day**: Run blind dual review, fix confirmed issues, re-judge. Trigger: judgment day, dual review, adversarial review. (Scope: user, Location: `~/.config/opencode/skills/judgment-day/SKILL.md`)

### Tools
- **go-testing**: Go testing patterns including Bubbletea teatest, golden files. (Scope: user, Location: `~/.config/opencode/skills/go-testing/SKILL.md`)
- **issue-creation**: Create Gentle AI issues with issue-first checks. (Scope: user, Location: `~/.config/opencode/skills/issue-creation/SKILL.md`)
- **skill-creator**: Create LLM-first skills with valid frontmatter. (Scope: user, Location: `~/.config/opencode/skills/skill-creator/SKILL.md`)
- **skill-improver**: Audit and upgrade existing LLM-first skills. (Scope: user, Location: `~/.config/opencode/skills/skill-improver/SKILL.md`)
- **skill-registry**: Index available skills by trigger and path. (Scope: user, Location: `~/.config/opencode/skills/skill-registry/SKILL.md`)

## Project Conventions
- **AGENTS.md** (system): `/home/lucciano/.config/opencode/AGENTS.md` — Persona (Senior Architect), Engram protocol, skill loading rules.
- **opencode.json**: `/home/lucciano/.config/opencode/opencode.json` — Orchestrator agent with SDD sub-agents (all sdd-*), MCP config (context7, engram).
- **openspec/config.yaml**: `openspec/config.yaml` — Project SDD config: React+FastAPI stack, Vertical Slice architecture, strict_tdd: false.
- **backend/SPECS.md**: `backend/SPECS.md` — Auth, Profiles, Training Days, Sessions, Body Weight, Recovery, Analytics specs (Given/When/Then).
- **backend/TASKS.md**: `backend/TASKS.md` — Backend migration tasks (mostly completed).
