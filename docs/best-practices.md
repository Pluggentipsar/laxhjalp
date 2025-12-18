# CLAUDE.md Best Practices

This guide covers how to write effective CLAUDE.md files for Claude Code projects.

## Core Principles

### 1. Less Is More

Every instruction in your CLAUDE.md goes into every conversation. This means:
- Extra instructions dilute Claude's attention
- Irrelevant context wastes tokens
- Over-specification leads to worse instruction-following

**Rule of thumb**: If an instruction isn't applicable to 80%+ of sessions, it probably shouldn't be in CLAUDE.md.

### 2. Progressive Disclosure

Instead of putting everything in CLAUDE.md:
- Put essential info in CLAUDE.md
- Use slash commands for specific workflows
- Reference documentation for details
- Let Claude discover patterns from code

### 3. The WHAT/WHY/HOW Framework

Structure your CLAUDE.md around three questions:

**WHAT** - What is this project?
- Tech stack
- Project structure
- Key files and directories

**WHY** - Why is it structured this way?
- Purpose of different parts
- Architectural decisions
- Conventions and patterns

**HOW** - How should Claude work here?
- Commands to run
- Verification steps
- Boundaries and constraints

## What to Include

### ✅ Always Include

```markdown
## Commands
- npm run dev: Start development server
- npm run test: Run tests
- npm run lint: Check code style

## Key Directories
- src/: Main source code
- tests/: Test files

## Verification
Run these before committing:
1. npm run lint
2. npm run test
```

### ✅ Include When Relevant

```markdown
## Environment Setup
- Uses Node 18+
- Requires Docker for database

## Important Patterns
- All API calls go through src/services/
- State management uses React Query
```

### ❌ Do NOT Include

**Style guidelines** - Use linters instead
```markdown
# BAD
- Use 2-space indentation
- Single quotes for strings
- Trailing commas required
```

**Obvious patterns** - Claude learns from code
```markdown
# BAD
- Use async/await instead of callbacks
- Prefer const over let
```

**Rarely-used instructions** - Use slash commands
```markdown
# BAD
- When creating a new microservice, first...
- When deploying to production, remember to...
```

## Optimal Length

| Project Complexity | Target Lines | Max Lines |
|-------------------|--------------|-----------|
| Simple | 30-50 | 75 |
| Medium | 50-100 | 150 |
| Complex | 100-150 | 200 |

Going over 200 lines usually indicates you're including too much. Consider:
- Moving workflows to slash commands
- Moving documentation to separate files
- Letting Claude discover patterns naturally

## Common Mistakes

### 1. Treating CLAUDE.md as Documentation

CLAUDE.md is for **Claude**, not humans. It should be operational, not explanatory.

❌ Bad:
```markdown
## Architecture
Our system uses a microservices architecture with 
event-driven communication. Each service is deployed
independently using Kubernetes...
```

✅ Good:
```markdown
## Architecture
- Microservices in /services/*
- Events via RabbitMQ
- Each service has its own README
```

### 2. Duplicating Linter Rules

❌ Bad:
```markdown
## Code Style
- Use PascalCase for components
- Use camelCase for functions
- Maximum line length: 80 characters
```

✅ Good:
```markdown
## Code Quality
Run `npm run lint` - uses ESLint config in .eslintrc
```

### 3. Over-Specifying Workflows

❌ Bad:
```markdown
## Adding a New Component
1. Create folder in src/components/
2. Add index.tsx with the component
3. Add Component.test.tsx for tests
4. Add Component.stories.tsx for Storybook
5. Export from src/components/index.ts
6. Add to the components documentation
```

✅ Good:
```markdown
## Components
- Follow existing patterns in src/components/
- See UserCard/ for a good example
```

Or better, make it a slash command.

## Testing Your CLAUDE.md

After writing or updating your CLAUDE.md:

1. **Start a new session** - Run `/clear` or start fresh
2. **Ask a simple question** - "What commands can I run?"
3. **Try a common task** - "Add a test for the login function"
4. **Check for confusion** - Does Claude understand the project?
5. **Iterate** - Adjust based on observed behavior

## Template Sections

### Minimal Template
```markdown
# Project Name

Brief description.

## Commands
- [dev command]
- [test command]
- [lint command]

## Verification
1. Run lint
2. Run tests
```

### Standard Template
```markdown
# Project Name

> Brief description

## Tech Stack
- Key technologies

## Commands
- Development commands
- Quality commands

## Key Files
- Important directories

## Verification
- Quality checklist

## Boundaries
- Safe to edit
- Never touch
```
