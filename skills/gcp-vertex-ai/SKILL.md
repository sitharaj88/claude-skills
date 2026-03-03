---
name: gcp-vertex-ai
description: Generate Vertex AI pipelines, model deployments, and ML workflows. Use when the user wants to build AI/ML applications on Google Cloud.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(pip *), Bash(python *)
user-invocable: true
---

## Instructions

You are a GCP Vertex AI expert. Generate production-ready AI/ML configurations and workflows.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: training, prediction, pipeline, agent, search
- **Model type**: custom training, AutoML, pre-trained (Model Garden)
- **Use case**: text generation, classification, embeddings, vision, RAG, agents
- **Scale**: expected prediction volume and latency requirements

### Step 2: Configure Vertex AI SDK

**Install and initialize:**
```bash
pip install google-cloud-aiplatform google-cloud-bigquery
```

**SDK initialization:**
```python
from google.cloud import aiplatform

aiplatform.init(
    project="my-project",
    location="us-central1",
    staging_bucket="gs://my-project-vertex-staging",
    experiment="my-experiment",
)
```

### Step 3: Gemini API integration

**Basic text generation:**
```python
import vertexai
from vertexai.generative_models import GenerativeModel, Part, SafetySetting

vertexai.init(project="my-project", location="us-central1")

model = GenerativeModel(
    model_name="gemini-1.5-pro-002",
    system_instruction="You are a helpful customer support agent.",
    generation_config={
        "max_output_tokens": 2048,
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
    },
    safety_settings=[
        SafetySetting(
            category=SafetySetting.HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        ),
    ],
)

response = model.generate_content("How can I return an item?")
print(response.text)
```

**Multi-turn conversation:**
```python
chat = model.start_chat(history=[])

response = chat.send_message("What is your return policy?")
print(response.text)

response = chat.send_message("How long does a refund take?")
print(response.text)
```

**Multimodal (image + text):**
```python
from vertexai.generative_models import Image

image = Part.from_uri(
    "gs://my-bucket/product-image.jpg",
    mime_type="image/jpeg",
)

response = model.generate_content([
    "Describe this product and suggest a price range.",
    image,
])
```

**Streaming responses:**
```python
responses = model.generate_content(
    "Write a detailed product description.",
    stream=True,
)

for response in responses:
    print(response.text, end="")
```

**Function calling (tool use):**
```python
from vertexai.generative_models import FunctionDeclaration, Tool

get_weather = FunctionDeclaration(
    name="get_weather",
    description="Get the current weather for a location",
    parameters={
        "type": "object",
        "properties": {
            "location": {"type": "string", "description": "City name"},
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
        },
        "required": ["location"],
    },
)

weather_tool = Tool(function_declarations=[get_weather])

model = GenerativeModel(
    model_name="gemini-1.5-pro-002",
    tools=[weather_tool],
)

response = model.generate_content("What's the weather in San Francisco?")
function_call = response.candidates[0].function_calls[0]
print(f"Function: {function_call.name}, Args: {function_call.args}")
```

### Step 4: Model Garden (pre-trained models)

**Available models:**
| Model | Use Case | Model ID |
|-------|----------|----------|
| Gemini 1.5 Pro | Complex reasoning, long context | gemini-1.5-pro-002 |
| Gemini 1.5 Flash | Fast responses, cost-effective | gemini-1.5-flash-002 |
| Gemini 2.0 Flash | Latest generation, multimodal | gemini-2.0-flash |
| Llama 3.1 | Open-source text generation | meta/llama-3.1-405b |
| Mistral Large | European AI, multilingual | mistralai/mistral-large |
| Claude 3.5 Sonnet | Complex tasks, coding | anthropic/claude-3-5-sonnet |
| Imagen 3 | Image generation | imagen-3.0-generate-002 |
| Text Embedding | Embeddings | text-embedding-005 |

