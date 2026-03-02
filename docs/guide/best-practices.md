# Best Practices

Patterns and tips for writing effective Claude Code skills.

## Prompt Engineering for Skills

### Template Pattern

Provide output format templates to ensure consistent output:

```markdown
## Report structure
ALWAYS use this exact template:

# [Analysis Title]

## Executive summary
[One-paragraph overview]

## Key findings
- Finding 1 with data
- Finding 2 with data

## Recommendations
1. [Highest impact]
2. [Second priority]
```

### Examples Pattern

Provide input/output pairs to demonstrate expected behavior:

```markdown
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication

**Example 2:**
Input: Fixed null pointer when user has no avatar
Output: fix(user): handle missing avatar gracefully
```

### Conditional Workflow

Guide Claude through decision points:

```markdown
**Is this a new file?** → Follow "Creation workflow"
**Is this an existing file?** → Follow "Modification workflow"
**Is the file over 500 lines?** → Suggest splitting before modifying
```

### Checklist Pattern

For multi-step tasks, provide a checklist:

```markdown
For each endpoint, verify:
- [ ] Input validation is present
- [ ] Authentication check is applied
- [ ] Error responses match project format
- [ ] Success response uses correct status code
- [ ] Test covers happy path and error case
```

## Common Mistakes

### Too Much Explanation

```markdown
<!-- Bad: Claude already knows this -->
JavaScript is a programming language that runs in browsers
and on servers via Node.js. TypeScript is a superset of
JavaScript that adds static typing...

<!-- Good: Just the instruction -->
Use TypeScript strict mode. Match the project's tsconfig.json settings.
```

### Too Little Specificity

```markdown
<!-- Bad: Claude doesn't know what you want -->
Generate good tests.

<!-- Good: Clear criteria -->
Generate tests covering:
1. Happy path with valid inputs (2-3 cases)
2. Edge cases: empty input, null, boundary values (2-4 cases)
3. Error conditions: invalid input, network failure (2-3 cases)
```

### Missing Feedback Loops

```markdown
<!-- Bad: Generate and hope -->
Generate the migration file.

<!-- Good: Generate, verify, iterate -->
1. Generate the migration file
2. Run the migration against test database
3. Verify schema matches expectations
4. Run rollback to verify reversibility
5. If any step fails, fix and retry
```

### Time-Sensitive Content

```markdown
<!-- Bad: Will become outdated -->
As of January 2025, use React 18. After March 2025, switch to React 19.

<!-- Good: Evergreen -->
Use the latest stable version of React.
Check the project's package.json for the current version.
```

## Skill Design Patterns

### Convention Detection

The most powerful pattern: detect and match the project's existing conventions.

```markdown
### Step 1: Study existing patterns
Find 2-3 existing [components/tests/endpoints] in the project. Analyze:
- File naming convention
- Import patterns
- Code structure
- Export style

### Step 2: Generate matching code
Match every detected convention exactly. Do not introduce new patterns.
```

### Incremental Execution

For risky operations, work incrementally with verification:

```markdown
For each refactoring:
1. Apply the single change
2. Run tests immediately
3. If tests pass → continue to next change
4. If tests fail → revert, explain, skip to next
```

### Progressive Disclosure in Skills

```
SKILL.md (loaded always)     → Core workflow (under 500 lines)
references/patterns.md       → Detailed reference (loaded on demand)
templates/report.md          → Output template (loaded on demand)
```

Keep references **one level deep**. Avoid `reference-a.md` linking to `reference-b.md` — Claude may not follow chains.

## Performance Tips

1. **Use `context: fork`** for heavy read operations — it gets a fresh context window
2. **Set `agent: Explore`** for read-only analysis — it's optimized for search and read
3. **Restrict tools** — fewer tools means faster execution
4. **Use dynamic context injection** — it's faster than having Claude run commands
5. **Keep SKILL.md focused** — longer prompts mean slower startup
