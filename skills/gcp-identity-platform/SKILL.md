---
name: gcp-identity-platform
description: Generate Identity Platform configurations with multi-tenant authentication, social login, SAML/OIDC federation, MFA, and blocking functions. Use when the user wants to add user authentication to GCP applications.
argument-hint: "[auth-method]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Identity Platform authentication expert. Generate production-ready authentication configurations with multi-tenancy, social login, enterprise federation, and advanced security features.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Auth methods**: email/password, social login, SAML, OIDC, phone, anonymous
- **Multi-tenancy**: single tenant or multi-tenant (B2B SaaS)
- **MFA**: SMS, TOTP, or both
- **App type**: web SPA, mobile app, server-side, microservices
- **Federation**: Google, Facebook, Apple, GitHub, SAML IdP, OIDC provider

### Step 2: Understand Identity Platform vs Firebase Auth

| Feature | Identity Platform | Firebase Auth |
|---------|------------------|---------------|
| Multi-tenancy | Yes | No |
| SAML federation | Yes | No |
| OIDC federation | Yes | Limited |
| Blocking functions | Yes (before/after) | Limited |
| MFA | SMS + TOTP | SMS only |
| User management API | Full Admin SDK | Limited |
| SLA | Enterprise SLA | No SLA |
| Pricing | Pay per MAU | Free tier + per verification |
| Best for | Enterprise/B2B | Consumer apps |

**Identity Platform is the enterprise upgrade of Firebase Auth.** Both use the same SDKs and APIs.

### Step 3: Enable Identity Platform and configure providers

```bash
# Enable Identity Platform API
gcloud services enable identitytoolkit.googleapis.com

# Enable email/password authentication
gcloud identity-platform config update \
  --enable-email-signin \
  --enable-email-link-signin

# Enable phone authentication
gcloud identity-platform config update \
  --enable-phone-signin

# Enable anonymous authentication
gcloud identity-platform config update \
  --enable-anonymous-signin
```

**Terraform Identity Platform configuration:**
```hcl
resource "google_identity_platform_config" "default" {
  project = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required  = true
    }

    phone_number {
      enabled = true
      test_phone_numbers = {
        "+11234567890" = "123456" # Test phone for development
      }
    }

    anonymous {
      enabled = true
    }
  }

  # Password policy
  sign_in {
    email {
      enabled = true
      password_required = true
    }
  }

  # Blocking functions
  blocking_functions {
    triggers {
      event_type   = "beforeCreate"
      function_uri = google_cloudfunctions2_function.before_create.uri
    }
    triggers {
      event_type   = "beforeSignIn"
      function_uri = google_cloudfunctions2_function.before_signin.uri
    }
  }

  # Authorized domains for OAuth redirects
  authorized_domains = [
    "myapp.example.com",
    "staging.myapp.example.com",
    "localhost",
  ]

  # MFA configuration
  mfa {
    enabled_providers = ["PHONE_SMS"]
    state             = "ENABLED" # DISABLED, ENABLED, MANDATORY

    provider_configs {
      state = "ENABLED"
      totp_provider_config {
        adjacent_intervals = 1
      }
    }
  }
}
```

### Step 4: Configure social login providers

**Google sign-in:**
```bash
gcloud identity-platform default-supported-idp-configs create \
  --idp-id=google.com \
  --client-id=YOUR_GOOGLE_CLIENT_ID \
  --client-secret=YOUR_GOOGLE_CLIENT_SECRET \
  --enabled
```

**Terraform social providers:**
```hcl
# Google
resource "google_identity_platform_default_supported_idp_config" "google" {
  project       = var.project_id
  idp_id        = "google.com"
  client_id     = var.google_oauth_client_id
  client_secret = var.google_oauth_client_secret
  enabled       = true
}

# Facebook
resource "google_identity_platform_default_supported_idp_config" "facebook" {
  project       = var.project_id
  idp_id        = "facebook.com"
  client_id     = var.facebook_app_id
  client_secret = var.facebook_app_secret
  enabled       = true
}

# Apple
resource "google_identity_platform_default_supported_idp_config" "apple" {
  project       = var.project_id
  idp_id        = "apple.com"
  client_id     = var.apple_service_id
  client_secret = var.apple_key_content
  enabled       = true
}

# GitHub
resource "google_identity_platform_default_supported_idp_config" "github" {
  project       = var.project_id
  idp_id        = "github.com"
  client_id     = var.github_client_id
  client_secret = var.github_client_secret
  enabled       = true
}

# Twitter
resource "google_identity_platform_default_supported_idp_config" "twitter" {
  project       = var.project_id
  idp_id        = "twitter.com"
  client_id     = var.twitter_api_key
  client_secret = var.twitter_api_secret
  enabled       = true
}
```

