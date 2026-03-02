# Dependency Audit

Audits your project's dependencies for known vulnerabilities, outdated packages, license compliance issues, unused dependencies, and bundle size impact. This skill supports multiple ecosystems and produces a unified report with prioritized recommendations for remediation.

## Quick Start

```bash
# Full dependency audit across all dimensions
/dependency-audit

# Security vulnerabilities only
/dependency-audit security

# Check for outdated packages
/dependency-audit outdated

# License compliance check
/dependency-audit licenses
```

## Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `$ARGUMENTS` | No | Audit scope to focus on | `all` |

Supported scopes:

- **`all`** -- Complete audit across every dimension (default)
- **`security`** -- Known CVEs and vulnerability advisories from `npm audit`, `pip-audit`, `cargo audit`, etc.
- **`outdated`** -- Packages behind by one or more major, minor, or patch versions
- **`licenses`** -- License type classification and compliance risk assessment
- **`unused`** -- Dependencies declared in manifests but not imported anywhere in source code
- **`size`** -- Bundle size impact of each dependency (frontend projects)

::: tip
Run `/dependency-audit all` before a major release to get a complete dependency health check. For ongoing maintenance, use `/dependency-audit security` as part of your regular review cycle.
:::

## How It Works

1. **Detect ecosystem** -- Identifies your package manager and ecosystem by scanning for manifest files (`package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, `Gemfile`).
2. **Parse arguments** -- Determines which audit dimensions to run based on the provided scope.
3. **Security audit** -- Runs the ecosystem-native audit tool (`npm audit`, `pip-audit`, `cargo audit`, etc.) and parses the results into a normalized format with CVE IDs, severity, and fix versions.
4. **Outdated analysis** -- Compares installed versions against the latest available versions, categorizing updates by semver level (major, minor, patch).
5. **Unused detection** -- Cross-references declared dependencies against actual import/require statements in your source code to identify packages that can be safely removed.
6. **License compliance** -- Extracts license information for every dependency and flags packages with copyleft, unknown, or no-license declarations.
7. **Bundle size analysis** -- For frontend projects, estimates the gzipped size contribution of each dependency to help identify bloat.
8. **Report** -- Produces a unified report with findings across all dimensions, prioritized by risk and impact.

## Audit Scope Details

| Scope | What Is Checked | Tool Used |
|-------|----------------|-----------|
| **Security** | Known CVEs, security advisories, vulnerable version ranges | `npm audit`, `pip-audit`, `cargo audit`, `govulncheck`, `bundle-audit` |
| **Outdated** | Current vs. latest version, semver distance, changelog links | `npm outdated`, `pip list --outdated`, `cargo outdated` |
| **Unused** | Manifest entries with no corresponding import in source | Static analysis of import/require statements |
| **Licenses** | License type per package, transitive dependency licenses | Manifest and registry metadata inspection |
| **Size** | Gzipped bundle contribution per dependency | Bundle analysis via import cost estimation |

## License Risk Classification

| Risk Level | License Types | Implication |
|------------|---------------|-------------|
| **Permissive** | MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC | Safe for commercial use with minimal obligations |
| **Copyleft (weak)** | LGPL-2.1, LGPL-3.0, MPL-2.0 | Modifications to the library itself must be shared; your code remains private |
| **Copyleft (strong)** | GPL-2.0, GPL-3.0, AGPL-3.0 | Derivative works must be distributed under the same license |
| **Unknown / None** | No license detected, custom license, UNLICENSED | Legal risk -- consult legal counsel before using in production |

::: warning
Strong copyleft licenses (GPL, AGPL) may require you to release your entire application under the same license. If your project is proprietary, flag these dependencies for review with your legal team.
:::

## Supported Ecosystems

| Ecosystem | Manifest File | Lock File | Audit Tool |
|-----------|---------------|-----------|------------|
| **Node.js (npm)** | `package.json` | `package-lock.json` | `npm audit` |
| **Node.js (yarn)** | `package.json` | `yarn.lock` | `yarn audit` |
| **Node.js (pnpm)** | `package.json` | `pnpm-lock.yaml` | `pnpm audit` |
| **Python (pip)** | `requirements.txt` | `requirements.lock` | `pip-audit` |
| **Python (Poetry)** | `pyproject.toml` | `poetry.lock` | `pip-audit` |
| **Rust** | `Cargo.toml` | `Cargo.lock` | `cargo audit` |
| **Go** | `go.mod` | `go.sum` | `govulncheck` |
| **Ruby** | `Gemfile` | `Gemfile.lock` | `bundle-audit` |
| **Java (Maven)** | `pom.xml` | -- | `mvn dependency-check` |

## Example

Running `/dependency-audit` on a Node.js project produces:

```markdown
## Dependency Audit Report

### Security (3 vulnerabilities)
| Package | Severity | CVE | Installed | Fix Version |
|---------|----------|-----|-----------|-------------|
| `xmldom` | Critical | CVE-2025-12345 | 0.6.0 | 0.8.10 |
| `express` | High | CVE-2025-23456 | 4.18.2 | 4.19.0 |
| `jsonwebtoken` | Medium | CVE-2025-34567 | 8.5.1 | 9.0.0 |

### Outdated (12 packages)
| Update Level | Count | Examples |
|-------------|-------|---------|
| Major | 4 | `typescript` 4.9 -> 5.4, `eslint` 8.x -> 9.x |
| Minor | 3 | `express` 4.18 -> 4.19, `dotenv` 16.3 -> 16.4 |
| Patch | 5 | Various security and bug fix patches |

### Unused (3 packages)
- `moment` -- declared in package.json but never imported (saving ~72KB gzipped)
- `lodash` -- declared but only `lodash/get` is used (consider `lodash.get` instead)
- `colors` -- declared in dependencies, only used in a removed script

### Licenses
- 142 packages: Permissive (MIT, Apache-2.0, ISC)
- 3 packages: Copyleft weak (LGPL-2.1)
- 1 package: Unknown license -- `internal-utils@1.0.0`

### Bundle Size Impact (Top 5)
| Package | Gzipped Size | % of Bundle |
|---------|-------------|-------------|
| `moment` | 72.1 KB | 18.3% |
| `lodash` | 24.5 KB | 6.2% |
| `chart.js` | 20.8 KB | 5.3% |
| `axios` | 13.6 KB | 3.5% |
| `date-fns` | 11.2 KB | 2.8% |
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` -- runs in an isolated context so the audit does not affect your working conversation |

This skill does not modify any files in your project. All findings are returned as a report within the conversation. The forked context ensures that the extensive file and dependency scanning does not consume your main conversation's context window.
