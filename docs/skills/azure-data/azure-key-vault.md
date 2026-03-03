# Azure Key Vault

Generate Azure Key Vault configurations with secrets management, cryptographic key operations, certificate lifecycle automation, RBAC policies, and application integration patterns.

## Usage

```bash
/azure-key-vault <description of your secrets and key management requirements>
```

## What It Does

1. Creates Key Vault configurations with Standard and Premium (HSM-backed) pricing tiers
2. Generates secrets management workflows with versioning, expiration, and rotation policies
3. Configures cryptographic key operations for encryption, signing, and wrapping with RSA and EC keys
4. Sets up certificate lifecycle automation with auto-renewal and CA integration
5. Produces RBAC role assignments and access policies for fine-grained permission control
6. Adds application integration patterns with managed identity, SDK helpers, and Key Vault references

## Examples

```bash
/azure-key-vault Create a Premium tier Key Vault with HSM-backed keys, secret rotation policy, and managed identity access for App Service

/azure-key-vault Set up certificate management with auto-renewal from DigiCert CA, expiration alerts, and Key Vault references in App Configuration

/azure-key-vault Configure a Key Vault with RBAC authorization, private endpoint, soft delete, and purge protection enabled
```

## What It Covers

- **Pricing tiers** - Standard (software-protected) and Premium (HSM-backed) key vault configurations
- **Secrets management** - Secret versioning, expiration dates, content types, and automated rotation
- **Key operations** - RSA and EC key creation, encryption, decryption, signing, and key wrapping
- **Certificates** - Certificate lifecycle, auto-renewal, CA integration, and PFX/PEM import/export
- **Access control** - RBAC authorization model, access policies, and managed identity assignments
- **Network security** - Private endpoints, service endpoints, firewall rules, and trusted services
- **Application integration** - Key Vault references in App Service, App Configuration, and Kubernetes
- **Data protection** - Soft delete, purge protection, and backup/restore procedures
- **Monitoring** - Diagnostic logging, Azure Monitor alerts, and access audit trails

<div class="badge-row">
  <span class="badge">Secrets</span>
  <span class="badge">Encryption</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing Key Vault configurations and access policy definitions
- `Write` - Create vault templates, rotation policies, and ARM/Bicep templates
- `Edit` - Modify existing Key Vault settings and access control configurations
- `Bash` - Run az keyvault commands for validation and secret management
- `Glob` - Search for Key Vault-related configuration and template files
- `Grep` - Find Key Vault references and secret usage across the project