### Step 5: Configure SAML federation

```bash
# Create SAML provider (Okta, Azure AD, etc.)
gcloud identity-platform inbound-saml-configs create my-saml-provider \
  --idp-entity-id="https://idp.example.com/saml" \
  --sso-url="https://idp.example.com/saml/sso" \
  --idp-certificates="path/to/idp-cert.pem" \
  --sp-entity-id="https://myapp.example.com" \
  --enabled
```

**Terraform SAML configuration:**
```hcl
resource "google_identity_platform_inbound_saml_config" "okta" {
  project      = var.project_id
  display_name = "Okta SAML"
  name         = "saml.okta"
  enabled      = true

  idp_config {
    idp_entity_id = "https://company.okta.com/app/exk1234567890"
    sign_request  = true
    sso_url       = "https://company.okta.com/app/exk1234567890/sso/saml"

    idp_certificates {
      x509_certificate = var.okta_saml_certificate
    }
  }

  sp_config {
    sp_entity_id  = "https://myapp.example.com"
    callback_uri  = "https://myapp.example.com/__/auth/handler"
  }
}

# Azure AD SAML
resource "google_identity_platform_inbound_saml_config" "azure_ad" {
  project      = var.project_id
  display_name = "Azure AD SAML"
  name         = "saml.azure-ad"
  enabled      = true

  idp_config {
    idp_entity_id = "https://sts.windows.net/${var.azure_tenant_id}/"
    sign_request  = true
    sso_url       = "https://login.microsoftonline.com/${var.azure_tenant_id}/saml2"

    idp_certificates {
      x509_certificate = var.azure_ad_saml_certificate
    }
  }

  sp_config {
    sp_entity_id  = "https://myapp.example.com"
    callback_uri  = "https://myapp.example.com/__/auth/handler"
  }
}
```

### Step 6: Configure OIDC federation

```hcl
resource "google_identity_platform_oauth_idp_config" "custom_oidc" {
  project      = var.project_id
  display_name = "Custom OIDC Provider"
  name         = "oidc.custom-provider"
  enabled      = true

  client_id     = var.oidc_client_id
  client_secret = var.oidc_client_secret
  issuer        = "https://auth.custom-provider.com"

  # Response type: code (authorization code flow) or id_token (implicit)
  response_type {
    code     = true
    id_token = false
  }
}

# Auth0 OIDC provider
resource "google_identity_platform_oauth_idp_config" "auth0" {
  project      = var.project_id
  display_name = "Auth0"
  name         = "oidc.auth0"
  enabled      = true

  client_id     = var.auth0_client_id
  client_secret = var.auth0_client_secret
  issuer        = "https://${var.auth0_domain}/"

  response_type {
    code = true
  }
}
```

### Step 7: Configure multi-tenancy

```bash
# Create a tenant
gcloud identity-platform tenants create \
  --display-name="Acme Corp" \
  --enable-email-link-signin \
  --enable-email-signin

# List tenants
gcloud identity-platform tenants list

# Configure tenant-specific providers
gcloud identity-platform tenants update TENANT_ID \
  --enable-email-signin
```

