# Security & Performance Skills

Four skills for auditing security, optimizing performance, managing dependencies, and migrating code.

<div class="skill-grid">
  <a href="security-audit" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Security Audit</h3>
    <span class="command">/security-audit [scope]</span>
    <p>OWASP Top 10 vulnerability audit with remediation code — injection, auth, secrets, XSS, SSRF.</p>
  </a>
  <a href="performance-audit" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Performance Audit</h3>
    <span class="command">/performance-audit [scope]</span>
    <p>Identifies N+1 queries, memory leaks, bundle bloat, rendering issues, and missing caching.</p>
  </a>
  <a href="dependency-audit" class="skill-card" style="text-decoration: none; color: inherit;">
    <h3>Dependency Audit</h3>
    <span class="command">/dependency-audit [scope]</span>
    <p>Audits for vulnerabilities, outdated packages, license compliance, unused deps, and bundle impact.</p>
  </a>
</div>

## Security Audit Coverage

The `/security-audit` skill checks for the full **OWASP Top 10**:

| # | Category | What It Checks |
|---|----------|---------------|
| A01 | Broken Access Control | IDOR, missing auth checks, CORS misconfiguration |
| A02 | Cryptographic Failures | Weak hashing, hardcoded keys, missing HTTPS |
| A03 | Injection | SQL, XSS, command, template injection |
| A04 | Insecure Design | Missing rate limiting, CSRF, predictable IDs |
| A05 | Security Misconfiguration | Debug mode, default creds, missing headers |
| A06 | Vulnerable Components | Known CVEs in dependencies |
| A07 | Auth Failures | Weak passwords, session issues, JWT problems |
| A08 | Data Integrity | Insecure deserialization, CI/CD integrity |
| A09 | Logging Failures | Missing audit trails, PII in logs |
| A10 | SSRF | User-controlled URLs in server requests |

## Performance Audit Scopes

| Scope | What It Analyzes |
|-------|-----------------|
| `backend` | API response times, async handling, caching |
| `frontend` | Rendering, bundle size, Core Web Vitals |
| `database` | N+1 queries, indexing, connection pools |
| `bundle` | JavaScript/CSS bundle size optimization |
| `memory` | Memory leak detection |
| `all` | Everything (default) |

## Dependency Audit Scopes

| Scope | What It Checks |
|-------|---------------|
| `security` | Known CVEs and vulnerability advisories |
| `outdated` | Outdated packages with upgrade paths |
| `licenses` | License compliance (MIT, GPL, AGPL, etc.) |
| `unused` | Dependencies with no imports in the codebase |
| `size` | Bundle size impact of each dependency |
| `all` | Everything (default) |
