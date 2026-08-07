# Claude Code Multi-Agent Setup

SAFe-inspired autonomous dev team running inside Claude Code.

---

## Agents

| Command | Role | Invoked by |
|---------|------|------------|
| `/sm` | Scrum Master / Orchestrator | Human — runs full pipeline |
| `/po` | Product Owner | SM or manually |
| `/ba` | Business Analyst | SM or manually |
| `/architect` | Software Architect | SM or manually |
| `/dev` | Senior Developer | SM or manually |
| `/tester` | QA Engineer | SM or manually |

---

## Usage

### Full pipeline (recommended)
```
/sm "Feature description: [what you want to build]"
```
The SM runs all 6 phases automatically and only asks you when there's a blocker.

### Manual invocation
```
/po "Write a story for: password reset feature"
/ba
/architect
/dev
/tester
```

---

## Workspace Files

All agents communicate via `.claude/workspace/`:

| File | Written by | Read by |
|------|-----------|---------|
| `story.md` | PO | BA, Architect, Dev, Tester |
| `analysis.md` | BA | Architect, Dev, Tester |
| `arch-decision.md` | Architect (Mode A) | Dev, Tester, Architect (Mode B) |
| `impl-report.md` | Dev | Tester, Architect (Mode B) |
| `test-report.md` | Tester | SM |
| `blockers.md` | Any agent | Human |

---

## Setup for a New Project

1. Copy the entire `.claude/` folder and `CLAUDE.md` into your project root
2. Fill in `CLAUDE.md` with your project's tech stack and structure
3. Run `/architect` with "analyse the existing codebase" to initialize `backlog.md`
4. Start building with `/sm "your first feature"`

---

## Persistent Memory

`.claude/backlog.md` is never cleared — it accumulates:
- Technical debt (TD-XX)
- Follow-up stories (FS-XX)
- Architecture decisions per feature
- Open questions
