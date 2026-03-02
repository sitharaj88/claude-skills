# Contributing

We welcome contributions. Here's how to add new skills or improve existing ones.

## Adding a New Skill

### 1. Create the skill directory

```bash
mkdir -p skills/my-skill
```

### 2. Write SKILL.md

Create `skills/my-skill/SKILL.md` with:
- YAML frontmatter (name, description, allowed-tools)
- Markdown body with clear workflow instructions
- Follow the [Authoring Guide](/guide/authoring) for best practices

### 3. Add supporting files (optional)

```
skills/my-skill/
├── SKILL.md
├── references/
│   └── patterns.md      # Detailed reference material
└── templates/
    └── output.md        # Output format templates
```

### 4. Add documentation

Create a documentation page at `docs/skills/<category>/my-skill.md` following the existing page format.

Update the category index page (`docs/skills/<category>/index.md`) to include your skill card.

### 5. Update the sidebar

Add your skill to `docs/.vitepress/config.mts` in the appropriate sidebar section.

### 6. Update README.md

Add your skill to the skills table in the appropriate category.

### 7. Test

1. Install the skill: `./install.sh --skill my-skill`
2. Open a fresh Claude Code session
3. Invoke with `/my-skill` and test arguments
4. Verify it works across different project types

### 8. Submit a PR

```bash
git checkout -b add-my-skill
git add skills/my-skill/ docs/skills/<category>/my-skill.md
git commit -m "feat: add my-skill for [description]"
```

## Improving Existing Skills

### Bug fixes

If a skill produces incorrect output or fails in certain scenarios:
1. Identify the issue in the SKILL.md instructions
2. Fix the instruction and test
3. Submit a PR with a description of what was wrong and how you fixed it

### Adding framework support

If a skill should support an additional framework:
1. Add detection logic for the new framework
2. Add generation/analysis patterns for it
3. Test with a real project using that framework
4. Update the documentation page to list the new framework

### Improving output quality

If a skill's output could be better:
1. Identify what's missing or could be improved
2. Update the instructions
3. Test to ensure the improvement works without regressing other cases

## Guidelines

- **Keep SKILL.md under 500 lines** — use `references/` for detailed content
- **Write clear descriptions** — both what and when, in third person
- **Follow minimum privilege** — only request the tools the skill needs
- **Test with fresh sessions** — skills are loaded at startup
- **Don't break existing skills** — if you're modifying shared infrastructure
- **Document your changes** — update docs pages and README

## Code of Conduct

Be respectful, constructive, and helpful. We're building tools to make developers more productive — keep that spirit in contributions.
