# Code Generation Skills

Four skills for generating production-quality code — from individual UI components to full-stack features.

<div class="skill-grid">
  <a href="generate-component" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate Component</h3>
    <span class="command">/generate-component [Name]</span>
    <p>Creates UI components with props, styles, tests, and stories matching your frontend framework.</p>
  </a>
  <a href="generate-endpoint" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Generate Endpoint</h3>
    <span class="command">/generate-endpoint [resource]</span>
    <p>Creates API endpoints with validation, error handling, types, and tests for your backend framework.</p>
  </a>
  <a href="implement-feature" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Implement Feature</h3>
    <span class="command">/implement-feature [spec]</span>
    <p>Plans and implements complete features across the stack from description or GitHub issue number.</p>
  </a>
  <a href="scaffold-project" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Scaffold Project</h3>
    <span class="command">/scaffold-project [type] [name]</span>
    <p>Scaffolds production-ready projects with config, CI/CD, testing, and linting setup.</p>
  </a>
</div>

## Supported Frameworks

These skills auto-detect and generate code for:

**Frontend:** React, Vue, Svelte, Angular, Solid
**Backend:** Express, Fastify, Next.js, Flask, Django, FastAPI, Go, Rust
**Project types:** Node API, React app, CLI tool

## How Generation Works

```
1. Detect      →  2. Study         →  3. Generate      →  4. Verify
   Framework       Existing code       New code that       Types resolve,
   and tools       patterns            matches exactly     imports exist
```

Every generated file follows your project's existing conventions — naming, export style, testing patterns, and code organization.
