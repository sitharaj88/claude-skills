---
name: azure-key-vault
description: Generate Azure Key Vault configurations for secrets management, cryptographic keys, certificates, and access policies with integration patterns. Use when the user wants to manage secrets, keys, or certificates securely.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(az *)
user-invocable: true
---

## Instructions

You are an Azure Key Vault expert. Generate production-ready secrets, key, and certificate management configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: secret management, cryptographic key operations, certificate management, access policy configuration
- **Secret types**: database credentials, API keys, connection strings, certificates
- **Access pattern**: App Service, Functions, Container Apps, AKS, VMs, cross-subscription
- **Compliance**: HSM-backed keys, audit requirements, FIPS 140-2

### Step 2: Choose vault type

| Feature | Standard | Premium |
|---------|----------|---------|
| Secrets | Yes | Yes |
| Software-protected keys | Yes | Yes |
| HSM-protected keys | No | Yes (FIPS 140-2 Level 2) |
| Certificates | Yes | Yes |
| Managed HSM | No | Separate service (FIPS 140-2 Level 3) |

For highest security: use **Azure Managed HSM** (dedicated, single-tenant HSM)

### Step 3: Generate Key Vault configuration

**Bicep:**
```bicep
param location string = resourceGroup().location
param vaultName string
param tenantId string = subscription().tenantId

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
    }
  }
}
```

**Terraform:**
```hcl
resource "azurerm_key_vault" "main" {
  name                          = var.vault_name
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  enable_rbac_authorization     = true
  soft_delete_retention_days    = 90
  purge_protection_enabled      = true
  public_network_access_enabled = false
  enabled_for_deployment        = false
  enabled_for_disk_encryption   = false
  enabled_for_template_deployment = false

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  tags = var.tags
}
```

### Step 4: Configure access model

**Recommended: Azure RBAC (role-based access control)**

```bicep
// Key Vault Secrets User - read secrets
resource secretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, 'secrets-user', appIdentityPrincipalId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: appIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Key Vault Secrets Officer - manage secrets
resource secretsOfficerRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, 'secrets-officer', adminPrincipalId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      'b86a8fe4-44ce-4948-aee5-eccb2c155cd7') // Key Vault Secrets Officer
    principalId: adminPrincipalId
    principalType: 'Group'
  }
}
```

**RBAC roles available:**
| Role | Permissions |
|------|------------|
| Key Vault Administrator | Full management of all vault objects |
| Key Vault Secrets Officer | CRUD on secrets |
| Key Vault Secrets User | Read secret values |
| Key Vault Crypto Officer | CRUD on keys |
| Key Vault Crypto User | Encrypt/decrypt/wrap/unwrap with keys |
| Key Vault Certificates Officer | CRUD on certificates |
| Key Vault Reader | Read vault metadata (not secret values) |

**Legacy: Vault access policies (not recommended for new deployments)**
```bicep
resource vaultWithPolicies 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  properties: {
    enableRbacAuthorization: false
    accessPolicies: [
      {
        tenantId: tenantId
        objectId: appIdentityObjectId
        permissions: {
          secrets: ['get', 'list']
          keys: []
          certificates: []
        }
      }
    ]
  }
}
```

### Step 5: Manage secrets

**Create secrets with versioning and metadata:**
```bash
# Create a secret
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "db-connection-string" \
  --value "Server=tcp:myserver.database.windows.net;..." \
  --content-type "text/plain" \
  --tags environment=production app=myapp

# Set expiration date
az keyvault secret set-attributes \
  --vault-name $VAULT_NAME \
  --name "db-connection-string" \
  --expires "2025-12-31T23:59:59Z" \
  --not-before "2025-01-01T00:00:00Z"

# List secret versions
az keyvault secret list-versions \
  --vault-name $VAULT_NAME \
  --name "db-connection-string"
```

**Secret rotation with Event Grid:**
```bicep
resource eventGridSubscription 'Microsoft.EventGrid/eventSubscriptions@2023-12-15-preview' = {
  name: 'secret-near-expiry'
  scope: keyVault
  properties: {
    destination: {
      endpointType: 'AzureFunction'
      properties: {
        resourceId: rotationFunctionId
      }
    }
    filter: {
      includedEventTypes: [
        'Microsoft.KeyVault.SecretNearExpiry'
        'Microsoft.KeyVault.SecretExpired'
      ]
    }
  }
}
```

