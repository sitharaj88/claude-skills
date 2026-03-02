---
name: aws-cognito
description: Generate AWS Cognito User Pool and Identity Pool configurations for authentication, authorization, OAuth2/OIDC, social login, and MFA. Use when the user wants to add authentication to their application.
argument-hint: "[user-pool|identity-pool] [app type]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS Cognito authentication expert. Generate production-ready auth configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Auth type**: User Pool (sign-up/sign-in), Identity Pool (AWS credentials), both
- **App type**: web SPA, mobile app, server-side, machine-to-machine
- **Sign-in methods**: email, phone, username, social (Google, Apple, Facebook), SAML
- **MFA**: optional, required, SMS, TOTP

### Step 2: Generate User Pool configuration

Create Cognito User Pool with:
- Sign-in options: email, phone number, preferred username
- Password policy (length, complexity, temp password expiry)
- MFA configuration (OFF, OPTIONAL, REQUIRED)
- MFA methods: SMS, TOTP authenticator app
- Account recovery: email or phone verified
- User attributes (standard + custom)
- Email verification: Cognito default or SES (production)
- Lambda triggers: pre-signup, post-confirmation, pre-token-generation, custom message
- Advanced security features (adaptive auth, compromised credentials)
- Deletion protection

### Step 3: Generate App Client

Configure app client with:
- OAuth 2.0 flows:
  - Authorization Code with PKCE (web/mobile — recommended)
  - Implicit (legacy, avoid)
  - Client Credentials (machine-to-machine)
- Scopes: openid, email, profile, phone, custom scopes
- Callback URLs and logout URLs
- Token expiration (access: 5min-1day, ID: 5min-1day, refresh: 1-3650 days)
- Token revocation enabled
- Prevent user existence errors (security)

### Step 4: Configure Identity Providers

**Social login:**
- Google (OAuth 2.0)
- Apple (Sign in with Apple)
- Facebook (OAuth 2.0)
- Amazon (Login with Amazon)

**Enterprise:**
- SAML 2.0 (Okta, Azure AD, OneLogin)
- OIDC (any OpenID Connect provider)

- Attribute mapping from provider to Cognito
- Hosted UI or custom UI

### Step 5: Generate Identity Pool (if needed)

For direct AWS service access from client:
- Authenticated and unauthenticated roles
- Role mapping rules (token claims → IAM roles)
- Identity providers: Cognito User Pool, social, SAML
- Fine-grained access with policy variables

### Step 6: Generate auth code

Create frontend authentication:

**Amplify JS (recommended for web/mobile):**
- signUp, signIn, signOut, getCurrentUser
- OAuth redirect handling
- Token refresh
- MFA challenge handling

**Custom implementation:**
- Cognito SDK (InitiateAuth, RespondToAuthChallenge)
- JWT token validation
- Secure token storage

**Backend verification:**
- JWT verification with JWKS
- Middleware for API protection
- Token introspection

### Best practices:
- Use Authorization Code with PKCE (not Implicit flow)
- Enable MFA for production applications
- Use SES for email sending (not Cognito default) in production
- Set strong password policies
- Enable advanced security features
- Use Lambda triggers for custom workflows
- Store tokens securely (httpOnly cookies or secure storage)
- Implement token refresh before expiration
- Use Cognito groups for role-based access control
