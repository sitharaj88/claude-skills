# AWS SQS & SNS

Generate SQS queues, SNS topics, dead-letter queues, fan-out patterns, and consumer/publisher application code.

## Usage

```bash
/aws-sqs-sns <description of your messaging requirements>
```

## What It Does

1. Creates SQS queue configurations (standard or FIFO) with appropriate settings
2. Generates SNS topics with subscription filters and delivery policies
3. Configures dead-letter queues with redrive policies for failed messages
4. Sets up fan-out patterns with SNS-to-SQS subscriptions
5. Produces publisher and consumer code with error handling and retry logic
6. Adds encryption, access policies, and CloudWatch alarms for queue depth

## Examples

```bash
/aws-sqs-sns Create an order processing queue with DLQ and Lambda consumer

/aws-sqs-sns Set up SNS fan-out to 3 SQS queues with message filtering by event type

/aws-sqs-sns Build a FIFO queue for exactly-once payment processing with deduplication
```

## Allowed Tools

- `Read` - Read existing messaging configurations and consumer code
- `Write` - Create queue/topic definitions, policies, and consumer code
- `Edit` - Modify existing SQS/SNS configurations
- `Bash` - Run AWS CLI commands for message testing
- `Glob` - Search for messaging-related files
- `Grep` - Find queue and topic ARN references
