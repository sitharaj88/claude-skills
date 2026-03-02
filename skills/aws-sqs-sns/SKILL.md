---
name: aws-sqs-sns
description: Generate AWS SQS queues and SNS topics with dead-letter queues, message filtering, FIFO ordering, and fan-out patterns. Use when the user wants to set up messaging or event-driven architectures.
argument-hint: "[sqs|sns|both] [purpose]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS SQS/SNS messaging expert. Generate production-ready messaging configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: point-to-point (SQS), pub/sub (SNS), fan-out (SNS → SQS)
- **Ordering**: standard (best-effort) or FIFO (strict ordering)
- **Volume**: messages per second, message size
- **Processing**: Lambda, ECS, EC2 consumer

### Step 2: Generate SQS queue configuration

Create SQS queue with:
- Queue type: Standard (unlimited throughput) or FIFO (300 TPS, exactly-once)
- Visibility timeout (6x Lambda timeout or consumer processing time)
- Message retention period (1 minute to 14 days)
- Maximum message size (up to 256KB, use S3 for larger)
- Receive message wait time (20s for long polling)
- Dead-letter queue with maxReceiveCount (3-5)
- Redrive allow policy
- Server-side encryption (SSE-SQS or SSE-KMS)
- Queue policy for cross-account or SNS access
- FIFO-specific: content-based deduplication, message group ID strategy

### Step 3: Generate SNS topic configuration

Create SNS topic with:
- Topic type: Standard or FIFO
- Display name
- KMS encryption
- Access policy
- Delivery retry policy
- Subscriptions: SQS, Lambda, HTTP/S, email, SMS, Kinesis Firehose
- Message filtering policies (attribute-based routing)
- Dead-letter queue for failed deliveries

### Step 4: Generate fan-out pattern (SNS → SQS)

If both services are needed:
- SNS topic as event publisher
- Multiple SQS queues as subscribers
- Filter policies on each subscription
- Raw message delivery for SQS subscribers
- Each consumer processes independently
- DLQ on each SQS queue

### Step 5: Generate consumer code

Create consumer implementation:
- **Lambda trigger**: event source mapping with batch size, concurrency
- **Long polling consumer**: SQS ReceiveMessage with WaitTimeSeconds=20
- **Batch processing**: batch size, partial batch response
- Delete messages after successful processing
- Error handling and retry logic
- Idempotent processing (handle duplicate delivery)

### Step 6: Monitoring

- CloudWatch alarms:
  - ApproximateNumberOfMessagesVisible (queue depth)
  - ApproximateAgeOfOldestMessage (processing lag)
  - NumberOfMessagesSent/Received
  - DLQ message count (> 0 alert)
- SQS queue depth-based Auto Scaling for consumers

### Best practices:
- Use long polling (WaitTimeSeconds=20) to reduce empty responses
- Always configure a dead-letter queue
- Set visibility timeout = 6x consumer processing time
- Use FIFO only when ordering is required (lower throughput)
- Use SNS message filtering to avoid unnecessary processing
- Make consumers idempotent (at-least-once delivery)
- Use batch operations to reduce API calls
- Monitor DLQ — messages there mean processing failures
