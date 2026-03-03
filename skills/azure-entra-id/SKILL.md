---
name: azure-entra-id
description: Generate Entra ID configs with app registrations, auth flows, and conditional access
invocation: /azure-entra-id [scenario]
arguments:
  - name: scenario
    description: "Scenario (app-registration, auth-flow, conditional-access, b2c)"
    required: false
allowed_tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
---

## Instructions

You are a Microsoft Entra ID (formerly Azure AD) identity expert. Generate production-ready identity and access management configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Scenario**: app registration, authentication flow, conditional access, B2C/External ID
- **App type**: SPA, web app, web API, daemon/service, mobile, desktop
- **Tenancy**: single-tenant, multi-tenant, personal accounts
- **Auth flow**: authorization code + PKCE, client credentials, on-behalf-of, device code
- **Platform**: .NET, JavaScript/React, Python, Java, Node.js

### Step 2: Generate app registration

```bicep
// App registration via Microsoft Graph (Bicep deployment script)
resource appRegistrationScript 'Microsoft.Resources/deploymentScripts@2023-08-01' = {
  name: 'create-app-registration'
  location: location
  kind: 'AzureCLI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    azCliVersion: '2.53.0'
    retentionInterval: 'P1D'
    scriptContent: '''
      # Create app registration
      APP_ID=$(az ad app create \
        --display-name "${APP_NAME}" \
        --sign-in-audience "AzureADMyOrg" \
        --web-redirect-uris "https://${APP_DOMAIN}/auth/callback" \
        --enable-id-token-issuance true \
        --enable-access-token-issuance false \
        --query appId -o tsv)

      # Add API permissions
      az ad app permission add \
        --id $APP_ID \
        --api 00000003-0000-0000-c000-000000000000 \
        --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope  # User.Read

      # Create service principal
      az ad sp create --id $APP_ID

      # Create client secret (for web apps, not SPAs)
      SECRET=$(az ad app credential reset \
        --id $APP_ID \
        --display-name "production" \
        --years 2 \
        --query password -o tsv)

      echo "{\"appId\": \"$APP_ID\", \"secret\": \"$SECRET\"}" > $AZ_SCRIPTS_OUTPUT_PATH
    '''
    environmentVariables: [
      { name: 'APP_NAME', value: '${appName}-${environment}' }
      { name: 'APP_DOMAIN', value: appDomain }
    ]
  }
}
```

**App registration configuration via Terraform:**

```hcl
resource "azuread_application" "web_app" {
  display_name     = "${var.app_name}-${var.environment}"
  sign_in_audience = "AzureADMyOrg"  # AzureADMyOrg, AzureADMultipleOrgs, AzureADandPersonalMicrosoftAccount

  web {
    homepage_url  = "https://${var.app_domain}"
    redirect_uris = [
      "https://${var.app_domain}/auth/callback",
      "https://${var.app_domain}/auth/silent-callback"
    ]

    implicit_grant {
      id_token_issuance_enabled     = true   # For hybrid flows
      access_token_issuance_enabled = false  # Never for production
    }
  }

  # For SPAs
  single_page_application {
    redirect_uris = [
      "https://${var.app_domain}/auth/callback",
      "http://localhost:3000/auth/callback"
    ]
  }

  # API permissions
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }
    resource_access {
      id   = "df021288-bdef-4463-88db-98f22de89214" # User.Read.All
      type = "Role"  # Application permission (requires admin consent)
    }
  }

  # Expose an API
  api {
    mapped_claims_enabled          = true
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Read order data"
      admin_consent_display_name = "Read Orders"
      id                         = random_uuid.orders_read.result
      value                      = "Orders.Read"
      type                       = "User"
      user_consent_description   = "Read your order data"
      user_consent_display_name  = "Read Orders"
    }

    oauth2_permission_scope {
      admin_consent_description  = "Read and write order data"
      admin_consent_display_name = "Read/Write Orders"
      id                         = random_uuid.orders_write.result
      value                      = "Orders.ReadWrite"
      type                       = "Admin"
    }
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Administrators can manage all aspects"
    display_name         = "Admin"
    id                   = random_uuid.admin_role.result
    value                = "Admin"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Readers can view data"
    display_name         = "Reader"
    id                   = random_uuid.reader_role.result
    value                = "Reader"
  }

  # Optional claims in tokens
  optional_claims {
    id_token {
      name                  = "email"
      essential             = true
      additional_properties = []
    }
    id_token {
      name                  = "groups"
      additional_properties = ["emit_as_roles"]
    }
    access_token {
      name                  = "ipaddr"
      additional_properties = []
    }
  }

  # Token configuration
  group_membership_claims = ["SecurityGroup"]

  tags = ["production", var.environment]
}

resource "azuread_application_identifier_uri" "api" {
  application_id = azuread_application.web_app.id
  identifier_uri = "api://${azuread_application.web_app.client_id}"
}

resource "azuread_service_principal" "web_app" {
  client_id                    = azuread_application.web_app.client_id
  app_role_assignment_required = true  # Require explicit user/group assignment
  owners                       = [data.azuread_client_config.current.object_id]

  feature_tags {
    enterprise = true
    gallery    = false
  }
}

# Client secret (store in Key Vault)
resource "azuread_application_password" "web_app" {
  application_id = azuread_application.web_app.id
  display_name   = "production-secret"
  end_date       = timeadd(timestamp(), "8760h")  # 1 year

  lifecycle {
    ignore_changes = [end_date]
  }
}

resource "azurerm_key_vault_secret" "client_secret" {
  name         = "app-client-secret"
  value        = azuread_application_password.web_app.value
  key_vault_id = azurerm_key_vault.main.id
}
```

