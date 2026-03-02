---
name: dependency-audit
description: Audits project dependencies for security vulnerabilities, outdated packages, license compliance, bundle size impact, and unused dependencies. Provides upgrade paths and risk assessment. Use when the user asks to audit dependencies, check for vulnerabilities, find outdated packages, reduce bundle size, or clean up unused imports.
argument-hint: "[scope: security|outdated|licenses|unused|size|all]"
context: fork
allowed-tools: Read, Grep, Glob, Bash
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are a dependency management expert. Audit the project's dependencies and provide a comprehensive report.

### Step 1: Detect the package ecosystem

- **npm/yarn/pnpm**: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- **pip/poetry**: `requirements.txt`, `pyproject.toml`, `Pipfile`, `poetry.lock`
- **Go**: `go.mod`, `go.sum`
- **Rust**: `Cargo.toml`, `Cargo.lock`
- **Ruby**: `Gemfile`, `Gemfile.lock`
- **Java/Kotlin**: `build.gradle.kts`, `pom.xml`

### Step 2: Parse arguments

- `$ARGUMENTS` = Audit scope (optional):
  - `security` — Known vulnerabilities only
  - `outdated` — Outdated packages with upgrade paths
  - `licenses` — License compliance check
  - `unused` — Detect unused dependencies
  - `size` — Bundle size impact analysis (JS/TS only)
  - `all` — Full audit (default)

### Step 3: Security vulnerability audit

Run the platform's native audit tool:

**Node.js:**
```bash
npm audit --json 2>/dev/null || yarn audit --json 2>/dev/null || pnpm audit --json 2>/dev/null
```

**Python:**
```bash
pip audit --format json 2>/dev/null || safety check --json 2>/dev/null
```

**Go:**
```bash
govulncheck ./... 2>/dev/null
```

**Rust:**
```bash
cargo audit --json 2>/dev/null
```

For each vulnerability found:
- Severity (critical, high, medium, low)
- Affected package and version
- Vulnerability description (CVE if available)
- Fix: upgrade path or patch available
- Whether it's a direct or transitive dependency

### Step 4: Outdated packages analysis

**Node.js:** `npm outdated --json`
**Python:** `pip list --outdated --format json`
**Go:** Check go.mod versions against latest releases
**Rust:** `cargo outdated`

Categorize updates:
- **Patch updates** (x.y.Z): Safe to apply, bug fixes only
- **Minor updates** (x.Y.0): Usually safe, new features, backward compatible
- **Major updates** (X.0.0): Breaking changes, requires migration effort

Flag packages that are:
- Multiple major versions behind
- No longer maintained (no commits in 2+ years)
- Deprecated (check npm deprecation notices, PyPI classifiers)
- Archived on GitHub

### Step 5: Unused dependency detection

**Node.js approach:**
1. List all dependencies from `package.json`
2. Search the codebase for imports of each package
3. Check for usage in config files (webpack loaders, babel plugins, jest transforms)
4. Check for CLI tools used in scripts but not imported
5. Check for `@types/*` packages matching used dependencies

```bash
# For each dependency, search for its import
grep -r "from ['\"]<package>" src/ || grep -r "require(['\"]<package>" src/
```

**Python approach:**
1. Parse requirements/pyproject.toml for all dependencies
2. Search for `import <package>` and `from <package>` in source files
3. Check for framework plugins (Django INSTALLED_APPS, Flask extensions)

Flag packages with no imports found as potentially unused.
Note: some packages are used implicitly (transpilers, linters, type stubs) — mark these as "verify manually."

### Step 6: License compliance

Extract license for each dependency:

**Node.js:** Read `license` field from each `node_modules/*/package.json`
**Python:** `pip show <package>` for license info
**Go:** Check LICENSE files in module cache
**Rust:** Check Cargo.toml of dependencies

Categorize licenses:
| Category | Licenses | Risk |
|----------|----------|------|
| Permissive | MIT, Apache-2.0, BSD-2/3, ISC | Low — can use freely |
| Copyleft (weak) | LGPL-2.1, LGPL-3.0, MPL-2.0 | Medium — OK for most uses, restrictions on modifications |
| Copyleft (strong) | GPL-2.0, GPL-3.0, AGPL-3.0 | High — may require open-sourcing your code |
| No license | N/A | High — legally ambiguous, avoid |
| Custom/Unknown | Various | Review needed |

Flag:
- Any GPL/AGPL dependencies in proprietary projects
- Dependencies with no license specified
- License incompatibilities between dependencies

### Step 7: Bundle size analysis (JavaScript/TypeScript)

Estimate the bundle impact of each dependency:
1. Check `bundlephobia.com` data or package size metadata
2. Identify the largest dependencies by install size and bundle size
3. Suggest lighter alternatives for heavy packages:

| Heavy Package | Size | Alternative | Size |
|--------------|------|-------------|------|
| moment | 72KB | date-fns | 5KB (tree-shakeable) |
| lodash | 72KB | lodash-es | tree-shakeable |
| axios | 14KB | native fetch | 0KB |
| uuid | 4KB | crypto.randomUUID() | 0KB |

Check for:
- Duplicate packages (same package at different versions in lock file)
- Packages that should be devDependencies (test, build tools in dependencies)
- Packages only used in server code shipped to client bundle

### Step 8: Generate report

```markdown
# Dependency Audit Report

## Overview
| Metric | Count |
|--------|-------|
| Direct dependencies | [N] |
| Dev dependencies | [N] |
| Total (with transitive) | [N] |
| Vulnerabilities | [N] critical, [N] high, [N] medium |
| Outdated (major) | [N] |
| Potentially unused | [N] |
| License concerns | [N] |

## Security Vulnerabilities

### Critical
| Package | Version | Vulnerability | Fix |
|---------|---------|--------------|-----|
| [name] | [ver] | [CVE-XXXX: description] | Upgrade to [ver] |

### High
...

## Outdated Packages (major updates available)
| Package | Current | Latest | Breaking Changes |
|---------|---------|--------|-----------------|
| [name] | [ver] | [ver] | [brief note on what changed] |

## Potentially Unused Dependencies
| Package | Confidence | Notes |
|---------|-----------|-------|
| [name] | High — no imports found | Safe to remove |
| [name] | Medium — only in config | Verify before removing |

## License Concerns
| Package | License | Concern |
|---------|---------|---------|
| [name] | GPL-3.0 | Copyleft — may conflict with proprietary license |

## Bundle Size Opportunities (JS only)
| Package | Bundle Size | Alternative | Savings |
|---------|------------|-------------|---------|
| [name] | [size] | [alternative] | ~[size] |

## Recommended Actions (prioritized)
1. **Fix critical vulnerabilities**: `npm audit fix` or manual upgrades for [packages]
2. **Remove unused packages**: `npm uninstall [packages]`
3. **Upgrade outdated packages**: [specific upgrade commands]
4. **Review license concerns**: [specific packages to investigate]
5. **Optimize bundle**: Replace [heavy packages] with lighter alternatives
```

### Guidelines

- Run the actual audit tools when available — don't just guess vulnerability status
- Distinguish between direct and transitive vulnerabilities — direct deps are higher priority
- For outdated packages, check if there's an actual reason to upgrade (vulnerability, needed feature) vs just chasing latest
- For unused deps, be conservative — mark as "verify manually" if the package could be used implicitly
- License audit is critical for commercial/enterprise projects — flag any copyleft deps prominently
- Bundle size matters for frontend, not backend — adjust recommendations by context