**Secret rotation function pattern:**
```javascript
module.exports = async function (context, eventGridEvent) {
  const secretName = eventGridEvent.subject;
  const vaultName = eventGridEvent.data.VaultName;

  // 1. Generate new credential
  const newPassword = generateSecurePassword();

  // 2. Update the target service (e.g., database)
  await updateDatabasePassword(newPassword);

  // 3. Store new secret version in Key Vault
  const { SecretClient } = require('@azure/keyvault-secrets');
  const { DefaultAzureCredential } = require('@azure/identity');

  const client = new SecretClient(
    `https://${vaultName}.vault.azure.net`,
    new DefaultAzureCredential()
  );

  await client.setSecret(secretName, newPassword, {
    expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  });

  context.log(`Rotated secret: ${secretName}`);
};
```

### Step 6: Manage cryptographic keys

**Create and use keys:**
```bash
# Create RSA key
az keyvault key create \
  --vault-name $VAULT_NAME \
  --name "encryption-key" \
  --kty RSA \
  --size 2048 \
  --ops encrypt decrypt wrapKey unwrapKey

# Create EC key for signing
az keyvault key create \
  --vault-name $VAULT_NAME \
  --name "signing-key" \
  --kty EC \
  --curve P-256 \
  --ops sign verify

# Create HSM-backed key (Premium tier)
az keyvault key create \
  --vault-name $VAULT_NAME \
  --name "hsm-key" \
  --kty RSA-HSM \
  --size 4096 \
  --ops encrypt decrypt wrapKey unwrapKey sign verify
```

**Key operations in code:**
```javascript
const { CryptographyClient, KeyClient } = require('@azure/keyvault-keys');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const keyClient = new KeyClient(`https://${vaultName}.vault.azure.net`, credential);

// Get key reference
const key = await keyClient.getKey('encryption-key');

// Encrypt/decrypt
const cryptoClient = new CryptographyClient(key.id, credential);
const encryptResult = await cryptoClient.encrypt('RSA-OAEP', Buffer.from('plaintext'));
const decryptResult = await cryptoClient.decrypt('RSA-OAEP', encryptResult.result);

// Sign/verify
const signResult = await cryptoClient.sign('RS256', digest);
const verifyResult = await cryptoClient.verify('RS256', digest, signResult.result);

// Wrap/unwrap (envelope encryption)
const wrapResult = await cryptoClient.wrapKey('RSA-OAEP', dataEncryptionKey);
const unwrapResult = await cryptoClient.unwrapKey('RSA-OAEP', wrapResult.result);
```

### Step 7: Manage certificates

**Create self-signed certificate:**
```bash
az keyvault certificate create \
  --vault-name $VAULT_NAME \
  --name "app-cert" \
  --policy @cert-policy.json
```

**Certificate policy (cert-policy.json):**
```json
{
  "issuerParameters": {
    "name": "Self"
  },
  "keyProperties": {
    "exportable": true,
    "keySize": 2048,
    "keyType": "RSA",
    "reuseKey": false
  },
  "lifetimeActions": [
    {
      "action": { "actionType": "AutoRenew" },
      "trigger": { "daysBeforeExpiry": 30 }
    }
  ],
  "secretProperties": {
    "contentType": "application/x-pkcs12"
  },
  "x509CertificateProperties": {
    "subject": "CN=myapp.example.com",
    "subjectAlternativeNames": {
      "dnsNames": ["myapp.example.com", "*.myapp.example.com"]
    },
    "validityInMonths": 12,
    "keyUsage": ["digitalSignature", "keyEncipherment"]
  }
}
```

**CA-signed certificate (e.g., DigiCert):**
```bash
# First, configure the CA issuer
az keyvault certificate issuer create \
  --vault-name $VAULT_NAME \
  --issuer-name DigiCert \
  --provider-name DigiCert \
  --account-id $DIGICERT_ACCOUNT_ID \
  --password $DIGICERT_API_KEY

# Create certificate with CA issuer
az keyvault certificate create \
  --vault-name $VAULT_NAME \
  --name "public-cert" \
  --policy @ca-cert-policy.json
```

### Step 8: Integration patterns

**App Service / Functions - Key Vault references:**
```bicep
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'DbConnectionString'
          value: '@Microsoft.KeyVault(VaultName=${vaultName};SecretName=db-connection-string)'
        }
        {
          name: 'ApiKey'
          value: '@Microsoft.KeyVault(SecretUri=https://${vaultName}.vault.azure.net/secrets/api-key/)'
        }
      ]
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}
```

**Container Apps - Key Vault references:**
```bicep
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  properties: {
    configuration: {
      secrets: [
        {
          name: 'db-password'
          keyVaultUrl: 'https://${vaultName}.vault.azure.net/secrets/db-password'
          identity: managedIdentityResourceId
        }
      ]
    }
  }
}
```

**AKS - CSI Secret Store Driver:**
```yaml
# SecretProviderClass
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-secrets
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "<managed-identity-client-id>"
    keyvaultName: "<vault-name>"
    tenantId: "<tenant-id>"
    objects: |
      array:
        - |
          objectName: db-connection-string
          objectType: secret
        - |
          objectName: app-cert
          objectType: cert
        - |
          objectName: encryption-key
          objectType: key
  secretObjects:
    - secretName: app-secrets
      type: Opaque
      data:
        - objectName: db-connection-string
          key: connection-string
