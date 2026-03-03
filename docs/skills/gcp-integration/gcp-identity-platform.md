# GCP Identity Platform

Generate authentication flows, multi-tenancy configurations, OAuth/OIDC provider setups, multi-factor authentication, and user management patterns on Google Cloud.

## Usage

```bash
/gcp-identity-platform <description of the authentication setup you need>
```

## What It Does

1. Analyzes authentication requirements and generates Identity Platform configurations
2. Creates multi-tenant setups with isolated user pools and per-tenant identity providers
3. Generates OAuth 2.0 and OIDC provider configurations for social and enterprise login
4. Configures multi-factor authentication with SMS, TOTP, and email verification
5. Produces blocking functions for custom authentication logic and user validation
6. Adds email/password, phone auth, anonymous auth, and custom token sign-in methods

## Examples

```bash
/gcp-identity-platform Create a multi-tenant auth setup with Google and GitHub social login providers

/gcp-identity-platform Design an MFA flow with TOTP and SMS fallback for an enterprise application

/gcp-identity-platform Generate blocking functions that enforce email domain restrictions on sign-up
```

## Allowed Tools

- `Read` - Read existing Identity Platform configurations and provider settings
- `Write` - Create auth configurations, provider setups, and blocking function code
- `Edit` - Modify existing Identity Platform configurations
- `Bash` - Run gcloud CLI commands for Identity Platform management
- `Glob` - Search for authentication-related configuration files
- `Grep` - Find auth provider and tenant references across the project

<div class="badge-row">
  <span class="badge">Auth</span>
  <span class="badge">OAuth</span>
  <span class="badge">GCP</span>
</div>