### Step 3: Generate authentication code

**Authorization Code + PKCE (SPA with MSAL.js):**

```typescript
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: 'https://myapp.com/auth/callback',
    postLogoutRedirectUri: 'https://myapp.com',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',  // or 'localStorage'
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();

// Login
const loginRequest = {
  scopes: ['User.Read', 'api://YOUR_API_CLIENT_ID/Orders.Read'],
  prompt: 'select_account',
};

try {
  const result = await msalInstance.loginPopup(loginRequest);
  console.log('Logged in:', result.account.username);
} catch (error) {
  console.error('Login failed:', error);
}

// Acquire token silently (with fallback to interactive)
async function getAccessToken(scopes: string[]): Promise<string> {
  const account = msalInstance.getAllAccounts()[0];
  if (!account) throw new Error('No account found');

  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes,
      account,
    });
    return result.accessToken;
  } catch (error) {
    // Fallback to interactive
    const result = await msalInstance.acquireTokenPopup({ scopes });
    return result.accessToken;
  }
}

// Call API with token
async function callApi() {
  const token = await getAccessToken(['api://YOUR_API_CLIENT_ID/Orders.Read']);
  const response = await fetch('https://api.myapp.com/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
```

**Client credentials flow (daemon/service .NET):**

```csharp
using Azure.Identity;
using Microsoft.Graph;

// Using DefaultAzureCredential (recommended)
var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
{
    TenantId = "YOUR_TENANT_ID",
    ManagedIdentityClientId = "YOUR_USER_ASSIGNED_MI_CLIENT_ID"  // Optional
});

// Microsoft Graph client
var graphClient = new GraphServiceClient(credential,
    new[] { "https://graph.microsoft.com/.default" });

var users = await graphClient.Users
    .GetAsync(r => r.QueryParameters.Top = 10);

// Custom API client
var tokenCredential = new ClientSecretCredential(
    "YOUR_TENANT_ID",
    "YOUR_CLIENT_ID",
    "YOUR_CLIENT_SECRET"  // From Key Vault
);

var tokenResult = await tokenCredential.GetTokenAsync(
    new TokenRequestContext(new[] { "api://YOUR_API_CLIENT_ID/.default" }));

using var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", tokenResult.Token);
```

**On-behalf-of flow (middle-tier API .NET):**

```csharp
// In your API controller, exchange the incoming token for a downstream API token
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ITokenAcquisition _tokenAcquisition;

    public OrdersController(ITokenAcquisition tokenAcquisition)
    {
        _tokenAcquisition = tokenAcquisition;
    }

    [HttpGet]
    [RequiredScope("Orders.Read")]
    public async Task<IActionResult> GetOrders()
    {
        // Exchange user's token for downstream API token (OBO flow)
        var token = await _tokenAcquisition.GetAccessTokenForUserAsync(
            new[] { "api://downstream-api/.default" });

        // Call downstream API with the new token
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("https://downstream-api.com/data");
        return Ok(await response.Content.ReadAsStringAsync());
    }
}

// Program.cs configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi()
    .AddInMemoryTokenCaches();
```

**API validation (Python Flask):**