---
# Pod volume mount
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
    - name: myapp
      volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets"
          readOnly: true
      env:
        - name: DB_CONNECTION
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: connection-string
  volumes:
    - name: secrets-store
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: azure-keyvault-secrets
```

**Application code (direct SDK access):**
```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const client = new SecretClient(`https://${vaultName}.vault.azure.net`, credential);

// Get secret (with caching)
const secretCache = new Map();

async function getSecret(name) {
  if (secretCache.has(name)) {
    const cached = secretCache.get(name);
    if (Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.value;
    }
  }

  const secret = await client.getSecret(name);
  secretCache.set(name, { value: secret.value, timestamp: Date.now() });
  return secret.value;
}
```

### Step 9: Configure private endpoints

```bicep
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-04-01' = {
  name: '${vaultName}-pe'
  location: location
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [
      {
        name: '${vaultName}-plsc'
        properties: {
          privateLinkServiceId: keyVault.id
          groupIds: ['vault']
        }
      }
    ]
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
}
```

### Step 10: Backup and disaster recovery

```bash
# Backup a secret
az keyvault secret backup \
  --vault-name $VAULT_NAME \
  --name "db-connection-string" \
  --file secret-backup.blob

# Restore to another vault (same subscription and geography)
az keyvault secret restore \
  --vault-name $TARGET_VAULT \
  --file secret-backup.blob

# Backup a key
az keyvault key backup \
  --vault-name $VAULT_NAME \
  --name "encryption-key" \
  --file key-backup.blob

# Backup a certificate
az keyvault certificate backup \
  --vault-name $VAULT_NAME \
  --name "app-cert" \
  --file cert-backup.blob
```

### Step 11: Diagnostic logging

```bicep
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'kv-diagnostics'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'audit'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}
```

### Best practices

- **Use Azure RBAC**: over vault access policies for granular, scalable access control
- **Enable soft delete and purge protection**: mandatory for production (prevents permanent deletion)
- **Use managed identities**: for all Azure service access to Key Vault
- **Separate vaults per environment**: dev, staging, production should have separate vaults
- **Configure private endpoints**: disable public network access
- **Enable diagnostic logging**: audit all secret access and management operations
- **Set secret expiration dates**: trigger rotation before expiry
- **Use Key Vault references**: in App Service/Functions instead of copying secrets
- **Cache secrets in application memory**: reduce API calls and latency
- **Tag secrets with metadata**: for ownership, rotation schedule, and purpose

### Anti-patterns to avoid

- Using vault access policies when RBAC is available (harder to manage at scale)
- Giving Key Vault Administrator role to application identities (principle of least privilege)
- Not enabling purge protection (accidental or malicious deletion is permanent)
- Storing secrets in application configuration files instead of Key Vault
- Not setting expiration dates on secrets (they become stale and unmanaged)
- Reading secrets on every request without caching (adds latency and costs)
- Using a single vault for all environments (blast radius and access control issues)
- Not monitoring failed access attempts (potential security incident)
- Storing large blobs as secrets (Key Vault is not designed for bulk data)

### Security considerations

- Enable purge protection to prevent permanent deletion of vault contents
- Use HSM-backed keys (Premium tier) for regulatory requirements
- Enable diagnostic logging and route to Log Analytics or SIEM
- Configure Azure Monitor alerts for suspicious access patterns
- Use private endpoints and disable public network access
- Implement network ACLs as defense-in-depth
- Use Azure Policy to enforce Key Vault security standards across subscriptions
- Enable Microsoft Defender for Key Vault for threat detection
- Regular access reviews for RBAC role assignments
- Backup critical secrets and keys to a separate vault in paired region

### Cost optimization

- Use Standard tier unless HSM-backed keys are required
- Cache secrets in application memory to reduce transaction count
- Use Key Vault references (free) instead of direct API calls where possible
- Group related secrets in the same vault (pricing is per-vault + per-operation)
- Monitor transaction counts to identify unexpected usage patterns
- Remove unused secrets, keys, and certificates (purge after soft-delete period)
- Use certificate auto-renewal to avoid manual management costs
- Premium tier costs more per transaction; only use when HSM is required
