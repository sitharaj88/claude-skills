import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Claude Skills',
  description: 'World-class Claude Code skills — custom slash commands that supercharge your development workflow.',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
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