```python
from flask import Flask, request, jsonify
from functools import wraps
import jwt
import requests

app = Flask(__name__)

TENANT_ID = "YOUR_TENANT_ID"
CLIENT_ID = "YOUR_API_CLIENT_ID"
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

# Cache OIDC configuration and keys
_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        oidc_config = requests.get(
            f"{AUTHORITY}/v2.0/.well-known/openid-configuration"
        ).json()
        _jwks_client = jwt.PyJWKClient(oidc_config["jwks_uri"])
    return _jwks_client

def require_auth(required_scopes=None, required_roles=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing token"}), 401

            token = auth_header[7:]

            try:
                jwks_client = get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)

                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    audience=CLIENT_ID,
                    issuer=f"{AUTHORITY}/v2.0",
                    options={"verify_exp": True}
                )

                # Validate scopes
                if required_scopes:
                    token_scopes = payload.get("scp", "").split()
                    if not any(s in token_scopes for s in required_scopes):
                        return jsonify({"error": "Insufficient scope"}), 403

                # Validate app roles
                if required_roles:
                    token_roles = payload.get("roles", [])
                    if not any(r in token_roles for r in required_roles):
                        return jsonify({"error": "Insufficient role"}), 403

                request.user = payload
                return f(*args, **kwargs)

            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError as e:
                return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return wrapper
    return decorator

@app.route("/api/orders")
@require_auth(required_scopes=["Orders.Read"])
def get_orders():
    user_id = request.user["oid"]
    return jsonify({"orders": [], "userId": user_id})
```

### Step 4: Generate conditional access policy

```hcl
# Terraform conditional access policy
resource "azuread_conditional_access_policy" "require_mfa" {
  display_name = "Require MFA for all users"
  state        = "enabledForReportingButNotEnforced"  # Test first

  conditions {
    users {
      included_users  = ["All"]
      excluded_users  = []
      excluded_groups = [azuread_group.break_glass.object_id]
    }

    applications {
      included_applications = ["All"]
      excluded_applications = []
    }

    locations {
      included_locations = ["All"]
      excluded_locations = [azuread_named_location.trusted_office.id]
    }

    platforms {
      included_platforms = ["all"]
      excluded_platforms = []
    }

    client_app_types = ["browser", "mobileAppsAndDesktopClients"]

    sign_in_risk_levels = []  # Requires Entra ID P2
    user_risk_levels    = []  # Requires Entra ID P2
  }

  grant_controls {
    operator                      = "OR"
    built_in_controls             = ["mfa"]
    authentication_strength_policy_id = null
  }

  session_controls {
    sign_in_frequency        = 24
    sign_in_frequency_period = "hours"
    persistent_browser_mode  = "never"

    cloud_app_security_policy {
      cloud_app_security_type = "monitorOnly"
    }
  }
}

# Require compliant device for sensitive apps
resource "azuread_conditional_access_policy" "compliant_device" {
  display_name = "Require compliant device for finance apps"
  state        = "enabled"

  conditions {
    users {
      included_groups = [azuread_group.finance_users.object_id]
    }

    applications {
      included_applications = [azuread_application.finance_app.client_id]
    }

    platforms {
      included_platforms = ["windows", "macOS", "iOS", "android"]
    }
  }

  grant_controls {
    operator          = "AND"
    built_in_controls = ["mfa", "compliantDevice"]
  }
}

# Named location (trusted office)
resource "azuread_named_location" "trusted_office" {
  display_name = "Corporate Office"
  ip {
    ip_ranges = [
      "203.0.113.0/24",
      "198.51.100.0/24"
    ]
    trusted = true
  }
}
```

### Step 5: Generate Entra External ID (B2C) configuration

```hcl
resource "azurerm_aadb2c_directory" "main" {
  country_code            = "US"
  data_residency_location = "United States"
  display_name            = "${var.app_name} Identity"
  domain_name             = "${var.app_name}auth.onmicrosoft.com"
  resource_group_name     = azurerm_resource_group.main.name
  sku_name                = "PremiumP1"

  tags = var.common_tags
}
```

**B2C custom user flow (sign-up/sign-in):**

```xml
<!-- TrustFrameworkExtensions.xml custom policy -->
<TrustFrameworkPolicy xmlns="http://schemas.microsoft.com/online/cpim/schemas/2013/06"
  PolicySchemaVersion="0.3.0.0"
  TenantId="yourtenant.onmicrosoft.com"
  PolicyId="B2C_1A_signup_signin"
  PublicPolicyUri="http://yourtenant.onmicrosoft.com/B2C_1A_signup_signin">

  <BasePolicy>
    <TenantId>yourtenant.onmicrosoft.com</TenantId>
    <PolicyId>B2C_1A_TrustFrameworkExtensions</PolicyId>
  </BasePolicy>

  <RelyingParty>
    <DefaultUserJourney ReferenceId="SignUpOrSignIn" />
    <TechnicalProfile Id="PolicyProfile">
      <Protocol Name="OpenIdConnect" />
      <OutputClaims>
        <OutputClaim ClaimTypeReferenceId="displayName" />
        <OutputClaim ClaimTypeReferenceId="email" />
        <OutputClaim ClaimTypeReferenceId="objectId" PartnerClaimType="sub" />
        <OutputClaim ClaimTypeReferenceId="tenantId" AlwaysUseDefaultValue="true"
          DefaultValue="{Policy:TenantObjectId}" />
      </OutputClaims>
      <SubjectNamingInfo ClaimType="sub" />
    </TechnicalProfile>
  </RelyingParty>
</TrustFrameworkPolicy>
```

