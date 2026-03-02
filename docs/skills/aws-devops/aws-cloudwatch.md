# AWS CloudWatch

Generate CloudWatch dashboards, alarms, custom metrics, log groups, and Log Insights queries for comprehensive observability.

## Usage

```bash
/aws-cloudwatch <description of your monitoring requirements>
```

## What It Does

1. Creates CloudWatch dashboard definitions with widgets for key metrics
2. Generates metric alarms with appropriate thresholds and actions
3. Configures log groups with retention policies and metric filters
4. Produces CloudWatch Log Insights queries for log analysis
5. Sets up custom metrics and embedded metric format for application monitoring
6. Adds composite alarms, anomaly detection, and SNS notification integration

## Examples

```bash
/aws-cloudwatch Create a dashboard for an ECS service with CPU, memory, and request metrics

/aws-cloudwatch Set up alarms for Lambda errors, duration, and throttles with SNS alerting

/aws-cloudwatch Write Log Insights queries to analyze API Gateway latency percentiles
```

## Allowed Tools

- `Read` - Read existing monitoring configurations and dashboards
- `Write` - Create dashboard definitions, alarm configs, and query files
- `Edit` - Modify existing CloudWatch configurations
- `Bash` - Run AWS CLI CloudWatch commands for metric inspection
- `Glob` - Search for monitoring-related template files
- `Grep` - Find metric and alarm references across the project
