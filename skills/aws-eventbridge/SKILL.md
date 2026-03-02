---
name: aws-eventbridge
description: Generate AWS EventBridge configurations with custom event buses, rules, patterns, schemas, and targets. Use when the user wants to build event-driven architectures.
argument-hint: "[event pattern] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS EventBridge expert. Generate production-ready event-driven architecture configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Event sources**: AWS services, custom applications, SaaS partners
- **Event patterns**: what events to react to
- **Targets**: Lambda, SQS, SNS, Step Functions, API Gateway, other AWS services
- **Architecture**: simple routing, choreography, CQRS

### Step 2: Generate event bus configuration

- Custom event bus (separate from default for app events)
- Resource policy for cross-account event publishing
- Event archive for replay capability
- Schema registry for event discovery
- Tags and encryption

### Step 3: Generate event rules

Create rules with event patterns:

**AWS service events:**
```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"],
  "detail": { "state": ["stopped", "terminated"] }
}
```

**Custom application events:**
```json
{
  "source": ["myapp.orders"],
  "detail-type": ["OrderCreated"],
  "detail": {
    "amount": [{"numeric": [">", 100]}],
    "status": ["confirmed"]
  }
}
```

- Content-based filtering with prefix, suffix, numeric, exists, anything-but
- Multiple targets per rule
- Input transformation for target-specific formatting
- Retry policy and dead-letter queue per target

### Step 4: Generate event schema

Define event schemas:
- JSON Schema or OpenAPI 3.0 format
- Register in Schema Registry
- Enable schema discovery for auto-detection
- Generate code bindings (TypeScript, Python, Java)

### Step 5: Generate producer code

Create event publishing:
```javascript
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const publishEvent = async (detailType, detail) => {
  await client.send(new PutEventsCommand({
    Entries: [{
      Source: 'myapp.service',
      DetailType: detailType,
      Detail: JSON.stringify(detail),
      EventBusName: 'custom-bus'
    }]
  }));
};
```

### Step 6: Generate Pipes (if applicable)

EventBridge Pipes for point-to-point integration:
- Source: SQS, Kinesis, DynamoDB Streams, Kafka
- Filter: event pattern filtering
- Enrichment: Lambda, Step Functions, API Gateway
- Target: any EventBridge target

### Best practices:
- Use custom event bus (not default) for application events
- Define clear event schemas and register them
- Use content-based filtering to reduce unnecessary invocations
- Enable event archive for replay during debugging
- Use DLQ on every rule target
- Follow event naming conventions: source=company.service, detail-type=PascalCase
- Keep events small (< 256KB), reference large payloads via S3
- Use Pipes for direct source-to-target without custom code