**Terraform multi-tenancy:**
```hcl
# Enable multi-tenancy
resource "google_identity_platform_config" "default" {
  project = var.project_id

  multi_tenant {
    allow_tenants              = true
    default_tenant_location    = "us"
  }
}

# Create tenants for each customer
resource "google_identity_platform_tenant" "acme" {
  project      = var.project_id
  display_name = "Acme Corp"

  allow_password_signup = true
  enable_email_link_signin = false
  disable_auth = false
}

resource "google_identity_platform_tenant" "globex" {
  project      = var.project_id
  display_name = "Globex Corporation"

  allow_password_signup = true
  enable_email_link_signin = true
}

# Tenant-specific SAML provider
resource "google_identity_platform_tenant_inbound_saml_config" "acme_saml" {
  project      = var.project_id
  tenant       = google_identity_platform_tenant.acme.name
  display_name = "Acme Corp SAML"
  name         = "saml.acme-okta"
  enabled      = true

  idp_config {
    idp_entity_id = var.acme_saml_entity_id
    sso_url       = var.acme_saml_sso_url
    sign_request  = true

    idp_certificates {
      x509_certificate = var.acme_saml_certificate
    }
  }

  sp_config {
    sp_entity_id = "https://myapp.example.com"
    callback_uri = "https://myapp.example.com/__/auth/handler"
  }
}

# Tenant-specific OIDC provider
resource "google_identity_platform_tenant_oauth_idp_config" "acme_oidc" {
  project      = var.project_id
  tenant       = google_identity_platform_tenant.acme.name
  display_name = "Acme Corp OIDC"
  name         = "oidc.acme"
  enabled      = true

  client_id     = var.acme_oidc_client_id
  client_secret = var.acme_oidc_client_secret
  issuer        = var.acme_oidc_issuer
}
```

### Step 8: Generate client-side authentication code

**Web application (JavaScript):**
```javascript
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  SAMLAuthProvider,
  OAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  multiFactor,
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const app = initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
});

const auth = getAuth(app);

// For multi-tenant apps, set the tenant ID
// auth.tenantId = "tenant-id-from-your-backend";

// Email/password sign-up
async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    console.log("Signed up:", user.uid);
    return { user, idToken };
  } catch (error) {
    console.error("Sign-up error:", error.code, error.message);
    throw error;
  }
}

// Email/password sign-in
async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    return { user, idToken };
  } catch (error) {
    if (error.code === "auth/multi-factor-auth-required") {
      // Handle MFA challenge
      return handleMfaChallenge(error);
    }
    throw error;
  }
}

// Google sign-in
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// SAML sign-in
async function signInWithSaml(providerId) {
  const provider = new SAMLAuthProvider(providerId); // e.g., "saml.okta"
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// OIDC sign-in
async function signInWithOidc(providerId) {
  const provider = new OAuthProvider(providerId); // e.g., "oidc.auth0"
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Phone sign-in
async function signInWithPhone(phoneNumber, recaptchaContainerId) {
  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: "normal",
  });
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult; // Call confirmationResult.confirm(code) with SMS code
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User signed in:", user.uid, user.email);
  } else {
    console.log("User signed out");
  }
});

// Sign out
async function signOutUser() {
  await signOut(auth);
}
```

**Server-side token verification (Python):**
```python
from firebase_admin import auth, initialize_app
import firebase_admin

# Initialize the Admin SDK
app = initialize_app()

def verify_id_token(id_token: str, tenant_id: str = None) -> dict:
    """Verify a Firebase ID token and return decoded claims."""
    try:
        decoded_token = auth.verify_id_token(id_token)

        # For multi-tenant apps, verify tenant ID
        if tenant_id and decoded_token.get("firebase", {}).get("tenant") != tenant_id:
            raise ValueError("Token tenant mismatch")

        return decoded_token
    except auth.InvalidIdTokenError:
        raise ValueError("Invalid ID token")
    except auth.ExpiredIdTokenError:
        raise ValueError("Expired ID token")
    except auth.RevokedIdTokenError:
        raise ValueError("Revoked ID token")

# Flask middleware for authentication
from flask import Flask, request, jsonify, g
from functools import wraps

app = Flask(__name__)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing authorization header"}), 401

        id_token = auth_header.split("Bearer ")[1]
        try:
            decoded_token = verify_id_token(id_token)
            g.user = decoded_token
            g.uid = decoded_token["uid"]
        except ValueError as e:
            return jsonify({"error": str(e)}), 401

        return f(*args, **kwargs)
    return decorated

@app.route("/api/profile")
@require_auth
def get_profile():
    uid = g.uid
    user = auth.get_user(uid)
    return jsonify({
        "uid": user.uid,
        "email": user.email,
        "display_name": user.display_name,
        "custom_claims": user.custom_claims,
    })
```

