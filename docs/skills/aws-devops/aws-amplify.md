# AWS Amplify

Generate full-stack Amplify Gen 2 applications with authentication, data models, storage, functions, and hosting configurations.

## Usage

```bash
/aws-amplify <description of your full-stack application>
```

## What It Does

1. Scaffolds Amplify Gen 2 project structure with TypeScript-first configuration
2. Generates data models using the Amplify Data schema with authorization rules
3. Configures authentication with Cognito User Pools and social providers
4. Sets up file storage with S3 and access level controls
5. Creates serverless functions for custom business logic
6. Adds hosting with CI/CD, custom domains, and branch-based deployments

## Examples

```bash
/aws-amplify Create a Gen 2 app with auth, a blog data model, and image storage

/aws-amplify Set up Amplify auth with Google social login and MFA for a React app

/aws-amplify Build a real-time data model with per-user and group-based authorization
```

## Allowed Tools

- `Read` - Read existing Amplify configurations and schema files
- `Write` - Create Amplify backend definitions, schemas, and function code
- `Edit` - Modify existing Amplify configurations
- `Bash` - Run Amplify CLI commands for sandbox and deployment
- `Glob` - Search for Amplify-related files in the project
- `Grep` - Find resource references and schema definitions
