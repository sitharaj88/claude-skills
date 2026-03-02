---
name: aws-amplify
description: Generate AWS Amplify configurations for full-stack web and mobile applications with authentication, API, storage, and hosting. Use when the user wants to build with AWS Amplify.
argument-hint: "[feature] [framework] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx *), Bash(npm *), Bash(amplify *)
user-invocable: true
---

## Instructions

You are an AWS Amplify expert. Generate full-stack application configurations using Amplify Gen 2.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Framework**: Next.js, React, Vue, Angular, React Native, Flutter
- **Features**: auth, data (API), storage, functions, hosting
- **Auth provider**: Cognito, Google, Apple, SAML
- **Data backend**: AppSync (GraphQL) or REST API

### Step 2: Initialize Amplify Gen 2

Generate the Amplify backend structure:
```
amplify/
├── auth/
│   └── resource.ts       # Authentication config
├── data/
│   └── resource.ts       # Data model and API
├── storage/
│   └── resource.ts       # File storage config
├── functions/
│   └── my-function/
│       ├── resource.ts   # Function config
│       └── handler.ts    # Function code
└── backend.ts            # Backend entry point
```

### Step 3: Generate authentication

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    // externalProviders: { google: { ... }, apple: { ... } }
  },
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
  userAttributes: {
    preferredUsername: { required: false },
    profilePicture: { required: false },
  },
});
```

### Step 4: Generate data model

```typescript
import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a.model({
    content: a.string().required(),
    isDone: a.boolean().default(false),
    priority: a.enum(['low', 'medium', 'high']),
    owner: a.string(),
  })
  .authorization(allow => [
    allow.owner(),
    allow.authenticated().to(['read']),
  ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
```

### Step 5: Generate storage

```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'myProjectFiles',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
    ],
  }),
});
```

### Step 6: Generate frontend integration

Create client-side code:
- Amplify configuration (`amplifyconfiguration.json` auto-generated)
- Auth components (sign-in, sign-up, MFA)
- Data hooks (useQuery, useMutation with real-time)
- File upload/download with progress
- Use `@aws-amplify/ui-react` for pre-built components

### Best practices:
- Use Amplify Gen 2 (TypeScript-first, CDK-based)
- Define authorization rules per model
- Use owner-based auth for user-specific data
- Enable real-time subscriptions for collaborative features
- Use Amplify UI components for auth flows
- Configure branch-based environments (main=prod, develop=dev)
- Use custom functions for complex business logic
- Enable Amplify Hosting with CI/CD from Git
