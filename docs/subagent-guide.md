# Subagent Guide

This guide covers how to create, configure, and use subagents effectively with Claude Code.

## Reference Documentation

For the most current information, fetch:
- https://code.claude.com/docs/en/sub-agents

## What Are Subagents?

Subagents are **pre-configured AI personalities** that Claude Code can delegate tasks to. They provide:

- **Context Isolation**: Each subagent has its own context window
- **Specialization**: Custom prompts for specific domains
- **Tool Control**: Granular permissions for each subagent
- **Reusability**: Share subagents across projects and teams

## When to Use Subagents

### Good Use Cases

1. **Code Review**: Specialized reviewer with security focus
2. **Testing**: Test runner that fixes failures automatically
3. **Research**: Read-only exploration of codebase
4. **Debugging**: Systematic problem-solving
5. **Documentation**: Generate and update docs

### When NOT to Use Subagents

1. Simple, quick tasks (overhead not worth it)
2. Tasks requiring main conversation context
3. Interactive workflows needing user feedback

## Subagent Types

### Built-in Subagents

| Name | Model | Purpose | Tools |
|------|-------|---------|-------|
| **Explore** | Haiku | Fast codebase search | Read, Grep, Glob, limited Bash |
| **Plan** | Sonnet | Research for planning | Read, Grep, Glob, Bash |
| **General** | Sonnet | Complex multi-step tasks | All tools |

### Custom Subagents

Defined in Markdown files:
- **Project-level**: `.claude/agents/*.md`
- **User-level**: `~/.claude/agents/*.md`

Project-level takes precedence over user-level.

## Creating Subagents

### File Format

```markdown
---
name: subagent-name
description: Clear description with trigger conditions
tools: Tool1, Tool2, Tool3  # Optional
model: sonnet               # Optional
permissionMode: default     # Optional
skills: skill1, skill2      # Optional
---

System prompt content here.

Include:
- Role definition
- Step-by-step process
- Output format expectations
```

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (kebab-case) |
| `description` | Yes | When to invoke (include trigger words!) |
| `tools` | No | Comma-separated list; inherits all if omitted |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` |
| `permissionMode` | No | `default`, `acceptEdits`, `bypassPermissions`, `plan` |
| `skills` | No | Skills to auto-load |

### Available Tools

```
Read        - Read file contents
Edit        - Modify existing files  
Write       - Create new files
Bash        - Execute shell commands
Grep        - Search file contents
Glob        - Find files by pattern
[MCP tools] - Any configured MCP server tools
```

## Writing Effective Descriptions

The description determines when Claude automatically delegates. Include:

1. **What**: The subagent's expertise
2. **When**: Trigger conditions
3. **Proactive keywords**: "Use PROACTIVELY", "MUST BE USED"

### Good Examples

```yaml
description: Expert code reviewer. Use PROACTIVELY after writing or modifying code.
description: Test automation specialist. MUST BE USED when tests fail or new tests are needed.
description: Security auditor for auth and payment code. Use PROACTIVELY before merging PRs.
```

### Bad Examples

```yaml
description: Helps with code  # Too vague, no trigger
description: Reviews things   # No specific domain or trigger
description: Testing helper   # Missing proactive language
```

## Writing System Prompts

Structure your system prompts clearly:

```markdown
You are a [role description].

## When Invoked
1. First immediate action
2. Second step
3. Begin work without asking questions

## Process
[Detailed workflow instructions]

## Output Format
[Expected structure of responses]

## Tips
[Domain-specific guidance]
```

### Prompt Best Practices

1. **Be specific**: Detailed instructions beat vague ones
2. **Define the workflow**: Step-by-step process
3. **Show output format**: Examples help
4. **Include guardrails**: What NOT to do
5. **Add tips**: Domain expertise

## Subagent Invocation

### Automatic Delegation

Claude automatically delegates when:
- Task matches subagent description
- Description contains proactive keywords
- Context suggests specialization needed

### Explicit Invocation

```
> Use the test-runner subagent to fix failing tests
> Have the code-reviewer subagent check my changes
> Ask the researcher to find all authentication code
```

## Advanced Features

### Chaining Subagents

```
> First use researcher to understand the auth system,
  then use code-reviewer to check my changes
```

### Resumable Subagents

Subagents can be resumed to continue previous work:

```
> Use the researcher agent to analyze the auth module
[Agent returns with agentId: "abc123"]

> Resume agent abc123 and now look at the session management
[Agent continues with full context]
```

### CLI Configuration

For session-specific subagents:

```bash
claude --agents '{
  "quick-check": {
    "description": "Quick code check",
    "prompt": "You are a fast code checker...",
    "tools": ["Read", "Grep"],
    "model": "haiku"
  }
}'
```

## Best Practices

### Design

1. **Single responsibility**: One subagent, one purpose
2. **Minimal tools**: Only grant necessary permissions
3. **Clear triggers**: Specific description conditions
4. **Thorough prompts**: Detailed is better than vague

### Team Usage

1. **Version control**: Check `.claude/agents/` into git
2. **Documentation**: Explain each subagent's purpose
3. **Iterate**: Refine based on usage observations
4. **Share patterns**: Reuse effective subagents

### Performance

1. **Use Haiku** for fast, simple tasks
2. **Use Sonnet** for complex reasoning
3. **Use Opus** for critical, complex analysis
4. **Use `inherit`** for consistency with main conversation

## Troubleshooting

### Subagent Not Being Used

1. Check description has trigger keywords
2. Verify name is unique
3. Ensure file is in correct location
4. Use `/agents` to verify it's loaded

### Subagent Making Mistakes

1. Add more specific instructions
2. Include examples in prompt
3. Limit tool access
4. Test with explicit invocations first

### Context Issues

1. Use subagents for isolated tasks
2. Clear main context with `/clear` between tasks
3. Use resumable subagents for long research

## Example Subagents

See `/templates/agents/` for complete examples:
- `code-reviewer.md` - Code quality review
- `debugger.md` - Systematic debugging
- `researcher.md` - Codebase research
