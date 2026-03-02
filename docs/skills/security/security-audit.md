# Security Audit

Performs an OWASP Top 10 vulnerability audit of your codebase with precise file:line references and actionable remediation code. This skill systematically checks every OWASP category, scans for hardcoded secrets, and produces a prioritized report that lets you fix critical issues immediately.

## Quick Start

```bash
# Full OWASP Top 10 audit
/security-audit

# Focus on a specific category
/security-audit injection

# Audit authentication and authorization only
/security-audit auth
```

## Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `$ARGUMENTS` | No | Audit scope to focus on | `full` |

Supported scopes:

- **`full`** -- Complete OWASP Top 10 audit plus secrets detection (default)
- **`auth`** -- Authentication and authorization vulnerabilities (A01, A07)
- **`injection`** -- Injection flaws including SQL, XSS, command injection (A03)
- **`secrets`** -- Hardcoded credentials, API keys, tokens, and private keys
- **`api`** -- API-specific vulnerabilities including SSRF, mass assignment, rate limiting
- **`dependencies`** -- Known vulnerabilities in third-party packages (A06)

::: tip
Start with `/security-audit` to get a full picture, then use a focused scope to drill deeper into specific categories. The full audit provides severity-ranked findings so you can prioritize remediation effectively.
:::

## How It Works

1. **Scope** -- Determines which OWASP categories and additional checks to run based on the provided scope argument.
2. **Detect stack** -- Identifies your language, framework, and security-relevant libraries (authentication, ORM, input validation) to tailor the audit rules.
3. **OWASP Top 10 checklist** -- Systematically examines your codebase against all 10 OWASP categories, recording findings with exact file paths and line numbers.
4. **Secrets detection** -- Scans for hardcoded credentials, API keys, private keys, JWT secrets, database connection strings, and other sensitive values using pattern matching and entropy analysis.
5. **Generate report** -- Aggregates all findings into a prioritized report with severity levels, code references, remediation examples, and an overall risk score.

## OWASP Top 10 Coverage

| ID | Category | What Is Checked |
|----|----------|----------------|
| **A01** | Broken Access Control | Missing auth checks on routes, IDOR patterns, privilege escalation paths, CORS misconfiguration |
| **A02** | Cryptographic Failures | Weak hashing algorithms (MD5, SHA1 for passwords), missing encryption at rest, plaintext secrets in config |
| **A03** | Injection | SQL injection, XSS (reflected, stored, DOM), command injection, LDAP injection, template injection |
| **A04** | Insecure Design | Missing rate limiting, lack of input validation, business logic flaws, missing CSRF protection |
| **A05** | Security Misconfiguration | Debug mode in production, default credentials, overly permissive headers, exposed stack traces |
| **A06** | Vulnerable Components | Known CVEs in dependencies, outdated packages with security patches available |
| **A07** | Auth Failures | Weak password policies, missing MFA, session fixation, insecure token storage, JWT misconfigurations |
| **A08** | Data Integrity Failures | Missing integrity checks on CI/CD, unsigned updates, deserialization of untrusted data |
| **A09** | Logging Failures | Missing security event logging, sensitive data in logs, no audit trail for admin actions |
| **A10** | SSRF | Unvalidated URL inputs, internal network access from user-controlled URLs, DNS rebinding risks |

## Severity Levels

Each finding is classified by severity:

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| **Critical** | Actively exploitable, immediate data breach risk | Fix immediately |
| **High** | Exploitable with moderate effort, significant impact | Fix within current sprint |
| **Medium** | Requires specific conditions to exploit | Schedule for next sprint |
| **Low** | Minor risk, defense-in-depth improvement | Address when convenient |
| **Informational** | Best practice suggestion, no direct risk | Consider adopting |

::: warning
This audit performs static analysis only. It cannot detect runtime vulnerabilities, environment-specific misconfigurations, or issues that require dynamic testing (such as timing attacks or race conditions). Complement this audit with penetration testing for a complete security assessment.
:::

## Example

Running `/security-audit` on an Express.js project produces a report like:

```markdown
## Security Audit Report

Risk Score: 72/100 (Moderate)

### Critical (1)
1. **SQL Injection** -- `src/routes/users.ts:45`
   Raw SQL query with string interpolation from user input.
   Remediation: Use parameterized queries.

### High (3)
1. **Missing Auth Middleware** -- `src/routes/admin.ts:12`
   Admin routes lack authentication middleware.
2. **Hardcoded JWT Secret** -- `src/config/auth.ts:8`
   JWT secret is a hardcoded string, not an environment variable.
3. **Missing Rate Limiting** -- `src/routes/auth.ts:1`
   Login endpoint has no rate limiting, vulnerable to brute force.

### Medium (2)
1. **Permissive CORS** -- `src/app.ts:15`
   CORS allows all origins with credentials enabled.
2. **Missing CSRF Protection** -- `src/app.ts:1`
   No CSRF middleware configured for state-changing routes.

### Remediation Summary
- 1 Critical: estimated 30 minutes to fix
- 3 High: estimated 2 hours to fix
- 2 Medium: estimated 1 hour to fix
```

## Configuration

| Setting | Value |
|---------|-------|
| **Context mode** | `fork` -- runs in an isolated context so the audit does not affect your working conversation |
| **Agent** | `Explore` -- uses a read-only exploration agent for safe, non-destructive analysis |

This skill does not modify any files in your project. All findings are returned as a report within the conversation. The forked context ensures that the extensive file scanning required for a thorough audit does not consume your main conversation's context window.