**Node.js server-side verification:**
```javascript
const admin = require("firebase-admin");

admin.initializeApp();

async function verifyIdToken(idToken, tenantId = null) {
  try {
    let decodedToken;
    if (tenantId) {
      const tenantAuth = admin.auth().tenantManager().authForTenant(tenantId);
      decodedToken = await tenantAuth.verifyIdToken(idToken);
    } else {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    }
    return decodedToken;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// Express middleware
function requireAuth(tenantId = null) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      req.user = await verifyIdToken(idToken, tenantId);
      next();
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };
}

app.get("/api/profile", requireAuth(), async (req, res) => {
  const user = await admin.auth().getUser(req.user.uid);
  res.json({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    customClaims: user.customClaims,
  });
});
```

### Step 9: Generate MFA configuration

**Enroll MFA (client-side):**
```javascript
import {
  multiFactor,
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from "firebase/auth";

// Enroll phone MFA
async function enrollPhoneMfa(user, phoneNumber, recaptchaContainerId) {
  const multiFactorSession = await multiFactor(user).getSession();
  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId);

  const phoneInfoOptions = {
    phoneNumber,
    session: multiFactorSession,
  };

  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneInfoOptions,
    recaptchaVerifier
  );

  // After user enters SMS code:
  // const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  // const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  // await multiFactor(user).enroll(multiFactorAssertion, "My phone");
  return verificationId;
}

// Enroll TOTP MFA
async function enrollTotpMfa(user) {
  const multiFactorSession = await multiFactor(user).getSession();
  const totpSecret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);

  // Display QR code to user
  const qrCodeUrl = totpSecret.generateQrCodeUrl(user.email, "MyApp");
  console.log("Scan this QR code:", qrCodeUrl);

  // After user enters TOTP code:
  // const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
  //   totpSecret, totpCode
  // );
  // await multiFactor(user).enroll(multiFactorAssertion, "Authenticator app");
  return { totpSecret, qrCodeUrl };
}

// Handle MFA challenge during sign-in
async function handleMfaChallenge(error) {
  const resolver = error.resolver;
  const hints = resolver.hints;

  // Show user which MFA methods are available
  hints.forEach((hint, index) => {
    if (hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
      console.log(`${index}: Phone: ${hint.phoneNumber}`);
    } else if (hint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
      console.log(`${index}: TOTP: ${hint.displayName}`);
    }
  });

  // For TOTP:
  // const multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(
  //   resolver.hints[selectedIndex].uid, totpCode
  // );
  // const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
  return resolver;
}
```

### Step 10: Generate blocking functions

**Before sign-up blocking function:**
```python
# before_create/main.py
from firebase_admin import auth, initialize_app
from firebase_functions import identity_fn

initialize_app()

@identity_fn.before_user_created()
def before_create(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeCreateResponse | None:
    """Run before a new user is created. Can block or modify the creation."""
    user = event.data

    # Block sign-up from non-allowed domains
    if user.email and not user.email.endswith("@company.com"):
        raise identity_fn.HttpsError(
            code=identity_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="Only company.com email addresses are allowed."
        )

    # Set custom claims for new users
    return identity_fn.BeforeCreateResponse(
        custom_claims={
            "role": "user",
            "plan": "free",
        },
        display_name=user.email.split("@")[0] if user.email else None,
    )
```

**Before sign-in blocking function:**
```python
# before_signin/main.py
from firebase_admin import auth, initialize_app
from firebase_functions import identity_fn
import time

initialize_app()

@identity_fn.before_user_signed_in()
def before_signin(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeSignInResponse | None:
    """Run before a user signs in. Can block or modify the sign-in."""
    user = event.data

    # Block disabled users
    if user.disabled:
        raise identity_fn.HttpsError(
            code=identity_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="Account has been disabled."
        )

    # Enforce MFA for admin users
    if user.custom_claims and user.custom_claims.get("role") == "admin":
        if not event.data.multi_factor:
            raise identity_fn.HttpsError(
                code=identity_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Admin users must use multi-factor authentication."
            )

    # Update session claims
    return identity_fn.BeforeSignInResponse(
        session_claims={
            "last_sign_in": int(time.time()),
            "sign_in_ip": event.ip_address,
        }
    )
```

