# AWS Cognito

Generate User Pools, Identity Pools, OAuth2/OIDC configurations, social login providers, MFA settings, and authentication flows.

## Usage

```bash
/aws-cognito <description of your authentication requirements>
```

## What It Does

1. Creates User Pool configurations with password policies and attribute schemas
2. Generates app client settings with OAuth2 flows and scopes
3. Configures social identity providers (Google, Apple, Facebook, SAML)
4. Sets up MFA (TOTP, SMS) and advanced security features
5. Produces Lambda triggers for custom auth flows and user migration
6. Adds Identity Pool (federated identities) for temporary AWS credentials

## Examples

```bash
/aws-cognito Create a User Pool with Google social login, MFA, and custom email templates

/aws-cognito Set up OAuth2 authorization code flow with PKCE for a React SPA

/aws-cognito Configure Identity Pool for authenticated and guest access to S3 and API Gateway
```

## Allowed Tools

- `Read` - Read existing auth configurations and trigger code
- `Write` - Create User Pool templates, trigger functions, and auth code
- `Edit` - Modify existing Cognito configurations
- `Bash` - Run AWS CLI Cognito commands for testing
- `Glob` - Search for authentication-related files
- `Grep` - Find auth references and pool IDs in application code
