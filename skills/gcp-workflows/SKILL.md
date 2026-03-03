---
name: gcp-workflows
description: Generate Workflows for orchestrating GCP services and APIs with error handling and parallel execution. Use when the user wants to orchestrate multi-step processes on Google Cloud.
argument-hint: "[pattern]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *)
user-invocable: true
---

## Instructions

You are a GCP Workflows expert. Generate production-ready workflow orchestrations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Pattern**: sequential, parallel, saga, retry, callback
- **Services to orchestrate**: Cloud Functions, Cloud Run, BigQuery, Firestore, Pub/Sub, etc.
- **Error handling**: retry strategies, compensation logic
- **Triggers**: Cloud Scheduler, Eventarc, Cloud Tasks, manual

### Step 2: Generate basic workflow definition

**Sequential workflow:**
```yaml
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: ${sys.get_env("GOOGLE_CLOUD_PROJECT_ID")}
          - region: "us-central1"
          - order_id: ${args.order_id}

    - validate_order:
        call: http.post
        args:
          url: ${"https://" + region + "-" + project_id + ".cloudfunctions.net/validate-order"}
          auth:
            type: OIDC
          body:
            order_id: ${order_id}
        result: validation_result

    - check_validation:
        switch:
          - condition: ${validation_result.body.valid == false}
            raise:
              code: 400
              message: ${"Order validation failed - " + validation_result.body.reason}

    - process_payment:
        call: http.post
        args:
          url: ${"https://payment-service-" + project_id + ".run.app/charge"}
          auth:
            type: OIDC
          body:
            order_id: ${order_id}
            amount: ${validation_result.body.total}
        result: payment_result

    - send_confirmation:
        call: googleapis.firestore.v1.projects.databases.documents.createDocument
        args:
          collectionId: "notifications"
          parent: ${"projects/" + project_id + "/databases/(default)/documents"}
          body:
            fields:
              order_id:
                stringValue: ${order_id}
              status:
                stringValue: "confirmed"
              payment_id:
                stringValue: ${payment_result.body.payment_id}

    - return_result:
        return:
          status: "success"
          order_id: ${order_id}
          payment_id: ${payment_result.body.payment_id}
```

### Step 3: Configure step types

**HTTP call (REST API):**
```yaml
- call_api:
    call: http.get
    args:
      url: "https://api.example.com/data"
      headers:
        Content-Type: "application/json"
        Authorization: ${"Bearer " + auth_token}
      query:
        page: 1
        limit: 100
      timeout: 30
    result: api_response
```

**GCP service connectors:**
```yaml
# Cloud Functions
- invoke_function:
    call: googleapis.cloudfunctions.v2.projects.locations.functions.generateDownloadUrl
    args:
      name: ${"projects/" + project_id + "/locations/" + region + "/functions/my-function"}

# BigQuery
- run_query:
    call: googleapis.bigquery.v2.jobs.query
    args:
      projectId: ${project_id}
      body:
        query: "SELECT COUNT(*) as total FROM `dataset.table` WHERE date = CURRENT_DATE()"
        useLegacySql: false
    result: query_result

# Cloud Run
- call_cloud_run:
    call: http.post
    args:
      url: ${"https://my-service-" + project_id + ".run.app/process"}
      auth:
        type: OIDC
      body:
        data: ${input_data}
    result: run_result

# Pub/Sub
- publish_message:
    call: googleapis.pubsub.v1.projects.topics.publish
    args:
      topic: ${"projects/" + project_id + "/topics/my-topic"}
      body:
        messages:
          - data: ${base64.encode(json.encode(message_payload))}
            attributes:
              source: "workflow"
              type: "order_processed"

# Firestore
- read_document:
    call: googleapis.firestore.v1.projects.databases.documents.get
    args:
      name: ${"projects/" + project_id + "/databases/(default)/documents/users/" + user_id}
    result: user_doc

# Cloud Tasks
- create_task:
    call: googleapis.cloudtasks.v2.projects.locations.queues.tasks.create
    args:
      parent: ${"projects/" + project_id + "/locations/" + region + "/queues/my-queue"}
      body:
        httpRequest:
          url: "https://my-service.run.app/process"
          httpMethod: "POST"
          body: ${base64.encode(json.encode(task_payload))}
          oidcToken:
            serviceAccountEmail: ${"workflow-sa@" + project_id + ".iam.gserviceaccount.com"}
        scheduleTime: ${time.format(sys.now() + 3600)}

# Secret Manager
- get_secret:
    call: googleapis.secretmanager.v1.projects.secrets.versions.accessString
    args:
      secret_id: "api-key"
      project_id: ${project_id}
    result: api_key

# Cloud Storage
- upload_to_gcs:
    call: http.post
    args:
      url: ${"https://storage.googleapis.com/upload/storage/v1/b/my-bucket/o?uploadType=media&name=results/" + execution_id + ".json"}
      auth:
        type: OAuth2
      headers:
        Content-Type: "application/json"
      body: ${results}
```