### Step 11: Generate user management with Admin SDK

**Python Admin SDK:**
```python
from firebase_admin import auth, initialize_app

app = initialize_app()

# Create a user
user = auth.create_user(
    email="user@example.com",
    password="securePassword123!",
    display_name="John Doe",
    phone_number="+11234567890",
    email_verified=True,
)
print(f"Created user: {user.uid}")

# Set custom claims (RBAC)
auth.set_custom_user_claims(user.uid, {
    "role": "admin",
    "permissions": ["read", "write", "delete"],
    "tenant": "acme",
})

# Get user by email
user = auth.get_user_by_email("user@example.com")
print(f"User claims: {user.custom_claims}")

# List users (paginated)
page = auth.list_users()
while page:
    for user in page.users:
        print(f"User: {user.uid}, Email: {user.email}")
    page = page.get_next_page()

# Update user
auth.update_user(
    user.uid,
    email="newemail@example.com",
    display_name="Jane Doe",
    disabled=False,
)

# Delete user
auth.delete_user(user.uid)

# Bulk delete
auth.delete_users(["uid1", "uid2", "uid3"])

# Revoke refresh tokens (force re-authentication)
auth.revoke_refresh_tokens(user.uid)

# Generate password reset link
link = auth.generate_password_reset_link("user@example.com")

# Generate email verification link
link = auth.generate_email_verification_link("user@example.com")

# Multi-tenant user management
tenant_auth = auth.tenant_manager().auth_for_tenant("tenant-id")
tenant_user = tenant_auth.create_user(
    email="user@acme.com",
    password="securePassword123!",
)
```

### Step 12: Generate session management

**Cookie-based sessions (server-side):**
```python
from firebase_admin import auth
from flask import Flask, request, jsonify, make_response
import datetime

app = Flask(__name__)

@app.route("/api/session-login", methods=["POST"])
def session_login():
    """Create a session cookie from an ID token."""
    id_token = request.json.get("idToken")
    if not id_token:
        return jsonify({"error": "Missing ID token"}), 400

    try:
        # Verify the ID token first
        decoded_token = auth.verify_id_token(id_token)

        # Only create session if token was recently issued (within 5 minutes)
        if (datetime.datetime.utcnow().timestamp() - decoded_token["auth_time"]) > 300:
            return jsonify({"error": "Recent sign-in required"}), 401

        # Create session cookie (max 14 days)
        expires_in = datetime.timedelta(days=5)
        session_cookie = auth.create_session_cookie(
            id_token,
            expires_in=expires_in,
        )

        response = make_response(jsonify({"status": "success"}))
        response.set_cookie(
            "session",
            session_cookie,
            max_age=int(expires_in.total_seconds()),
            httponly=True,
            secure=True,
            samesite="Strict",
        )
        return response
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid ID token"}), 401

@app.route("/api/session-verify")
def verify_session():
    """Verify a session cookie."""
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        return jsonify({"error": "No session"}), 401

    try:
        decoded_claims = auth.verify_session_cookie(
            session_cookie,
            check_revoked=True,
        )
        return jsonify({"uid": decoded_claims["uid"]})
    except auth.InvalidSessionCookieError:
        return jsonify({"error": "Invalid session"}), 401
    except auth.ExpiredSessionCookieError:
        return jsonify({"error": "Session expired"}), 401

@app.route("/api/session-logout", methods=["POST"])
def session_logout():
    """Sign out and revoke session."""
    session_cookie = request.cookies.get("session")
    if session_cookie:
        try:
            decoded = auth.verify_session_cookie(session_cookie)
            auth.revoke_refresh_tokens(decoded["uid"])
        except Exception:
            pass

    response = make_response(jsonify({"status": "signed out"}))
    response.delete_cookie("session")
    return response
```

### Step 13: Generate email templates and password policies

