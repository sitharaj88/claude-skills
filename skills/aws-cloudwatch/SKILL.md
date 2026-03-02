---
name: aws-cloudwatch
description: Generate AWS CloudWatch configurations with dashboards, alarms, metrics, log groups, log insights queries, and composite alarms. Use when the user wants to set up monitoring and observability.
argument-hint: "[dashboards|alarms|logs] [service] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(aws *)
user-invocable: true
---

## Instructions

You are an AWS CloudWatch monitoring expert. Generate production-ready observability configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Monitoring targets**: Lambda, ECS, EC2, RDS, API Gateway, ALB, etc.
- **Alert channels**: SNS (email, Slack), PagerDuty, OpsGenie
- **Dashboard needs**: operational, executive, service-specific
- **Log analysis**: structured logging, query patterns

### Step 2: Generate CloudWatch Alarms

Create alarms for each service:

**Lambda:**
- Errors > 0 (5 min period)
- Duration > 80% of timeout
- Throttles > 0
- ConcurrentExecutions approaching limit
- Iterator age (for stream-based)

**ECS/Fargate:**
- CPUUtilization > 80%
- MemoryUtilization > 80%
- RunningTaskCount < desired
- Service DesiredCount != RunningCount

**RDS/Aurora:**
- CPUUtilization > 80%
- FreeableMemory < 500MB
- DatabaseConnections > 80% of max
- ReadLatency / WriteLatency > threshold
- FreeStorageSpace < 10GB
- ReplicaLag > threshold

**ALB:**
- HTTPCode_Target_5XX_Count > threshold
- TargetResponseTime > 2s (p99)
- UnHealthyHostCount > 0
- RejectedConnectionCount > 0

**API Gateway:**
- 5XXError > 0
- 4XXError rate > threshold
- Latency p99 > threshold
- Count (request rate)

**SQS:**
- ApproximateAgeOfOldestMessage > threshold
- ApproximateNumberOfMessagesVisible > threshold
- DLQ NumberOfMessagesSent > 0

### Step 3: Generate Composite Alarms

Combine related alarms:
```yaml
CompositeAlarm:
  AlarmRule: >
    ALARM("HighCPU") AND ALARM("HighMemory")
  AlarmActions: [critical-sns-topic]
```

### Step 4: Generate CloudWatch Dashboard

Create dashboard with widgets:
- Metric widgets (line, stacked area, number, gauge)
- Log widgets (query results)
- Text widgets (headers, descriptions)
- Alarm status widgets

Layout organized by:
- Service overview row
- Performance metrics row
- Error metrics row
- Business metrics row

### Step 5: Generate Log Insights Queries

Create useful queries:

**Error analysis:**
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as errorCount by bin(5m)
| sort errorCount desc
```

**Latency percentiles:**
```
filter @type = "REPORT"
| stats avg(@duration), pct(@duration, 50), pct(@duration, 95), pct(@duration, 99) by bin(5m)
```

**Top error messages:**
```
fields @message
| filter @message like /ERROR|Exception/
| stats count() by @message
| sort count desc
| limit 20
```

### Step 6: Generate Metric Filters and Custom Metrics

- Log metric filters for custom business metrics
- Embedded Metric Format for high-cardinality metrics
- Custom namespace for application metrics
- Anomaly detection models

### Best practices:
- Set alarms on symptoms (latency, errors), not causes (CPU)
- Use composite alarms to reduce alert fatigue
- Set appropriate evaluation periods (avoid flapping)
- Use Anomaly Detection for metrics with patterns
- Structure logs as JSON for better querying
- Set log retention periods (don't retain forever)
- Use Metric Math for derived metrics (error rate = errors/total)
- Use CloudWatch Contributor Insights for top-N analysis