**Deploy open model from Model Garden:**
```python
from vertexai.preview.language_models import TextGenerationModel

# Deploy Llama via Model Garden
endpoint = aiplatform.Model.upload(
    display_name="llama-3-1-8b",
    serving_container_image_uri="us-docker.pkg.dev/vertex-ai/vertex-vision-model-garden-dockers/pytorch-vllm-serve:latest",
    serving_container_args=[
        "--model-id=meta-llama/Meta-Llama-3.1-8B-Instruct",
        "--tensor-parallel-size=1",
    ],
    serving_container_ports=[7080],
).deploy(
    machine_type="g2-standard-12",
    accelerator_type="NVIDIA_L4",
    accelerator_count=1,
    min_replica_count=1,
    max_replica_count=3,
)
```

### Step 5: Custom training jobs

**Custom training with prebuilt container:**
```python
from google.cloud import aiplatform

job = aiplatform.CustomTrainingJob(
    display_name="my-training-job",
    script_path="trainer/task.py",
    container_uri="us-docker.pkg.dev/vertex-ai/training/tf-gpu.2-14.py310:latest",
    requirements=["transformers", "datasets"],
    model_serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/tf2-gpu.2-14:latest",
)

model = job.run(
    dataset=dataset,
    model_display_name="my-model",
    machine_type="n1-standard-8",
    accelerator_type="NVIDIA_TESLA_T4",
    accelerator_count=1,
    args=["--epochs=10", "--batch-size=32"],
    replica_count=1,
    base_output_dir="gs://my-bucket/training-output",
)
```

**Custom container training:**
```python
job = aiplatform.CustomContainerTrainingJob(
    display_name="custom-training",
    container_uri="us-central1-docker.pkg.dev/my-project/repo/trainer:latest",
    model_serving_container_image_uri="us-central1-docker.pkg.dev/my-project/repo/predictor:latest",
)

model = job.run(
    model_display_name="custom-model",
    machine_type="a2-highgpu-1g",
    accelerator_type="NVIDIA_TESLA_A100",
    accelerator_count=1,
    replica_count=1,
)
```

**Hyperparameter tuning:**
```python
from google.cloud.aiplatform import hyperparameter_tuning as hpt

job = aiplatform.HyperparameterTuningJob(
    display_name="hp-tuning-job",
    custom_job=custom_job,
    metric_spec={"accuracy": "maximize"},
    parameter_spec={
        "learning_rate": hpt.DoubleParameterSpec(min=0.001, max=0.1, scale="log"),
        "batch_size": hpt.DiscreteParameterSpec(values=[16, 32, 64, 128], scale="linear"),
        "num_layers": hpt.IntegerParameterSpec(min=2, max=10, scale="linear"),
    },
    max_trial_count=20,
    parallel_trial_count=4,
    search_algorithm="RANDOM_SEARCH",
)

job.run()
```

### Step 6: AutoML training

**Tabular classification:**
```python
dataset = aiplatform.TabularDataset.create(
    display_name="customer-churn",
    bq_source="bq://my-project.dataset.training_data",
)

job = aiplatform.AutoMLTabularTrainingJob(
    display_name="churn-prediction",
    optimization_prediction_type="classification",
    optimization_objective="maximize-au-roc",
    column_transformations=[
        {"numeric": {"column_name": "age"}},
        {"categorical": {"column_name": "plan_type"}},
        {"text": {"column_name": "support_notes"}},
    ],
)

model = job.run(
    dataset=dataset,
    target_column="churned",
    training_fraction_split=0.8,
    validation_fraction_split=0.1,
    test_fraction_split=0.1,
    budget_milli_node_hours=2000,
)
```

**Image classification:**
```python
dataset = aiplatform.ImageDataset.create(
    display_name="product-images",
    gcs_source="gs://my-bucket/images/import.jsonl",
)

job = aiplatform.AutoMLImageTrainingJob(
    display_name="product-classifier",
    prediction_type="classification",
    multi_label=False,
    model_type="CLOUD",
)

model = job.run(
    dataset=dataset,
    budget_milli_node_hours=8000,
)
```