```hcl
# Terraform password policy configuration
resource "google_identity_platform_config" "auth" {
  project = var.project_id

  sign_in {
    email {
      enabled           = true
      password_required = true
    }
  }

  # Note: Email templates are configured via Firebase Console or REST API
  # Password policies are configured via the Identity Platform REST API
}
```

**Password policy via REST API:**
```bash
# Set password policy
curl -X PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/MY_PROJECT/config?updateMask=passwordPolicyConfig" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "passwordPolicyConfig": {
      "passwordPolicyEnforcementState": "ENFORCE",
      "passwordPolicyVersions": [{
        "customStrengthOptions": {
          "minPasswordLength": 12,
          "maxPasswordLength": 128,
          "containsLowercaseCharacter": true,
          "containsUppercaseCharacter": true,
          "containsNumericCharacter": true,
          "containsNonAlphanumericCharacter": true
        }
      }],
      "forceUpgradeOnSignin": true
    }
  }'
```

### Step 14: Generate reCAPTCHA integration

```bash
# Enable reCAPTCHA Enterprise for Identity Platform
gcloud identity-platform config update \
  --enable-recaptcha-enterprise

# Configure reCAPTCHA for email/password
curl -X PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/MY_PROJECT/config?updateMask=recaptchaConfig" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "recaptchaConfig": {
      "emailPasswordEnforcementState": "ENFORCE",
      "managedRules": [{
        "endScore": 0.3,
        "action": "BLOCK"
      }],
      "useAccountDefender": true
    }
  }'
```

### Step 15: Account linking

```javascript
import {
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

// Link email/password to social account
async function linkEmailPassword(user, email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(user, credential);
  console.log("Account linked:", result.user.providerData);
  return result;
}

// Link Google to existing account
async function linkGoogle(user) {
  const provider = new GoogleAuthProvider();
  const result = await linkWithCredential(user, provider);
  return result;
}

// Handle account exists with different credential
async function handleAccountExists(email) {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  console.log("Sign-in methods for this email:", methods);
  // Prompt user to sign in with existing method, then link
  return methods;
}
```

## Best practices

- **Use Identity Platform** (not Firebase Auth) for enterprise and B2B applications
- **Always verify ID tokens** server-side before granting access to resources
- **Enable MFA** for all production applications (at minimum, offer it as optional)
- **Use blocking functions** for custom validation (domain restrictions, compliance checks)
- **Use custom claims** for role-based access control (RBAC) instead of database lookups
- **Keep custom claims small** (under 1000 bytes total) as they are included in every token
- **Use session cookies** for server-rendered applications (more secure than client-side tokens)
- **Set token expiration** appropriately (shorter for sensitive operations)
- **Use multi-tenancy** for B2B SaaS to isolate customer authentication
- **Enable reCAPTCHA** to protect against bot sign-ups and credential stuffing

## Anti-patterns

- Storing user roles in a database and checking on every request (use custom claims instead)
- Not verifying ID tokens server-side (trusting client-side authentication alone)
- Using long-lived custom tokens without refresh logic
- Sharing tenant configurations across customers in B2B apps
- Not revoking tokens when a user is disabled or deleted
- Storing sensitive data in custom claims (they are visible to the client)
- Not implementing account linking, causing duplicate accounts

## Cost optimization

- Identity Platform charges per monthly active user (MAU)
- Phone authentication has per-SMS costs; use TOTP MFA to reduce SMS costs
- Use anonymous authentication sparingly (each anonymous user counts as a MAU)
- Clean up anonymous users periodically to reduce MAU count
- Use blocking functions to prevent unwanted sign-ups (reduces MAU)
- Cache user claims in server memory to reduce Admin SDK API calls

## Security considerations

- Enable reCAPTCHA Enterprise to prevent bot attacks
- Use blocking functions to enforce email domain restrictions
- Require MFA for admin and privileged users
- Implement session management with httpOnly, secure, and SameSite cookies
- Revoke refresh tokens immediately when a user is compromised
- Enable Cloud Audit Logging for authentication events
- Use password policies to enforce strong passwords
- Monitor for suspicious sign-in patterns (multiple failed attempts, unusual locations)
- Implement account lockout after repeated failed sign-in attempts
- Use short-lived session cookies (5 days max) and require re-authentication for sensitive operations
