# Azure Logic Apps

Generate workflow definitions, connector configurations, triggers, actions, error handling, and integration patterns following Azure Logic Apps best practices.

## Usage

```bash
/azure-logic-apps <description of your workflow or integration requirements>
```

## What It Does

1. Creates workflow definitions with triggers, actions, conditions, and control flow structures
2. Generates connector configurations for Office 365, Dynamics 365, Salesforce, and custom APIs
3. Produces error handling patterns with retry policies, scope actions, and run-after configurations
4. Configures Standard and Consumption tier workflows with appropriate hosting and scaling settings
5. Sets up integration account schemas, maps, and trading partner configurations for B2B scenarios
6. Implements expression-based data transformations, variable management, and inline code actions

## Examples

```bash
/azure-logic-apps Create an approval workflow that sends Teams notifications and updates SharePoint lists on approval

/azure-logic-apps Design an order processing pipeline with Service Bus trigger, Dynamics 365 lookup, and error handling

/azure-logic-apps Build a B2B integration workflow with AS2 message decoding, XML transformation, and partner routing
```

## What It Covers

- **Triggers** - Recurrence, HTTP, Service Bus, Event Grid, and connector-based trigger configurations
- **Actions** - HTTP calls, data operations, variable management, and inline JavaScript execution
- **Control flow** - Conditions, switch cases, for-each loops, until loops, and parallel branches
- **Connectors** - Office 365, SharePoint, Dynamics 365, SQL, Blob Storage, and custom API connectors
- **Error handling** - Retry policies, scope-based try-catch, run-after settings, and termination actions
- **Data transformation** - Liquid templates, XSLT maps, inline expressions, and JSON-to-XML conversion
- **Integration accounts** - Schemas, maps, trading partners, agreements, and B2B message processing
- **Managed identity** - Secure connector authentication with system and user-assigned identities

<div class="badge-row">
  <span class="badge">Workflows</span>
  <span class="badge">Integration</span>
  <span class="badge">Azure</span>
</div>

## Allowed Tools

- `Read` - Read existing workflow definitions and connector configurations
- `Write` - Create workflow JSON definitions, ARM templates, and connector setups
- `Edit` - Modify existing Logic Apps workflow actions and trigger configurations
- `Bash` - Run Azure CLI commands for Logic Apps deployment and management
- `Glob` - Search for workflow definition files and integration configurations
- `Grep` - Find connector references and workflow trigger patterns across the project
