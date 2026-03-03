# Azure Blob Storage

Generate Azure Blob Storage account configurations with access tiers, lifecycle management policies, replication strategies, SAS tokens, and CDN integration.

## Usage

```bash
/azure-blob-storage <description of your storage requirements>
```

## What It Does

1. Creates storage account configurations with Hot, Cool, Cold, and Archive access tiers
2. Generates lifecycle management policies for automatic tiering and blob expiration
3. Configures replication strategies including LRS, ZRS, GRS, and RA-GRS
4. Sets up shared access signatures (SAS) with scoped permissions and expiration policies
5. Produces private endpoint and firewall rules for secure network access
6. Adds immutability policies, soft delete, versioning, and Azure CDN integration

## Examples

```bash
/azure-blob-storage Create a storage account with ZRS replication, lifecycle rules to move blobs to Cool after 30 days, and private endpoint access

/azure-blob-storage Set up blob containers with immutability policies, soft delete retention of 14 days, and versioning enabled

/azure-blob-storage Configure a storage account with RA-GRS replication, CDN integration, and SAS token generation for client uploads
```

## What It Covers

- **Access tiers** - Hot, Cool, Cold, and Archive tiers with automatic tiering policies
- **Lifecycle management** - Rule-based transitions, blob expiration, and snapshot cleanup
- **Replication** - LRS, ZRS, GRS, RA-GRS, and GZRS redundancy configurations
- **SAS tokens** - Account-level and service-level shared access signatures with scoped permissions
- **Network security** - Private endpoints, service endpoints, and IP firewall rules
- **Data protection** - Soft delete, versioning, immutability policies, and legal holds
- **Static website hosting** - Index and error document configs with custom domain mapping
- **Azure CDN** - Content delivery integration with caching rules and HTTPS enforcement
- **Diagnostics** - Storage Analytics logging, metrics, and Azure Monitor integration

<div class="badge-row">
  <span class="badge">Storage</span>
  <span class="badge">CDN</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing storage account templates and access policies
- `Write` - Create storage configurations, lifecycle rules, and ARM/Bicep templates
- `Edit` - Modify existing storage account and container configurations
- `Bash` - Run az storage commands for validation and resource queries
- `Glob` - Search for storage-related configuration and template files
- `Grep` - Find storage account references and connection string usage