### Step 4: Configure control flow

**Switch (conditional branching):**
```yaml
- evaluate_status:
    switch:
      - condition: ${order.status == "pending"}
        steps:
          - process_pending:
              call: process_pending_order
              args:
                order: ${order}
              result: process_result
      - condition: ${order.status == "paid"}
        steps:
          - fulfill_order:
              call: fulfill_paid_order
              args:
                order: ${order}
              result: process_result
      - condition: ${order.status == "cancelled"}
        steps:
          - handle_cancellation:
              call: handle_cancelled_order
              args:
                order: ${order}
              result: process_result
    next: send_notification
```

**For loop (iteration):**
```yaml
- process_items:
    for:
      value: item
      index: i
      in: ${order.items}
      steps:
        - process_item:
            call: http.post
            args:
              url: ${"https://inventory-service.run.app/reserve"}
              auth:
                type: OIDC
              body:
                item_id: ${item.id}
                quantity: ${item.quantity}
            result: reservation

        - log_progress:
            call: sys.log
            args:
              text: ${"Processed item " + string(i + 1) + " of " + string(len(order.items))}
              severity: "INFO"
```

**Parallel execution:**
```yaml
- parallel_tasks:
    parallel:
      shared: [results]
      branches:
        - fetch_user:
            steps:
              - get_user:
                  call: http.get
                  args:
                    url: ${"https://user-service.run.app/users/" + user_id}
                    auth:
                      type: OIDC
                  result: user_data
              - save_user:
                  assign:
                    - results.user: ${user_data.body}

        - fetch_orders:
            steps:
              - get_orders:
                  call: http.get
                  args:
                    url: ${"https://order-service.run.app/orders?user_id=" + user_id}
                    auth:
                      type: OIDC
                  result: orders_data
              - save_orders:
                  assign:
                    - results.orders: ${orders_data.body}

        - fetch_preferences:
            steps:
              - get_preferences:
                  call: googleapis.firestore.v1.projects.databases.documents.get
                  args:
                    name: ${"projects/" + project_id + "/databases/(default)/documents/preferences/" + user_id}
                  result: prefs_data
              - save_preferences:
                  assign:
                    - results.preferences: ${prefs_data}

- use_results:
    return:
      user: ${results.user}
      orders: ${results.orders}
      preferences: ${results.preferences}
```

**Parallel for loop:**
```yaml
- process_all_items:
    parallel:
      for:
        value: item
        in: ${items}
        steps:
          - process:
              call: http.post
              args:
                url: "https://processor.run.app/process"
                auth:
                  type: OIDC
                body:
                  item: ${item}
```

### Step 5: Configure error handling and retries

**Try/except with retry:**
```yaml
- call_external_api:
    try:
      steps:
        - make_request:
            call: http.post
            args:
              url: "https://api.example.com/submit"
              body: ${payload}
              timeout: 30
            result: api_response
    retry:
      predicate: ${default_retry_predicate}
      max_retries: 5
      backoff:
        initial_delay: 1
        max_delay: 60
        multiplier: 2
    except:
      as: e
      steps:
        - log_error:
            call: sys.log
            args:
              text: ${"API call failed - " + json.encode_to_string(e)}
              severity: "ERROR"
        - handle_failure:
            assign:
              - api_response:
                  body:
                    status: "failed"
                    error: ${e.message}
```

