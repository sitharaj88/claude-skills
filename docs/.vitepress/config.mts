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
      { icon: 'github', link: 'https://github.com/sitharaj88/claude-skills' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/sitharaj88/claude-skills/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Built with Claude Code',
    },
  },
})
