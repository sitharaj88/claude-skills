# Getting Started

Get all 28 skills installed and working in under a minute.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured
- Git (for cloning the repository)
- `gh` CLI (optional, for PR-related skills)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sitharaj88/claude-skills.git
cd claude-skills
```

### 2. Install skills

```bash
# Install everything
./install.sh --all

# Or pick specific skills
./install.sh --pick
```

That's it. Skills are now available in Claude Code.

## Your First Skill

Open any project in Claude Code and try:

```
/smart-commit
```

If you have staged changes, Claude will:
1. Analyze your diff
2. Detect your project's commit convention
3. Generate a matching commit message
4. Ask for confirmation before committing

## Try More Skills

### Review a pull request

```
/review-pr 42
```

Claude forks an isolated context, fetches the PR diff, and produces a severity-categorized review covering correctness, security, performance, and maintainability.

### Generate tests

```
/test-writer src/utils/parser.ts
```

Claude detects your testing framework (Jest, Vitest, pytest, etc.), studies your existing test patterns, generates comprehensive tests, runs them, and iterates until they pass.

### Audit security

```
/security-audit
```

Claude performs a full OWASP Top 10 audit — scanning for injection vulnerabilities, authentication issues, hardcoded secrets, and more — with specific file:line references and remediation code.

### Generate a mobile screen

```
/generate-screen OrderHistory list
```

Claude detects your mobile platform (Compose, SwiftUI, React Native, or Flutter), studies existing screens, and generates a complete screen with ViewModel/BLoC/hook, navigation integration, and all loading/error/empty states.

## How Skills Run

When you invoke a skill:

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  You type    │ ──→ │  Claude loads     │ ──→ │  Claude follows │
│  /skill-name │     │  SKILL.md +       │     │  the workflow   │
│  [arguments] │     │  injects context  │     │  instructions   │
└─────────────┘     └──────────────────┘     └────────────────┘
```

**Inline skills** run in your current conversation, seeing the full chat history. Good for interactive tasks like generating components.

**Forked skills** (`context: fork`) run in an isolated sub-agent with a fresh context window. Good for heavy analysis tasks like codebase audits.

## Customizing Skills

Skills are just markdown files. To customize one:

```bash
# Copy to project scope (for project-specific tweaks)
cp -r skills/smart-commit .claude/skills/smart-commit

# Edit the SKILL.md
# Your project copy takes precedence over the personal one
```

## What's Next?

<div class="skill-grid">
  <a href="/skills/workflow/" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Developer Workflow</h3>
    <p>Commits, PRs, debugging, testing</p>
  </a>
  <a href="/skills/generation/" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Code Generation</h3>
    <p>Components, endpoints, features</p>
  </a>
  <a href="/skills/analysis/" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Analysis & Docs</h3>
    <p>Audits, architecture, API docs</p>
  </a>
  <a href="/skills/mobile/" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Mobile Development</h3>
    <p>Android, iOS, RN, Flutter</p>
  </a>
  <a href="/skills/devops/" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Database & DevOps</h3>
    <p>Docker, deploy, monitoring</p>
  </a>
  <a href="/skills/security/" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Security & Performance</h3>
    <p>OWASP audit, optimization</p>
  </a>
</div>