**Custom retry predicate:**
```yaml
- call_with_custom_retry:
    try:
      steps:
        - api_call:
            call: http.get
            args:
              url: "https://api.example.com/data"
            result: response
    retry:
      predicate: ${custom_retry_predicate}
      max_retries: 3
      backoff:
        initial_delay: 2
        max_delay: 30
        multiplier: 2

custom_retry_predicate:
  params: [e]
  steps:
    - check_code:
        switch:
          - condition: ${e.code == 429}  # Too Many Requests
            return: true
          - condition: ${e.code == 503}  # Service Unavailable
            return: true
          - condition: ${e.code >= 500}  # Server errors
            return: true
        next: return_false
    - return_false:
        return: false
```

**Nested try/except for compensation (saga pattern):**
```yaml
- saga_transaction:
    try:
      steps:
        - reserve_inventory:
            call: http.post
            args:
              url: "https://inventory.run.app/reserve"
              auth:
                type: OIDC
              body:
                items: ${order.items}
            result: reservation

        - charge_payment:
            try:
              steps:
                - process_charge:
                    call: http.post
                    args:
                      url: "https://payment.run.app/charge"
                      auth:
                        type: OIDC
                      body:
                        amount: ${order.total}
                    result: payment
            except:
              as: payment_error
              steps:
                - compensate_inventory:
                    call: http.post
                    args:
                      url: "https://inventory.run.app/release"
                      auth:
                        type: OIDC
                      body:
                        reservation_id: ${reservation.body.id}
                - raise_payment_error:
                    raise: ${payment_error}

        - ship_order:
            try:
              steps:
                - create_shipment:
                    call: http.post
                    args:
                      url: "https://shipping.run.app/ship"
                      auth:
                        type: OIDC
                      body:
                        order_id: ${order.id}
                    result: shipment
            except:
              as: shipping_error
              steps:
                - compensate_payment:
                    call: http.post
                    args:
                      url: "https://payment.run.app/refund"
                      auth:
                        type: OIDC
                      body:
                        payment_id: ${payment.body.id}
                - compensate_inventory_again:
                    call: http.post
                    args:
                      url: "https://inventory.run.app/release"
                      auth:
                        type: OIDC
                      body:
                        reservation_id: ${reservation.body.id}
                - raise_shipping_error:
                    raise: ${shipping_error}
    except:
      as: e
      steps:
        - log_saga_failure:
            call: sys.log
            args:
              text: ${"Saga failed - " + json.encode_to_string(e)}
              severity: "ERROR"
        - return_failure:
            return:
              status: "failed"
              error: ${e.message}
```

### Step 6: Configure subworkflows

```yaml
main:
  params: [args]
  steps:
    - process:
        call: process_order
        args:
          order_id: ${args.order_id}
          project_id: ${sys.get_env("GOOGLE_CLOUD_PROJECT_ID")}
        result: order_result
    - notify:
        call: send_notification
        args:
          channel: "email"
          recipient: ${order_result.customer_email}
          message: ${"Order " + args.order_id + " has been processed."}
    - done:
        return: ${order_result}

process_order:
  params: [order_id, project_id]
  steps:
    - fetch:
        call: googleapis.firestore.v1.projects.databases.documents.get
        args:
          name: ${"projects/" + project_id + "/databases/(default)/documents/orders/" + order_id}
        result: order_doc
    - process:
        call: http.post
        args:
          url: "https://processor.run.app/process"
          auth:
            type: OIDC
          body:
            order: ${order_doc}
        result: processed
    - return_result:
        return:
          order_id: ${order_id}
          status: ${processed.body.status}
          customer_email: ${order_doc.fields.email.stringValue}

send_notification:
  params: [channel, recipient, message]
  steps:
    - send:
        switch:
          - condition: ${channel == "email"}
            steps:
              - send_email:
                  call: http.post
                  args:
                    url: "https://notification.run.app/email"
                    auth:
                      type: OIDC
                    body:
                      to: ${recipient}
                      body: ${message}
          - condition: ${channel == "slack"}
            steps:
              - send_slack:
                  call: http.post
                  args:
                    url: "https://hooks.slack.com/services/xxx"
                    body:
                      text: ${message}
```

### Step 7: Configure expressions and variables

