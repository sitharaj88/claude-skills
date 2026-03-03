# Azure Entra ID

Generate app registrations, authentication flows, conditional access policies, token configurations, and identity governance setups following Microsoft Entra ID best practices.

## Usage

```bash
/azure-entra-id <description of your identity and authentication requirements>
```

## What It Does

1. Creates app registrations with appropriate API permissions, redirect URIs, and credential configurations
2. Generates OAuth 2.0 and OpenID Connect authentication flows for web, SPA, and native applications
3. Produces conditional access policies with grant controls, session management, and risk-based rules
4. Configures token claims mapping, optional claims, and custom claims providers
5. Sets up enterprise application provisioning with SCIM, group assignments, and SSO configurations
6. Implements managed identities, service principals, and federated credentials for workload authentication

## Examples

```bash
/azure-entra-id Create an app registration with MSAL.js for a React SPA using authorization code flow with PKCE

/azure-entra-id Design conditional access policies requiring MFA for external users and blocking legacy authentication

/azure-entra-id Set up workload identity federation for GitHub Actions deploying to Azure resources
```

## What It Covers

- **App registrations** - Client IDs, redirect URIs, API permissions, certificates, and client secrets
- **Authentication flows** - Authorization code, client credentials, on-behalf-of, and device code flows
- **Conditional access** - Location-based policies, device compliance, risk detection, and session controls
- **Token configuration** - Optional claims, groups claims, roles claims, and token lifetime policies
- **Enterprise apps** - SSO configuration, user provisioning, group assignments, and consent frameworks
- **Managed identities** - System-assigned and user-assigned identities for Azure resource authentication
- **Federated credentials** - Workload identity federation for GitHub, Kubernetes, and external IdPs
- **B2C/B2B** - External identity providers, guest user policies, and self-service sign-up flows

<div class="badge-row">
  <span class="badge">Identity</span>
  <span class="badge">Auth</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing app registrations, auth configurations, and policy definitions
- `Write` - Create app registration manifests, auth configs, and conditional access policies
- `Edit` - Modify existing Entra ID configurations and authentication settings
- `Bash` - Run Azure CLI and Microsoft Graph commands for identity management
- `Glob` - Search for authentication configuration and identity-related files
- `Grep` - Find client IDs, tenant references, and auth flow patterns across the project
