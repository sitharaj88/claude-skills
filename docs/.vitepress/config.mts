import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Claude Skills',
  description: 'World-class Claude Code skills — custom slash commands that supercharge your development workflow.',
  base: '/claude-skills/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/claude-skills/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#D97706' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Claude Skills' }],
    ['meta', { property: 'og:description', content: 'World-class Claude Code skills — custom slash commands that supercharge your development workflow.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  cleanUrls: true,

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      {
        text: 'Skills',
        items: [
          { text: 'Developer Workflow', link: '/skills/workflow/' },
          { text: 'Code Generation', link: '/skills/generation/' },
          { text: 'Analysis & Docs', link: '/skills/analysis/' },
          { text: 'Mobile Development', link: '/skills/mobile/' },
          { text: 'Database & DevOps', link: '/skills/devops/' },
          { text: 'Security & Performance', link: '/skills/security/' },
          { text: 'Migration', link: '/skills/migration/' },
          { text: 'AWS Compute & Networking', link: '/skills/aws-compute/' },
          { text: 'AWS Data & Storage', link: '/skills/aws-data/' },
          { text: 'AWS Messaging, Security & Auth', link: '/skills/aws-integration/' },
          { text: 'AWS IaC, DevOps & AI', link: '/skills/aws-devops/' },
          { text: 'Relational Databases', link: '/skills/db-relational/' },
          { text: 'NoSQL Databases', link: '/skills/db-nosql/' },
          { text: 'ORMs, BaaS & Design', link: '/skills/db-tools/' },
          { text: 'GCP Compute & Networking', link: '/skills/gcp-compute/' },
          { text: 'GCP Data & Storage', link: '/skills/gcp-data/' },
          { text: 'GCP Messaging, Security & Identity', link: '/skills/gcp-integration/' },
          { text: 'GCP DevOps & AI', link: '/skills/gcp-devops/' },
          { text: 'Azure Compute & Networking', link: '/skills/azure-compute/' },
          { text: 'Azure Data & Storage', link: '/skills/azure-data/' },
          { text: 'Azure Messaging, Security & Identity', link: '/skills/azure-integration/' },
          { text: 'Azure DevOps & AI', link: '/skills/azure-devops/' },
        ]
      },
      { text: 'Reference', link: '/reference/skill-format' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What are Claude Skills?', link: '/guide/what-are-skills' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
          ]
        },
        {
          text: 'Creating Skills',
          items: [
            { text: 'Authoring Guide', link: '/guide/authoring' },
            { text: 'Best Practices', link: '/guide/best-practices' },
            { text: 'Contributing', link: '/guide/contributing' },
          ]
        }
      ],
      '/skills/workflow/': [
        {
          text: 'Developer Workflow',
          items: [
            { text: 'Overview', link: '/skills/workflow/' },
            { text: 'Smart Commit', link: '/skills/workflow/smart-commit' },
            { text: 'Review PR', link: '/skills/workflow/review-pr' },
            { text: 'Create PR', link: '/skills/workflow/create-pr' },
            { text: 'Debug Issue', link: '/skills/workflow/debug-issue' },
            { text: 'Test Writer', link: '/skills/workflow/test-writer' },
          ]
        }
      ],
      '/skills/generation/': [
        {
          text: 'Code Generation',
          items: [
            { text: 'Overview', link: '/skills/generation/' },
            { text: 'Generate Component', link: '/skills/generation/generate-component' },
            { text: 'Generate Endpoint', link: '/skills/generation/generate-endpoint' },
            { text: 'Implement Feature', link: '/skills/generation/implement-feature' },
            { text: 'Scaffold Project', link: '/skills/generation/scaffold-project' },
          ]
        }
      ],
      '/skills/analysis/': [
        {
          text: 'Analysis & Documentation',
          items: [
            { text: 'Overview', link: '/skills/analysis/' },
            { text: 'Analyze Codebase', link: '/skills/analysis/analyze-codebase' },
            { text: 'Generate Arch Doc', link: '/skills/analysis/generate-arch-doc' },
            { text: 'Generate API Doc', link: '/skills/analysis/generate-api-doc' },
            { text: 'Generate Changelog', link: '/skills/analysis/generate-changelog' },
            { text: 'Refactor Module', link: '/skills/analysis/refactor-module' },
          ]
        }
      ],
      '/skills/mobile/': [
        {
          text: 'Mobile Development',
          items: [
            { text: 'Overview', link: '/skills/mobile/' },
            { text: 'Generate Screen', link: '/skills/mobile/generate-screen' },
            { text: 'Scaffold Mobile', link: '/skills/mobile/scaffold-mobile' },
            { text: 'Mobile Test Writer', link: '/skills/mobile/mobile-test-writer' },
            { text: 'Native Bridge', link: '/skills/mobile/generate-native-bridge' },
            { text: 'App Store Prep', link: '/skills/mobile/app-store-prep' },
            { text: 'Mobile CI Setup', link: '/skills/mobile/mobile-ci-setup' },
          ]
        }
      ],
      '/skills/devops/': [
        {
          text: 'Database & DevOps',
          items: [
            { text: 'Overview', link: '/skills/devops/' },
            { text: 'Generate Migration', link: '/skills/devops/generate-migration' },
            { text: 'Docker Setup', link: '/skills/devops/docker-setup' },
            { text: 'Deploy Config', link: '/skills/devops/deploy-config' },
            { text: 'Setup Monitoring', link: '/skills/devops/setup-monitoring' },
          ]
        }
      ],
      '/skills/security/': [
        {
          text: 'Security & Performance',
          items: [
            { text: 'Overview', link: '/skills/security/' },
            { text: 'Security Audit', link: '/skills/security/security-audit' },
            { text: 'Performance Audit', link: '/skills/security/performance-audit' },
            { text: 'Dependency Audit', link: '/skills/security/dependency-audit' },
          ]
        }
      ],
      '/skills/migration/': [
        {
          text: 'Migration & Conversion',
          items: [
            { text: 'Overview', link: '/skills/migration/' },
            { text: 'Migrate Code', link: '/skills/migration/migrate-code' },
          ]
        }
      ],
      '/skills/aws-compute/': [
        {
          text: 'AWS Compute & Networking',
          items: [
            { text: 'Overview', link: '/skills/aws-compute/' },
            { text: 'Lambda', link: '/skills/aws-compute/aws-lambda' },
            { text: 'EC2', link: '/skills/aws-compute/aws-ec2' },
            { text: 'ECS / Fargate', link: '/skills/aws-compute/aws-ecs' },
            { text: 'EKS', link: '/skills/aws-compute/aws-eks' },
            { text: 'VPC', link: '/skills/aws-compute/aws-vpc' },
            { text: 'API Gateway', link: '/skills/aws-compute/aws-api-gateway' },
            { text: 'CloudFront', link: '/skills/aws-compute/aws-cloudfront' },
          ]
        }
      ],
      '/skills/aws-data/': [
        {
          text: 'AWS Data & Storage',
          items: [
            { text: 'Overview', link: '/skills/aws-data/' },
            { text: 'S3', link: '/skills/aws-data/aws-s3' },
            { text: 'DynamoDB', link: '/skills/aws-data/aws-dynamodb' },
            { text: 'RDS / Aurora', link: '/skills/aws-data/aws-rds' },
            { text: 'ElastiCache', link: '/skills/aws-data/aws-elasticache' },
            { text: 'Kinesis', link: '/skills/aws-data/aws-kinesis' },
            { text: 'Secrets Manager', link: '/skills/aws-data/aws-secrets' },
          ]
        }
      ],
      '/skills/aws-integration/': [
        {
          text: 'AWS Messaging, Security & Auth',
          items: [
            { text: 'Overview', link: '/skills/aws-integration/' },
            { text: 'SQS & SNS', link: '/skills/aws-integration/aws-sqs-sns' },
            { text: 'EventBridge', link: '/skills/aws-integration/aws-eventbridge' },
            { text: 'Step Functions', link: '/skills/aws-integration/aws-step-functions' },
            { text: 'SES', link: '/skills/aws-integration/aws-ses' },
            { text: 'IAM', link: '/skills/aws-integration/aws-iam' },
            { text: 'Cognito', link: '/skills/aws-integration/aws-cognito' },
            { text: 'WAF', link: '/skills/aws-integration/aws-waf' },
          ]
        }
      ],
      '/skills/aws-devops/': [
        {
          text: 'AWS IaC, DevOps & AI',
          items: [
            { text: 'Overview', link: '/skills/aws-devops/' },
            { text: 'CloudFormation', link: '/skills/aws-devops/aws-cloudformation' },
            { text: 'CDK', link: '/skills/aws-devops/aws-cdk' },
            { text: 'Terraform', link: '/skills/aws-devops/aws-terraform' },
            { text: 'CloudWatch', link: '/skills/aws-devops/aws-cloudwatch' },
            { text: 'CodePipeline', link: '/skills/aws-devops/aws-codepipeline' },
            { text: 'Route 53', link: '/skills/aws-devops/aws-route53' },
            { text: 'Amplify', link: '/skills/aws-devops/aws-amplify' },
            { text: 'Bedrock', link: '/skills/aws-devops/aws-bedrock' },
          ]
        }
      ],
      '/skills/db-relational/': [
        {
          text: 'Relational Databases',
          items: [
            { text: 'Overview', link: '/skills/db-relational/' },
            { text: 'PostgreSQL', link: '/skills/db-relational/db-postgres' },
            { text: 'MySQL', link: '/skills/db-relational/db-mysql' },
            { text: 'SQLite', link: '/skills/db-relational/db-sqlite' },
          ]
        }
      ],
      '/skills/db-nosql/': [
        {
          text: 'NoSQL Databases',
          items: [
            { text: 'Overview', link: '/skills/db-nosql/' },
            { text: 'MongoDB', link: '/skills/db-nosql/db-mongodb' },
            { text: 'Redis', link: '/skills/db-nosql/db-redis' },
            { text: 'Elasticsearch', link: '/skills/db-nosql/db-elasticsearch' },
            { text: 'Cassandra', link: '/skills/db-nosql/db-cassandra' },
            { text: 'Neo4j', link: '/skills/db-nosql/db-neo4j' },
          ]
        }
      ],
      '/skills/db-tools/': [
        {
          text: 'ORMs, BaaS & Design',
          items: [
            { text: 'Overview', link: '/skills/db-tools/' },
            { text: 'Prisma', link: '/skills/db-tools/db-prisma' },
            { text: 'Drizzle', link: '/skills/db-tools/db-drizzle' },
            { text: 'TypeORM', link: '/skills/db-tools/db-typeorm' },
            { text: 'Supabase', link: '/skills/db-tools/db-supabase' },
            { text: 'Firebase', link: '/skills/db-tools/db-firebase' },
            { text: 'Schema Design', link: '/skills/db-tools/db-design' },
          ]
        }
      ],
      '/skills/gcp-compute/': [
        {
          text: 'GCP Compute & Networking',
          items: [
            { text: 'Overview', link: '/skills/gcp-compute/' },
            { text: 'Cloud Functions', link: '/skills/gcp-compute/gcp-cloud-functions' },
            { text: 'Compute Engine', link: '/skills/gcp-compute/gcp-compute-engine' },
            { text: 'Cloud Run', link: '/skills/gcp-compute/gcp-cloud-run' },
            { text: 'GKE', link: '/skills/gcp-compute/gcp-gke' },
            { text: 'VPC Network', link: '/skills/gcp-compute/gcp-vpc' },
            { text: 'Load Balancing', link: '/skills/gcp-compute/gcp-load-balancing' },
            { text: 'Cloud CDN', link: '/skills/gcp-compute/gcp-cloud-cdn' },
          ]
        }
      ],
      '/skills/gcp-data/': [
        {
          text: 'GCP Data & Storage',
          items: [
            { text: 'Overview', link: '/skills/gcp-data/' },
            { text: 'Cloud Storage', link: '/skills/gcp-data/gcp-cloud-storage' },
            { text: 'Cloud SQL', link: '/skills/gcp-data/gcp-cloud-sql' },
            { text: 'Firestore', link: '/skills/gcp-data/gcp-firestore' },
            { text: 'Bigtable', link: '/skills/gcp-data/gcp-bigtable' },
            { text: 'Spanner', link: '/skills/gcp-data/gcp-spanner' },
            { text: 'Memorystore', link: '/skills/gcp-data/gcp-memorystore' },
            { text: 'BigQuery', link: '/skills/gcp-data/gcp-bigquery' },
          ]
        }
      ],
      '/skills/gcp-integration/': [
        {
          text: 'GCP Messaging, Security & Identity',
          items: [
            { text: 'Overview', link: '/skills/gcp-integration/' },
            { text: 'Pub/Sub', link: '/skills/gcp-integration/gcp-pubsub' },
            { text: 'Cloud Tasks', link: '/skills/gcp-integration/gcp-cloud-tasks' },
            { text: 'Eventarc', link: '/skills/gcp-integration/gcp-eventarc' },
            { text: 'IAM', link: '/skills/gcp-integration/gcp-iam' },
            { text: 'Secret Manager', link: '/skills/gcp-integration/gcp-secret-manager' },
            { text: 'Cloud Armor', link: '/skills/gcp-integration/gcp-cloud-armor' },
            { text: 'Identity Platform', link: '/skills/gcp-integration/gcp-identity-platform' },
          ]
        }
      ],
      '/skills/gcp-devops/': [
        {
          text: 'GCP DevOps & AI',
          items: [
            { text: 'Overview', link: '/skills/gcp-devops/' },
            { text: 'Cloud Build', link: '/skills/gcp-devops/gcp-cloud-build' },
            { text: 'Cloud Deploy', link: '/skills/gcp-devops/gcp-cloud-deploy' },
            { text: 'Cloud Monitoring', link: '/skills/gcp-devops/gcp-cloud-monitoring' },
            { text: 'Terraform', link: '/skills/gcp-devops/gcp-terraform' },
            { text: 'Vertex AI', link: '/skills/gcp-devops/gcp-vertex-ai' },
            { text: 'Cloud DNS', link: '/skills/gcp-devops/gcp-cloud-dns' },
            { text: 'Workflows', link: '/skills/gcp-devops/gcp-workflows' },
          ]
        }
      ],
      '/skills/azure-compute/': [
        {
          text: 'Azure Compute & Networking',
          items: [
            { text: 'Overview', link: '/skills/azure-compute/' },
            { text: 'Azure Functions', link: '/skills/azure-compute/azure-functions' },
            { text: 'Virtual Machines', link: '/skills/azure-compute/azure-vm' },
            { text: 'Container Apps', link: '/skills/azure-compute/azure-container-apps' },
            { text: 'AKS', link: '/skills/azure-compute/azure-aks' },
            { text: 'Virtual Network', link: '/skills/azure-compute/azure-vnet' },
            { text: 'Application Gateway', link: '/skills/azure-compute/azure-app-gateway' },
            { text: 'Front Door', link: '/skills/azure-compute/azure-front-door' },
          ]
        }
      ],
      '/skills/azure-data/': [
        {
          text: 'Azure Data & Storage',
          items: [
            { text: 'Overview', link: '/skills/azure-data/' },
            { text: 'Blob Storage', link: '/skills/azure-data/azure-blob-storage' },
            { text: 'Azure SQL', link: '/skills/azure-data/azure-sql' },
            { text: 'Cosmos DB', link: '/skills/azure-data/azure-cosmos-db' },
            { text: 'Cache for Redis', link: '/skills/azure-data/azure-cache-redis' },
            { text: 'Event Hubs', link: '/skills/azure-data/azure-event-hubs' },
            { text: 'Key Vault', link: '/skills/azure-data/azure-key-vault' },
            { text: 'Synapse Analytics', link: '/skills/azure-data/azure-synapse' },
          ]
        }
      ],
      '/skills/azure-integration/': [
        {
          text: 'Azure Messaging, Security & Identity',
          items: [
            { text: 'Overview', link: '/skills/azure-integration/' },
            { text: 'Service Bus', link: '/skills/azure-integration/azure-service-bus' },
            { text: 'Event Grid', link: '/skills/azure-integration/azure-event-grid' },
            { text: 'Logic Apps', link: '/skills/azure-integration/azure-logic-apps' },
            { text: 'Entra ID', link: '/skills/azure-integration/azure-entra-id' },
            { text: 'RBAC', link: '/skills/azure-integration/azure-rbac' },
            { text: 'API Management', link: '/skills/azure-integration/azure-api-management' },
            { text: 'App Configuration', link: '/skills/azure-integration/azure-app-config' },
          ]
        }
      ],
      '/skills/azure-devops/': [
        {
          text: 'Azure DevOps & AI',
          items: [
            { text: 'Overview', link: '/skills/azure-devops/' },
            { text: 'DevOps Pipelines', link: '/skills/azure-devops/azure-devops-pipelines' },
            { text: 'Azure Monitor', link: '/skills/azure-devops/azure-monitor' },
            { text: 'Terraform', link: '/skills/azure-devops/azure-terraform' },
            { text: 'Azure OpenAI', link: '/skills/azure-devops/azure-openai' },
            { text: 'Azure DNS', link: '/skills/azure-devops/azure-dns' },
            { text: 'Bicep', link: '/skills/azure-devops/azure-bicep' },
            { text: 'Durable Functions', link: '/skills/azure-devops/azure-durable-functions' },
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Skill File Format', link: '/reference/skill-format' },
            { text: 'Frontmatter Fields', link: '/reference/frontmatter' },
            { text: 'Arguments & Variables', link: '/reference/arguments' },
            { text: 'Dynamic Context', link: '/reference/dynamic-context' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sitharaj88' },
      { icon: 'linkedin', link: 'https://linkedin.com/in/sitharaj08' },
      { icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' }, link: 'https://sitharaj.in' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/sitharaj88/claude-skills/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License. <a href="https://buymeacoffee.com/sitharaj88" target="_blank">Buy me a coffee</a>',
      copyright: 'Built by <a href="https://sitharaj.in" target="_blank">Sitharaj</a> with Claude Code',
    },
  },
})
