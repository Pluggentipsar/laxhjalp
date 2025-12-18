# Agent Skills Guide

This guide covers how to create, structure, and use Agent Skills with Claude Code.

## What Are Agent Skills?

Agent Skills are **modular capability packages** that extend Claude's abilities. They consist of:

- **SKILL.md** - Instructions and metadata
- **Scripts** - Executable helper code
- **Resources** - Templates, examples, reference material

Skills use **progressive disclosure**: only the name and description load initially; full content loads when relevant.

## Skill Anatomy

### Basic Structure

```
skills/
└── my-skill/
    ├── SKILL.md           # Required: Main instructions
    ├── scripts/           # Optional: Helper scripts
    │   └── helper.py
    └── resources/         # Optional: Templates, examples
        └── template.md
```

### SKILL.md Format

```markdown
---
name: my-skill
description: Brief description for discovery (1-2 sentences)
---

# Skill Title

## When to Use This Skill

Clear triggers that indicate this skill should be activated.

## Prerequisites

Required tools, dependencies, or setup.

## Instructions

Step-by-step guidance for using this skill.

## Examples

Input/output examples showing expected behavior.

## Verification

How to confirm the skill worked correctly.
```

## Progressive Disclosure

Skills use layered loading to manage context efficiently:

### Level 1: Discovery (Always Loaded)
```yaml
name: pdf-forms
description: Fill and manipulate PDF forms programmatically
```

Just enough for Claude to know when the skill applies.

### Level 2: Core Instructions (On Activation)
```markdown
## When to Use This Skill
Use when user asks to fill PDF forms, extract form data, or create fillable PDFs.

## Instructions
1. Detect PDF form type...
2. Extract field information...
```

### Level 3: Reference Material (On Demand)
```markdown
See `resources/form-types.md` for supported PDF form types.
See `scripts/pdf-utils.py` for helper functions.
```

Only loaded when needed for the specific task.

## Creating Effective Skills

### 1. Start with Evaluation

Before creating a skill, identify:
- Where does Claude struggle with this task?
- What context is missing?
- What steps are error-prone?

Run Claude on representative tasks, observe failures, then build skills to address gaps.

### 2. Write Clear Triggers

The description must clearly indicate when to activate:

✅ Good:
```yaml
description: Fill out PDF forms, extract form fields, create fillable PDFs from documents
```

❌ Bad:
```yaml
description: PDF handling utilities
```

### 3. Structure for Scalability

When your SKILL.md gets unwieldy:

1. **Split into multiple files**
   ```markdown
   See `reference/api-details.md` for full API documentation.
   ```

2. **Separate rarely-used content**
   ```markdown
   For edge cases, see `resources/edge-cases.md`.
   ```

3. **Keep core instructions tight**
   - Main SKILL.md: 50-100 lines
   - Reference files: As long as needed

### 4. Use Code Strategically

Code in skills can be:

**Executable Tools**
```python
# scripts/validate_pdf.py
# Claude runs this to validate PDF structure
import pypdf
...
```

**Documentation**
```python
# scripts/example_usage.py
# Claude reads this as a reference
def example():
    """Shows how to use the PDF library"""
    ...
```

Be clear about intent. Document whether scripts are meant to be run or read.

### 5. Include Verification

Every skill should explain how to verify success:

```markdown
## Verification

After filling the form:
1. Open the PDF and visually confirm fields are filled
2. Run `scripts/validate_filled.py output.pdf`
3. Check that all required fields have values
```

## Skill Patterns

### The How-To Skill

Teaches Claude to perform a specific procedure.

```markdown
---
name: database-migration
description: Create and run database migrations safely
---

## Instructions

### Creating a Migration
1. Generate migration file: `alembic revision --autogenerate -m "description"`
2. Review the generated migration
3. Test on development database first
...
```

### The Integration Skill

Connects Claude to external services.

```markdown
---
name: slack-notifications
description: Send notifications to Slack channels via webhook
---

## Prerequisites
- SLACK_WEBHOOK_URL environment variable

## Instructions
1. Read webhook URL from environment
2. Format message according to Slack API
3. POST to webhook endpoint
...
```

### The Quality Skill

Enforces standards and best practices.

```markdown
---
name: api-review
description: Review API designs against company standards
---

## Instructions

### Check Each Endpoint For:
- [ ] Consistent naming (kebab-case)
- [ ] Proper HTTP methods
- [ ] Complete error responses
- [ ] Authentication requirements documented
...
```

### The Template Skill

Generates boilerplate from templates.

```markdown
---
name: new-service
description: Create a new microservice with standard structure
---

## Instructions
1. Create service directory from template
2. Update service name in all files
3. Register with service discovery
...

## Reference
See `resources/service-template/` for the template structure.
```

## Security Considerations

### Use Only Trusted Skills

Skills can instruct Claude to:
- Execute arbitrary code
- Access files and networks
- Modify your system

Only use skills from:
- Your own creation
- Official Anthropic skills
- Thoroughly audited third-party skills

### Audit Third-Party Skills

Before using any external skill:

1. **Read SKILL.md completely**
2. **Review all scripts** for unexpected behavior
3. **Check for network calls** that could exfiltrate data
4. **Verify file access** is appropriate
5. **Test in a sandboxed environment** first

## Iteration and Improvement

### Monitor Usage

Watch how Claude uses your skills:
- Does it activate at the right times?
- Does it follow instructions correctly?
- Does it get confused at certain steps?

### Capture Patterns

When Claude solves something well:
```
# In the conversation
"Add this approach to the skill for future use"
```

### Refine Continuously

Skills are living documents:
1. Start minimal
2. Add based on observed failures
3. Remove what doesn't help
4. Keep iterating

## Future of Skills

Skills will evolve to support:
- **Auto-creation**: Claude generates skills from successful patterns
- **Sharing**: Skill libraries and marketplaces
- **MCP Integration**: Skills that coordinate with MCP servers
- **Versioning**: Track skill evolution over time