**Built-in functions:**
```yaml
- expressions_demo:
    assign:
      # String operations
      - upper_name: ${text.to_upper(name)}
      - contains_check: ${text.find_all(input, "error")}
      - url_encoded: ${text.url_encode(query_param)}

      # JSON operations
      - json_string: ${json.encode_to_string(object)}
      - parsed_json: ${json.decode(json_string)}

      # Math operations
      - abs_value: ${math.abs(number)}
      - max_value: ${math.max(a, b)}

      # Time operations
      - current_time: ${sys.now()}
      - formatted_time: ${time.format(sys.now())}

      # Base64
      - encoded: ${base64.encode(text.encode(data))}
      - decoded: ${text.decode(base64.decode(encoded_data))}

      # Map/list operations
      - keys_list: ${keys(my_map)}
      - list_length: ${len(my_list)}
      - has_key: ${"key" in my_map}
```

### Step 8: Configure callbacks (human-in-the-loop)

```yaml
main:
  steps:
    - create_callback:
        call: events.create_callback_endpoint
        args:
          http_callback_method: "POST"
        result: callback_details

    - notify_approver:
        call: http.post
        args:
          url: "https://notification.run.app/approval"
          auth:
            type: OIDC
          body:
            message: "Please approve order processing"
            callback_url: ${callback_details.url}
            execution_id: ${sys.get_env("GOOGLE_CLOUD_WORKFLOW_EXECUTION_ID")}

    - wait_for_approval:
        call: events.await_callback
        args:
          callback: ${callback_details}
          timeout: 86400  # 24 hours
        result: approval_response

    - check_approval:
        switch:
          - condition: ${approval_response.http_request.body.approved == true}
            next: process_order
          - condition: true
            next: reject_order

    - process_order:
        call: sys.log
        args:
          text: "Order approved, processing..."
          severity: "INFO"
        next: done

    - reject_order:
        call: sys.log
        args:
          text: "Order rejected"
          severity: "WARNING"
        next: done

    - done:
        return: ${approval_response.http_request.body}
```

### Step 9: Configure long-running operations

```yaml
- start_long_operation:
    call: googleapis.bigquery.v2.jobs.insert
    args:
      projectId: ${project_id}
      body:
        configuration:
          query:
            query: "SELECT * FROM `project.dataset.large_table`"
            destinationTable:
              projectId: ${project_id}
              datasetId: "results"
              tableId: "output"
            useLegacySql: false
    result: job

- poll_job_completion:
    call: googleapis.bigquery.v2.jobs.get
    args:
      projectId: ${project_id}
      jobId: ${job.jobReference.jobId}
    result: job_status

- check_status:
    switch:
      - condition: ${job_status.status.state == "DONE"}
        next: job_complete
      - condition: true
        next: wait_and_retry

- wait_and_retry:
    call: sys.sleep
    args:
      seconds: 10
    next: poll_job_completion

- job_complete:
    switch:
      - condition: ${"errorResult" in job_status.status}
        raise:
          code: 500
          message: ${job_status.status.errorResult.message}
    next: return_results

- return_results:
    return:
      job_id: ${job.jobReference.jobId}
      status: "completed"
```

### Step 10: Configure triggers and scheduling

**Cloud Scheduler trigger:**
```bash
# Deploy workflow
gcloud workflows deploy my-workflow \
  --source=workflow.yaml \
  --location=us-central1 \
  --service-account=workflow-sa@$PROJECT_ID.iam.gserviceaccount.com

# Create scheduled trigger
gcloud scheduler jobs create http daily-workflow \
  --schedule="0 8 * * *" \
  --uri="https://workflowexecutions.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/workflows/my-workflow/executions" \
  --message-body='{"argument": "{\"mode\": \"daily\"}"}' \
  --oauth-service-account-email="scheduler-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --location=us-central1
```

**Eventarc trigger:**
```bash
# Trigger workflow on Cloud Storage upload
gcloud eventarc triggers create storage-workflow-trigger \
  --location=us-central1 \
  --destination-workflow=my-workflow \
  --destination-workflow-location=us-central1 \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=my-bucket" \
  --service-account=eventarc-sa@$PROJECT_ID.iam.gserviceaccount.com

# Trigger workflow on Pub/Sub message
gcloud eventarc triggers create pubsub-workflow-trigger \
  --location=us-central1 \
  --destination-workflow=my-workflow \
  --destination-workflow-location=us-central1 \
  --transport-topic=projects/$PROJECT_ID/topics/my-topic \
  --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" \
  --service-account=eventarc-sa@$PROJECT_ID.iam.gserviceaccount.com
```