### Step 7: Model deployment and prediction

**Deploy to endpoint (online prediction):**
```python
endpoint = aiplatform.Endpoint.create(display_name="my-endpoint")

model.deploy(
    endpoint=endpoint,
    machine_type="n1-standard-4",
    accelerator_type="NVIDIA_TESLA_T4",
    accelerator_count=1,
    min_replica_count=1,
    max_replica_count=5,
    traffic_split={"0": 100},
    deploy_request_timeout=1200,
)

# Make prediction
prediction = endpoint.predict(
    instances=[{"features": [1.0, 2.0, 3.0]}],
    parameters={"confidence_threshold": 0.5},
)
```

**A/B testing with traffic splitting:**
```python
# Deploy new model version with 10% traffic
endpoint.deploy(
    model=new_model,
    machine_type="n1-standard-4",
    min_replica_count=1,
    max_replica_count=3,
    traffic_split={"0": 90, "new_model_id": 10},
)

# Gradually increase traffic
endpoint.update(traffic_split={"0": 50, "new_model_id": 50})

# Full cutover
endpoint.update(traffic_split={"new_model_id": 100})
endpoint.undeploy(deployed_model_id="0")
```

**Batch prediction:**
```python
batch_prediction_job = model.batch_predict(
    job_display_name="batch-prediction",
    gcs_source="gs://my-bucket/input/instances.jsonl",
    gcs_destination_prefix="gs://my-bucket/output/",
    machine_type="n1-standard-4",
    accelerator_type="NVIDIA_TESLA_T4",
    accelerator_count=1,
    starting_replica_count=2,
    max_replica_count=10,
)
```

### Step 8: Vertex AI Pipelines (Kubeflow)

```python
from kfp.v2 import dsl, compiler
from google_cloud_pipeline_components.v1.custom_job import CustomTrainingJobOp
from google_cloud_pipeline_components.v1.endpoint import EndpointCreateOp, ModelDeployOp

@dsl.pipeline(name="ml-pipeline", description="End-to-end ML pipeline")
def ml_pipeline(
    project: str,
    region: str,
    dataset_uri: str,
):
    # Data preprocessing
    preprocess_op = dsl.ContainerOp(
        name="preprocess",
        image="us-central1-docker.pkg.dev/my-project/repo/preprocessor:latest",
        arguments=["--input", dataset_uri, "--output", dsl.PIPELINE_ROOT],
    )

    # Training
    train_op = CustomTrainingJobOp(
        display_name="train-model",
        project=project,
        location=region,
        worker_pool_specs=[{
            "machine_spec": {"machine_type": "n1-standard-8", "accelerator_type": "NVIDIA_TESLA_T4", "accelerator_count": 1},
            "replica_count": 1,
            "container_spec": {"image_uri": "us-central1-docker.pkg.dev/my-project/repo/trainer:latest"},
        }],
    ).after(preprocess_op)

    # Model evaluation
    eval_op = dsl.ContainerOp(
        name="evaluate",
        image="us-central1-docker.pkg.dev/my-project/repo/evaluator:latest",
    ).after(train_op)

    # Conditional deployment
    with dsl.Condition(eval_op.outputs["accuracy"] > 0.9):
        endpoint_op = EndpointCreateOp(
            display_name="production-endpoint",
            project=project,
            location=region,
        )

        deploy_op = ModelDeployOp(
            endpoint=endpoint_op.outputs["endpoint"],
            model=train_op.outputs["model"],
            deployed_model_display_name="production-model",
            machine_type="n1-standard-4",
        )

# Compile and submit pipeline
compiler.Compiler().compile(pipeline_func=ml_pipeline, package_path="pipeline.json")

job = aiplatform.PipelineJob(
    display_name="ml-pipeline-run",
    template_path="pipeline.json",
    parameter_values={"project": "my-project", "region": "us-central1", "dataset_uri": "gs://my-bucket/data"},
    pipeline_root="gs://my-project-vertex-pipelines",
)
job.submit()
```

