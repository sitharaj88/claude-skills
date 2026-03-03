# GCP Vertex AI

Generate Vertex AI pipelines, model deployments, Gemini integrations, and ML workflows for AI/ML applications on Google Cloud.

## Usage

```bash
/gcp-vertex-ai <description of your AI/ML workflow>
```

## What It Does

1. Generates Gemini API integrations with text generation, multimodal, streaming, and function calling
2. Configures custom training jobs with prebuilt and custom containers on GPU/TPU
3. Creates Vertex AI Pipelines (Kubeflow) for end-to-end ML workflows
4. Sets up model deployment endpoints with autoscaling and A/B traffic splitting
5. Implements RAG pipelines with Vertex AI Search, Vector Search, and grounding
6. Configures experiment tracking, Feature Store, and model monitoring

## Examples

```bash
/gcp-vertex-ai Set up Gemini 1.5 Pro with function calling for a customer support chatbot

/gcp-vertex-ai Create a Vertex AI Pipeline for training, evaluation, and conditional deployment

/gcp-vertex-ai Configure a RAG pipeline with Vertex AI Search and Gemini for knowledge base Q&A
```

## What It Covers

- **Gemini integration** - Text generation, multi-turn chat, multimodal, streaming, and function calling
- **Model Garden** - Pre-trained models including Gemini, Llama, Mistral, Claude, and Imagen
- **Custom training** - Prebuilt containers, custom containers, and hyperparameter tuning
- **AutoML** - Tabular classification, image classification, and other AutoML training jobs
- **Model deployment** - Online endpoints with autoscaling, batch prediction, and A/B testing
- **Vertex AI Pipelines** - Kubeflow-based ML pipelines with conditional deployment logic
- **Feature Store** - Feature ingestion from BigQuery, online serving, and entity management
- **Vector Search** - Matching Engine for similarity search with embedding indexes
- **RAG** - Retrieval-Augmented Generation with Vertex AI Search and corpus management
- **Experiment tracking** - Parameter logging, metric tracking, and experiment comparison
- **Model monitoring** - Skew detection, drift detection, and alerting on model degradation

<div class="badge-row">
  <span class="badge">AI/ML</span>
  <span class="badge">GenAI</span>
  <span class="badge">GCP</span>
</div>

## Allowed Tools

- `Read` - Read existing ML code, model configs, and pipeline definitions
- `Write` - Create training scripts, pipeline definitions, and deployment configs
- `Edit` - Modify existing Vertex AI configurations and ML code
- `Bash` - Run gcloud ai, pip, and python commands for model management
- `Glob` - Search for ML-related Python files and pipeline definitions
- `Grep` - Find model references and API usage patterns
