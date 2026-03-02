# AWS EventBridge

Generate event buses, rules, event patterns, schemas, and EventBridge Pipes for event-driven architectures.

## Usage

```bash
/aws-eventbridge <description of your event-driven architecture>
```

## What It Does

1. Creates custom event buses with resource policies for cross-account access
2. Generates event rules with pattern matching for precise event filtering
3. Configures targets (Lambda, SQS, Step Functions, API destinations)
4. Sets up EventBridge Pipes for point-to-point integrations with filtering and enrichment
5. Produces event schema definitions and discovery configurations
6. Adds dead-letter queues, retry policies, and archive/replay settings

## Examples

```bash
/aws-eventbridge Create an event bus with rules routing order events to different Lambda functions

/aws-eventbridge Set up EventBridge Pipes from DynamoDB Streams to Step Functions with filtering

/aws-eventbridge Build a cross-account event routing pattern with schema registry
```

## Allowed Tools

- `Read` - Read existing event configurations and handler code
- `Write` - Create event bus templates, rules, and schema definitions
- `Edit` - Modify existing EventBridge configurations
- `Bash` - Run AWS CLI commands for event testing
- `Glob` - Search for event-related files
- `Grep` - Find event pattern and bus references