### Step 9: Feature Store

```python
# Create feature store
fs = aiplatform.FeatureStore.create(
    featurestore_id="my_featurestore",
    online_store_fixed_node_count=1,
)

# Create entity type
entity_type = fs.create_entity_type(
    entity_type_id="users",
    description="User features",
)

# Create features
entity_type.batch_create_features(
    feature_configs={
        "age": {"value_type": "INT64"},
        "lifetime_value": {"value_type": "DOUBLE"},
        "account_type": {"value_type": "STRING"},
    },
)

# Ingest features from BigQuery
entity_type.ingest_from_bq(
    bq_source_uri="bq://my-project.dataset.user_features",
    feature_ids=["age", "lifetime_value", "account_type"],
    entity_id_field="user_id",
    feature_time_field="timestamp",
)

# Online serving
entity_type.read(entity_ids=["user_123", "user_456"])
```

### Step 10: Vector Search (Matching Engine)

```python
# Create index
index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
    display_name="product-embeddings",
    contents_delta_uri="gs://my-bucket/embeddings/",
    dimensions=768,
    approximate_neighbors_count=150,
    distance_measure_type="DOT_PRODUCT_DISTANCE",
    leaf_node_embedding_count=1000,
    leaf_nodes_to_search_percent=10,
)

# Create index endpoint
index_endpoint = aiplatform.MatchingEngineIndexEndpoint.create(
    display_name="product-search-endpoint",
    public_endpoint_enabled=True,
)

# Deploy index
deployed_index = index_endpoint.deploy_index(
    index=index,
    deployed_index_id="product_index_v1",
    min_replica_count=1,
    max_replica_count=5,
    machine_type="e2-standard-16",
)

# Query similar items
response = index_endpoint.find_neighbors(
    deployed_index_id="product_index_v1",
    queries=[query_embedding],
    num_neighbors=10,
)
```

### Step 11: Vertex AI Search (Enterprise Search)

```python
from google.cloud import discoveryengine_v1 as discoveryengine

# Create search engine data store
client = discoveryengine.DataStoreServiceClient()

data_store = client.create_data_store(
    parent=f"projects/my-project/locations/global/collections/default_collection",
    data_store_id="my-knowledge-base",
    data_store={
        "display_name": "Knowledge Base",
        "industry_vertical": discoveryengine.IndustryVertical.GENERIC,
        "content_config": discoveryengine.DataStore.ContentConfig.CONTENT_REQUIRED,
    },
)

# Search
search_client = discoveryengine.SearchServiceClient()

response = search_client.search(
    serving_config=f"projects/my-project/locations/global/collections/default_collection/dataStores/my-knowledge-base/servingConfigs/default_search",
    query="How to reset password",
    page_size=10,
    content_search_spec=discoveryengine.SearchRequest.ContentSearchSpec(
        snippet_spec=discoveryengine.SearchRequest.ContentSearchSpec.SnippetSpec(
            return_snippet=True,
        ),
        summary_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec(
            summary_result_count=3,
            include_citations=True,
            model_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec.ModelSpec(
                version="gemini-1.5-flash-002/answer_gen/v1",
            ),
        ),
    ),
)
```

### Step 12: RAG with Vertex AI

```python
from vertexai.preview import rag

# Create RAG corpus
corpus = rag.create_corpus(display_name="my-knowledge-base")

# Import documents
rag.import_files(
    corpus_name=corpus.name,
    paths=["gs://my-bucket/documents/"],
    chunk_size=512,
    chunk_overlap=100,
)

# RAG retrieval with Gemini
from vertexai.generative_models import GenerativeModel, Tool
from vertexai.preview.generative_models import grounding

model = GenerativeModel("gemini-1.5-pro-002")

rag_tool = Tool.from_retrieval(
    retrieval=grounding.Retrieval(
        source=grounding.VertexAISearch(
            datastore=f"projects/my-project/locations/global/collections/default_collection/dataStores/my-knowledge-base",
        ),
    ),
)

response = model.generate_content(
    "What is our refund policy?",
    tools=[rag_tool],
)
```

