# Azure RBAC

Generate role assignments, custom role definitions, scope hierarchies, deny assignments, and least-privilege access patterns following Azure RBAC best practices.

## Usage

```bash
/azure-rbac <description of the access control requirements>
```

## What It Does

1. Analyzes required Azure resource access and generates least-privilege role assignments
2. Creates custom role definitions with granular action and data action permissions
3. Generates role assignment configurations scoped to management groups, subscriptions, and resource groups
4. Configures deny assignments and Azure Policy integration for compliance enforcement
5. Produces Privileged Identity Management (PIM) eligible assignments with approval workflows
6. Implements condition-based role assignments using Azure ABAC for fine-grained access control

## Examples

```bash
/azure-rbac Create a custom role with read-only access to Storage blobs and Key Vault secrets for an auditing team

/azure-rbac Design a PIM-eligible assignment strategy for subscription-level Contributor access with approval workflows

/azure-rbac Generate ABAC conditions restricting blob access based on container name and index tags
```

## What It Covers

- **Built-in roles** - Owner, Contributor, Reader, and service-specific roles with scope selection
- **Custom roles** - Granular actions, data actions, not-actions, and assignable scope definitions
- **Role assignments** - User, group, service principal, and managed identity principal bindings
- **Scope hierarchy** - Management group, subscription, resource group, and resource-level scoping
- **PIM** - Eligible assignments, activation requirements, approval workflows, and time-bound access
- **ABAC conditions** - Attribute-based conditions on role assignments for storage and Key Vault
- **Deny assignments** - Explicit deny rules preventing specific actions regardless of role grants
- **Azure Policy** - Policy-driven RBAC enforcement, allowed role definitions, and compliance auditing

<div class="badge-row">
  <span class="badge">Security</span>
  <span class="badge">Policies</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing role definitions, assignments, and access control configurations
- `Write` - Create custom role definitions, role assignment templates, and PIM configurations
- `Edit` - Modify existing RBAC configurations and policy assignments
- `Bash` - Run Azure CLI commands for role assignment management and access validation
- `Glob` - Search for RBAC-related Bicep, ARM, and Terraform configuration files
- `Grep` - Find role definition references and principal assignments across the project