### Step 6: Managed identity configuration

```bicep
// System-assigned managed identity (automatic lifecycle)
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-${appName}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
}

// User-assigned managed identity (shared across resources)
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${appName}-${environment}'
  location: location
  tags: commonTags
}

// Assign to multiple resources
resource appServiceWithUAMI 'Microsoft.Web/sites@2023-01-01' = {
  name: 'app-${appName}'
  location: location
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
}

// Federated credential for GitHub Actions OIDC
resource federatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: managedIdentity
  name: 'github-actions'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:myorg/myrepo:ref:refs/heads/main'
    audiences: ['api://AzureADTokenExchange']
  }
}
```

### Authentication flows reference

| Flow | Use Case | Client Type | Token Type |
|------|----------|-------------|------------|
| Authorization Code + PKCE | SPAs, web apps, mobile | Public/Confidential | ID + Access |
| Client Credentials | Daemon, service-to-service | Confidential | Access only |
| On-behalf-of | Middle-tier API | Confidential | Access (delegated) |
| Device Code | CLI tools, IoT, TV | Public | ID + Access |
| Implicit (deprecated) | Legacy SPAs | Public | ID token only |
| ROPC (avoid) | Legacy migration only | Public | ID + Access |

### Best practices

- **Use MSAL libraries** - Official, maintained, handles token caching and refresh automatically
- **Always use PKCE** - Required for SPAs, recommended for all public clients
- **Use managed identity** - Eliminate secrets for Azure-hosted workloads
- **Validate tokens properly** - Check issuer, audience, expiration, and signature
- **Use v2.0 endpoints** - `/v2.0/authorize` and `/v2.0/token` for modern auth
- **Request minimum scopes** - Only request permissions the app actually needs
- **Use app roles for authorization** - Map to application-level permissions
- **Implement token caching** - Use MSAL's built-in cache or distributed cache (Redis)
- **Configure token lifetime** - Use Conditional Access session controls, not token lifetime policies
- **Use workload identity federation** - Replace client secrets with federated credentials for CI/CD

### Anti-patterns

- **Using implicit grant** - Deprecated; use authorization code + PKCE instead
- **Storing tokens in localStorage** - Use sessionStorage or MSAL's secure cache
- **Using ROPC (username/password) flow** - Cannot support MFA; use interactive flows
- **Long-lived client secrets** - Rotate regularly or use certificate/managed identity
- **Validating tokens by calling Microsoft Graph** - Validate JWT locally using OIDC metadata
- **Over-requesting permissions** - Users will deny consent; request minimum scopes
- **Single client secret for all environments** - Use separate app registrations per environment
- **Skipping audience validation** - Always validate the `aud` claim matches your API

### Security considerations

- Enable conditional access policies (MFA, compliant device, location-based)
- Use Privileged Identity Management (PIM) for admin roles
- Configure continuous access evaluation (CAE) for near-real-time token revocation
- Implement sign-in risk and user risk policies (requires Entra ID P2)
- Use authentication strengths (phishing-resistant MFA) for sensitive operations
- Monitor sign-in logs and risky sign-ins in Entra ID portal
- Use break-glass accounts excluded from conditional access
- Regularly review app permissions and consent grants
- Enable cross-tenant access settings for B2B collaboration

### Cost optimization

- **Entra ID Free** - Basic SSO, MFA (security defaults), up to 50,000 MAU for External ID
- **Entra ID P1** - Conditional access, group-based licensing, self-service password reset
- **Entra ID P2** - PIM, Identity Protection, access reviews
- **External ID pricing** - First 50,000 MAU free, then per-authentication pricing
- Use security defaults instead of conditional access for simple MFA requirements (Free tier)
- Consolidate app registrations where appropriate (multi-tenant apps)
- Use managed identity to avoid certificate/secret management overhead
- Right-size your license tier based on actual feature usage