### Step 13: Experiment tracking

```python
aiplatform.init(experiment="my-experiment")

with aiplatform.start_run("run-001"):
    aiplatform.log_params({
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 10,
    })

    # Training loop...
    aiplatform.log_metrics({
        "accuracy": 0.95,
        "loss": 0.05,
        "f1_score": 0.93,
    })

    aiplatform.log_time_series_metrics({"train_loss": 0.1}, step=1)
    aiplatform.log_time_series_metrics({"train_loss": 0.05}, step=2)

# Compare experiments
experiment_df = aiplatform.get_experiment_df("my-experiment")
print(experiment_df[["run_name", "param.learning_rate", "metric.accuracy"]])
```

### Step 14: Model monitoring

```python
from google.cloud.aiplatform import model_monitoring

# Configure monitoring
objective_config = model_monitoring.ObjectiveConfig(
    training_dataset=model_monitoring.RandomSampleConfig(sample_rate=0.8),
    training_prediction_skew_detection_config=model_monitoring.SkewDetectionConfig(
        data_source="bq://my-project.dataset.training_data",
        skew_thresholds={"feature_1": 0.3, "feature_2": 0.3},
    ),
    prediction_drift_detection_config=model_monitoring.DriftDetectionConfig(
        drift_thresholds={"feature_1": 0.3, "feature_2": 0.3},
    ),
)

monitoring_job = aiplatform.ModelDeploymentMonitoringJob.create(
    display_name="model-monitoring",
    endpoint=endpoint,
    logging_sampling_strategy=model_monitoring.RandomSampleConfig(sample_rate=0.1),
    schedule_config=model_monitoring.ScheduleConfig(monitor_interval=3600),
    objective_configs=objective_config,
    alert_config=model_monitoring.EmailAlertConfig(
        user_emails=["ml-team@company.com"],
    ),
)
```

## Best Practices

- Use Gemini models for most text tasks; they offer the best price-performance ratio on GCP
- Use streaming for real-time applications to improve perceived latency
- Use Vertex AI Pipelines for reproducible ML workflows
- Track all experiments with experiment tracking for reproducibility
- Use Feature Store for consistent feature serving across training and inference
- Deploy with autoscaling and set appropriate min/max replica counts
- Use batch prediction for non-real-time workloads to reduce costs
- Implement model monitoring to detect data drift and model degradation

## Anti-Patterns

- Do not deploy models without autoscaling configuration
- Do not skip model evaluation before production deployment
- Do not use hardcoded feature transformations; use Feature Store for consistency
- Do not ignore model monitoring alerts; investigate drift promptly
- Do not use overly large models when a smaller model suffices
- Do not train without experiment tracking; it makes debugging impossible

## Security Considerations

- Use VPC-SC to restrict Vertex AI API access to authorized networks
- Use CMEK for encrypting training data, models, and endpoints
- Use service accounts with least-privilege IAM for training and prediction
- Enable audit logging for model access and predictions
- Use Vertex AI Workbench managed notebooks with secure configurations
- Review model outputs for PII leakage before serving

## Cost Optimization

- Use spot/preemptible VMs for training jobs (up to 80% cheaper)
- Use Gemini Flash models instead of Pro for simple tasks
- Use batch prediction instead of online endpoints for non-real-time workloads
- Right-size GPU/TPU for training jobs using profiling
- Scale endpoints to zero during off-peak hours when possible
- Use committed use discounts for sustained GPU usage
- Clean up unused endpoints, models, and training artifacts
- Use model distillation to create smaller, cheaper models for production