**Cloud Tasks trigger:**
```bash
# Execute workflow from Cloud Tasks
gcloud tasks create-http-task \
  --queue=workflow-queue \
  --url="https://workflowexecutions.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/workflows/my-workflow/executions" \
  --method=POST \
  --body-content='{"argument": "{\"task_id\": \"123\"}"}' \
  --oauth-service-account-email="tasks-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --schedule-time="2024-01-15T10:00:00Z"
```

### Step 11: Logging and monitoring

```yaml
# Structured logging within workflow
- log_info:
    call: sys.log
    args:
      json:
        message: "Processing order"
        order_id: ${order_id}
        step: "validation"
        severity: "INFO"
      severity: "INFO"

- log_error:
    call: sys.log
    args:
      json:
        message: "Processing failed"
        order_id: ${order_id}
        error: ${error_details}
      severity: "ERROR"
```

**Monitoring alerts for workflows:**
```hcl
resource "google_monitoring_alert_policy" "workflow_failures" {
  display_name = "Workflow Execution Failures"
  combiner     = "OR"

  conditions {
    display_name = "Failed executions > 0"
    condition_threshold {
      filter          = "resource.type = \"workflows.googleapis.com/Workflow\" AND metric.type = \"workflows.googleapis.com/finished_execution_count\" AND metric.labels.status = \"FAILED\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.name]
}
```

### Step 12: Comparison with Cloud Composer (Airflow)

| Feature | Workflows | Cloud Composer (Airflow) |
|---------|-----------|--------------------------|
| Pricing | Per execution + steps | Persistent environment |
| Scale to zero | Yes | No (always-on) |
| Language | YAML | Python |
| Best for | Event-driven, serverless orchestration | Complex data pipelines, scheduling |
| Max duration | 1 year | Unlimited |
| Complexity | Simple to moderate | Complex DAGs |
| Startup time | Milliseconds | N/A (always running) |
| State management | Built-in | External (XCom, variables) |

**Use Workflows when**: serverless, event-driven, API orchestration, simple to moderate complexity, cost-sensitive.

**Use Cloud Composer when**: complex data pipelines, extensive library ecosystem, need Airflow operators, require Python-based logic.

## Best Practices

- Use subworkflows to organize reusable logic and keep main workflow readable
- Always implement retry with exponential backoff for HTTP calls
- Use the saga pattern for distributed transactions with compensation logic
- Use parallel branches to reduce total execution time
- Use OIDC authentication for calling Cloud Run and Cloud Functions
- Log structured JSON for better queryability in Cloud Logging
- Use Secret Manager connector to access secrets instead of hardcoding
- Keep workflow definitions under 128 KB (the size limit)

## Anti-Patterns

- Do not use Workflows for sub-second latency requirements; use direct service calls
- Do not poll frequently for long-running operations; use appropriate sleep intervals
- Do not hardcode URLs; use expressions with project ID and region
- Do not ignore error handling; unhandled errors cause workflow failures
- Do not use Workflows for complex data transformations; offload to Cloud Functions or BigQuery
- Do not create deeply nested try/except blocks; use subworkflows for clarity

## Security Considerations

- Use dedicated service accounts with least-privilege IAM for workflow execution
- Use OIDC token authentication for all internal service calls
- Access secrets through the Secret Manager connector, not environment variables
- Enable audit logging for workflow executions
- Restrict who can deploy and execute workflows with IAM roles
- Validate callback URLs to prevent SSRF attacks

## Cost Optimization

- Workflows charge per step execution and per external API call
- Minimize the number of steps by combining related assignments
- Use parallel execution to reduce total execution time (not cost, but efficiency)
- Use sys.sleep judiciously; sleeping steps still count toward execution time
- Use Workflows instead of Cloud Composer for simple orchestration to avoid persistent environment costs
- Monitor step counts with Cloud Monitoring to identify optimization opportunities
