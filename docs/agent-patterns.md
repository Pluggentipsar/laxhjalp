# Agent Patterns for Claude Code

This guide covers effective patterns for building and using agents with Claude Code.

## The Agent Loop

All effective agents follow this fundamental loop:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   GATHER CONTEXT → TAKE ACTION → VERIFY WORK   │
│         ↑                              │        │
│         └──────────────────────────────┘        │
│                    REPEAT                       │
└─────────────────────────────────────────────────┘
```

### Gather Context
- Read relevant files
- Search codebase
- Fetch external data
- Understand the problem fully

### Take Action
- Execute changes
- Run commands
- Create files
- Call tools

### Verify Work
- Run tests
- Check linting
- Validate output
- Get feedback

## Common Workflow Patterns

### 1. Explore → Plan → Code → Commit

Best for: Feature development, complex changes

```
1. EXPLORE: Read relevant files, understand scope
   "Read the authentication module and related tests"

2. PLAN: Create implementation plan
   "Think hard about how to add OAuth support"

3. CODE: Implement the solution
   "Implement the OAuth flow as planned"

4. COMMIT: Verify and commit
   "Run tests, then commit with a descriptive message"
```

**Key insight**: Steps 1-2 are crucial. Without them, Claude jumps straight to coding and often misses important context.

### 2. Test-Driven Development (TDD)

Best for: Well-defined features, bug fixes

```
1. WRITE TESTS: Create tests for expected behavior
   "Write tests for the new validation function"

2. VERIFY FAILURE: Confirm tests fail
   "Run the tests - they should fail"

3. IMPLEMENT: Write code to pass tests
   "Implement the validation to pass all tests"

4. REFACTOR: Clean up while keeping tests green
   "Refactor for clarity, keep tests passing"
```

**Key insight**: Having tests as a target gives Claude concrete success criteria.

### 3. Visual Iteration

Best for: UI development, design implementation

```
1. IMPLEMENT: Create initial version
   "Build the dashboard component"

2. SCREENSHOT: Capture visual result
   "Take a screenshot of the rendered component"

3. EVALUATE: Compare to expectations
   "Compare to the design mock, note differences"

4. ITERATE: Make improvements
   "Adjust spacing and colors to match design"
```

**Key insight**: Claude needs to see its output to improve it.

## Agent Architecture Patterns

### Simple Agent (Single Loop)

```
User Request → Claude → Tools → Response
```

Best for: Simple tasks, single-file changes

### Orchestrator-Workers

```
                    ┌── Worker 1 ──┐
User Request → Orchestrator ── Worker 2 ── → Combined Result
                    └── Worker 3 ──┘
```

Best for: Parallel research, multi-file changes

In Claude Code, use subagents:
```
"Use subagents to research each module, then combine findings"
```

### Evaluator-Optimizer

```
User Request → Generator → Evaluator ─┐
                   ↑                   │
                   └───────────────────┘
```

Best for: Quality-critical output, iterative refinement

In Claude Code:
```
"Generate the API design, then evaluate it against our standards, iterate until satisfied"
```

## Context Management

### Problem: Context Window Fills Up

Long sessions accumulate irrelevant context.

**Solutions:**
1. Use `/clear` between unrelated tasks
2. Use subagents for research (isolated context)
3. Use `/compact` to summarize history

### Problem: Information Overload

Claude loses focus with too much information.

**Solutions:**
1. Be specific about what to read
2. Use grep/search to find relevant sections
3. Progressive disclosure: read headers first

### Problem: Losing Track

On complex tasks, Claude may lose the thread.

**Solutions:**
1. Have Claude create a checklist file
2. Use Plan.md for long builds
3. Periodically summarize progress

## Tool Design Principles

When creating tools (MCP, scripts, slash commands):

### 1. Clear Boundaries
Tools should do one thing well. Combine tools for complex actions.

### 2. Self-Documenting
Tool names and parameters should be obvious:
```
✅ Good: search_files(pattern, directory)
❌ Bad: sf(p, d)
```

### 3. Helpful Errors
Return actionable error messages:
```
✅ Good: "File not found: /src/utils.ts. Did you mean /src/util.ts?"
❌ Bad: "Error: ENOENT"
```

### 4. Predictable Output
Tools should return consistent formats:
```
✅ Good: Always returns { success: bool, data?: T, error?: string }
❌ Bad: Sometimes returns data, sometimes throws
```

## Verification Strategies

### Rules-Based Verification
Best when you have clear, testable rules:
- Linting
- Type checking
- Unit tests
- Schema validation

### Visual Verification
Best for UI and design work:
- Screenshots
- Rendered previews
- Diff visualization

### LLM-as-Judge
Best for fuzzy criteria:
- Code quality review
- Documentation clarity
- Style consistency

**Warning**: LLM-as-judge is slow and less reliable. Use rules-based verification when possible.

## Multi-Agent Patterns

### Using Subagents Effectively

Subagents preserve the main conversation context by operating in isolation. Use them for:

1. **Research tasks**: Explore subagent finds info without bloating main context
2. **Code review**: Dedicated reviewer with security focus
3. **Testing**: Test runner that can iterate on failures
4. **Debugging**: Systematic problem-solving in isolation

### Parallel Workspaces

Use multiple Claude sessions with git worktrees:
```bash
git worktree add ../feature-a feature-a
git worktree add ../feature-b feature-b
```

Run Claude in each, switch between them.

### Subagent Chains

Use multiple subagents for complex workflows:
```
> First use the researcher subagent to understand the auth system,
  then use the code-reviewer subagent to check my changes
```

### Resumable Subagents

For long research tasks, resume subagents:
```
> Use researcher to start analyzing the payment module
[Returns agentId: "abc123"]

> Resume agent abc123 and now look at error handling
[Continues with full context]
```

### Review Pipeline

Have different Claude sessions for different stages:
1. Claude A: Implements feature
2. Claude B: Reviews code (use code-reviewer subagent)
3. Claude C: Integrates feedback

### Specialist Subagents

Create subagents for different modes:
- **Explore subagent**: Fast, read-only research (Haiku)
- **Implementation agent**: Action-focused (Sonnet)
- **Review agent**: Critical evaluation (Sonnet/Opus)

## Error Recovery

### When Claude Gets Stuck

1. **Interrupt** (Escape) and provide guidance
2. **Reset context** with /clear if it's confused
3. **Provide examples** of what you want
4. **Simplify the task** - break into smaller pieces

### When Code Is Wrong

1. Ask Claude to **explain its reasoning**
2. Point out the **specific issue**
3. Provide the **expected behavior**
4. Have Claude **fix and verify**

### When Tests Fail

1. Don't just say "fix it" - share the error
2. Ask Claude to **understand the failure first**
3. Have Claude **verify the fix** with the same test
