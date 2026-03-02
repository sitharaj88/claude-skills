---
layout: home

hero:
  name: Claude Skills
  text: Supercharge Your Development Workflow
  tagline: 28 world-class custom slash commands for Claude Code — from smart commits to full-stack feature implementation.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Browse Skills
      link: /guide/what-are-skills
    - theme: alt
      text: GitHub
      link: https://github.com/sitharaj88/claude-skills

features:
  - icon: ⚡
    title: Developer Workflow
    details: Smart commits, PR reviews, PR creation, hypothesis-driven debugging, and test generation — all matching your project's conventions.
    link: /skills/workflow/
    linkText: 5 skills →

  - icon: 🏗️
    title: Code Generation
    details: Generate UI components, API endpoints, scaffold entire projects, or implement features end-to-end from specs or GitHub issues.
    link: /skills/generation/
    linkText: 4 skills →

  - icon: 📊
    title: Analysis & Documentation
    details: Deep codebase audits, architecture docs with Mermaid diagrams, API reference generation, changelogs, and safe refactoring.
    link: /skills/analysis/
    linkText: 5 skills →

  - icon: 📱
    title: Mobile Development
    details: Full coverage for Android, iOS, React Native, and Flutter — screens, scaffolding, testing, native bridges, app store prep, and CI/CD.
    link: /skills/mobile/
    linkText: 6 skills →

  - icon: 🐳
    title: Database & DevOps
    details: Database migrations, Docker setup, cloud deployment configs, and full observability with monitoring, logging, and alerting.
    link: /skills/devops/
    linkText: 4 skills →

  - icon: 🛡️
    title: Security & Performance
    details: OWASP security audits, performance bottleneck analysis, dependency vulnerability scanning, and code migration assistance.
    link: /skills/security/
    linkText: 4 skills →
---

<div class="stats-row">
  <div class="stat">
    <div class="number">28</div>
    <div class="label">Skills</div>
  </div>
  <div class="stat">
    <div class="number">7</div>
    <div class="label">Categories</div>
  </div>
  <div class="stat">
    <div class="number">15+</div>
    <div class="label">Frameworks</div>
  </div>
  <div class="stat">
    <div class="number">4</div>
    <div class="label">Mobile Platforms</div>
  </div>
</div>

## Quick Start

```bash
# Clone and install all skills
git clone https://github.com/sitharaj88/claude-skills.git
cd claude-skills
./install.sh --all

# Start using in Claude Code
/smart-commit
/review-pr 42
/generate-component UserProfile form
/security-audit full
```

## How It Works

Every skill **auto-detects** your project's framework, conventions, and patterns. No configuration needed.

```
You invoke a skill          Claude analyzes your project       You get tailored output
────────────────── ──→ ──────────────────────────────── ──→ ─────────────────────────
/generate-component         Detects React + Tailwind +         Component with Tailwind
  UserProfile form          existing component patterns        classes, TypeScript props,
                                                               test file, and story
```

Skills follow your project's style — if you use CSS Modules, the skill uses CSS Modules. If you use Vitest, the tests use Vitest.
