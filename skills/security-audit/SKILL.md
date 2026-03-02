---
name: security-audit
description: Performs a comprehensive security audit of the codebase covering OWASP Top 10 vulnerabilities, secrets detection, authentication/authorization patterns, input validation, and dependency security. Produces a prioritized report with remediation guidance. Use when the user asks for a security review, vulnerability scan, OWASP audit, or wants to harden their application.
argument-hint: "[scope: full|auth|injection|secrets|api|dependencies]"
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash(git log *), Bash(npm audit *), Bash(pip audit *), Bash(cargo audit *)
disable-model-invocation: true
user-invocable: true
---

## Instructions

You are an application security engineer. Perform a thorough security audit of the codebase.

### Step 1: Scope the audit

- `$ARGUMENTS` specifies the focus (optional):
  - `full` — Complete OWASP Top 10 + secrets + dependencies (default)
  - `auth` — Authentication and authorization focus
  - `injection` — Injection vulnerabilities (SQL, XSS, command, LDAP)
  - `secrets` — Hardcoded secrets and credential management
  - `api` — API security (rate limiting, CORS, input validation)
  - `dependencies` — Third-party dependency vulnerabilities

### Step 2: Detect the tech stack

Identify frameworks and their security-relevant features:
- Authentication library (passport, next-auth, devise, Spring Security)
- ORM (parameterized queries vs raw SQL)
- Template engine (auto-escaping vs manual)
- CORS configuration
- Session/JWT management

### Step 3: OWASP Top 10 audit

#### A01: Broken Access Control
- Search for authorization checks on protected routes/endpoints
- Look for IDOR (Insecure Direct Object Reference) — accessing resources by user-controlled ID without ownership verification
- Check for missing role/permission checks
- Verify CORS configuration isn't overly permissive (`Access-Control-Allow-Origin: *` with credentials)
- Check for path traversal in file operations

#### A02: Cryptographic Failures
- Search for weak hashing (MD5, SHA1 for passwords)
- Check password storage (bcrypt/scrypt/argon2 with proper cost factor)
- Look for hardcoded encryption keys
- Verify HTTPS enforcement (HSTS headers, secure cookies)
- Check for sensitive data in logs or error messages

#### A03: Injection
- **SQL Injection**: Search for string concatenation in queries, raw SQL with user input
- **XSS**: Search for `dangerouslySetInnerHTML`, `innerHTML`, unescaped template variables, `v-html`
- **Command Injection**: Search for `exec()`, `system()`, `child_process.exec()` with user input
- **LDAP/NoSQL Injection**: Search for unparameterized queries to MongoDB, LDAP
- **Template Injection**: Search for user input in template rendering

#### A04: Insecure Design
- Check for rate limiting on authentication endpoints
- Verify account lockout after failed login attempts
- Look for missing CSRF protection on state-changing operations
- Check for predictable resource IDs (sequential integers vs UUIDs)

#### A05: Security Misconfiguration
- Check for debug mode enabled in production config
- Search for default credentials
- Verify security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- Check for open directory listings
- Verify error messages don't leak stack traces in production

#### A06: Vulnerable and Outdated Components
- Run dependency audit: `npm audit`, `pip audit`, `cargo audit`, `go vuln`
- Check for known vulnerable package versions
- Look for abandoned dependencies (no updates in 2+ years)

#### A07: Identification and Authentication Failures
- Check password policy enforcement (length, complexity)
- Verify session management (secure, httpOnly, sameSite cookies)
- Check JWT implementation (algorithm validation, expiry, refresh flow)
- Look for hardcoded API keys or tokens
- Verify multi-factor authentication support (if applicable)

#### A08: Software and Data Integrity Failures
- Check for insecure deserialization (pickle.loads, JSON.parse of user input into eval)
- Verify CI/CD pipeline integrity (no arbitrary code execution from PRs)
- Check for unsigned package installations

#### A09: Security Logging and Monitoring Failures
- Verify authentication events are logged (login, logout, failed attempts)
- Check for audit trail on sensitive operations
- Verify no sensitive data in logs (passwords, tokens, PII)

#### A10: Server-Side Request Forgery (SSRF)
- Search for user-controlled URLs in server-side HTTP requests
- Check for URL validation and allowlisting
- Look for internal service endpoints accessible via user input

### Step 4: Secrets detection

Search for hardcoded secrets:
```
Patterns to search:
- API keys: /[a-zA-Z0-9_-]{20,}/ near "key", "api", "token", "secret"
- AWS: /AKIA[0-9A-Z]{16}/
- GitHub: /gh[ps]_[A-Za-z0-9_]{36}/
- JWT: /eyJ[A-Za-z0-9_-]+\.eyJ/
- Private keys: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/
- Connection strings: /[a-z]+:\/\/[^:]+:[^@]+@/
- Generic secrets: password|secret|token|key followed by = or : with a value
```

Check `.gitignore` includes: `.env`, `*.pem`, `*.key`, `credentials.*`, `*.p12`

### Step 5: Generate report

```markdown
# Security Audit Report

## Summary
- **Critical**: [N] findings requiring immediate action
- **High**: [N] findings to address soon
- **Medium**: [N] findings to plan for
- **Low**: [N] findings for consideration
- **Informational**: [N] best practice recommendations

## Critical Findings

### [VULN-001] SQL Injection in user search endpoint
- **Category**: A03 — Injection
- **Location**: [src/routes/users.ts:45](src/routes/users.ts#L45)
- **Description**: User input is concatenated directly into SQL query without parameterization
- **Impact**: Attacker can read, modify, or delete any data in the database
- **Remediation**: Use parameterized queries
  ```typescript
  // Before (vulnerable):
  db.query(`SELECT * FROM users WHERE name = '${req.query.name}'`);
  // After (safe):
  db.query('SELECT * FROM users WHERE name = $1', [req.query.name]);
  ```

### [VULN-002] ...

## High Findings
...

## Medium Findings
...

## Positive Findings
- [What the project does well from a security perspective]

## Recommendations (prioritized)
1. [Highest priority remediation]
2. [Second priority]
3. [Third priority]
```

### Guidelines

- Be precise — every finding must include file:line, evidence, and remediation
- Prioritize by exploitability and impact — a SQL injection on a public endpoint is more critical than a missing CSP header
- Provide working remediation code, not just descriptions
- Don't report theoretical vulnerabilities without evidence in the code
- Acknowledge what the project does well — security audits should be balanced
- If a finding is uncertain, mark it as "Potential" and explain what additional information would confirm it
