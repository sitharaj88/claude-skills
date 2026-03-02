---
name: db-prisma
description: Generate Prisma schemas, migrations, queries, relations, middleware, and seeding scripts. Use when the user wants to set up or work with Prisma ORM.
argument-hint: "[schema|query|migrate|seed] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx prisma *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a Prisma ORM expert. Generate production-ready schemas and data access patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: schema design, queries, migrations, seeding, client generation
- **Database**: PostgreSQL, MySQL, SQLite, MongoDB, CockroachDB
- **Framework**: Next.js, Express, NestJS, SvelteKit, Remix

### Step 2: Schema design

Generate schema.prisma:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Post {
  id          String     @id @default(uuid())
  title       String
  content     String?
  published   Boolean    @default(false)
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
  categories  Category[]
  tags        String[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([authorId])
  @@index([published, createdAt])
  @@map("posts")
}

enum Role {
  USER
  ADMIN
  EDITOR
}
```

Relations:
- One-to-one: User ↔ Profile
- One-to-many: User → Post[]
- Many-to-many: Post ↔ Category (implicit or explicit)
- Self-relations: User → followers/following

### Step 3: Prisma Client queries

Generate type-safe queries:

**CRUD operations:**
```typescript
// Create with relation
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'Alice',
    posts: { create: { title: 'First Post' } },
    profile: { create: { bio: 'Hello!' } }
  },
  include: { posts: true, profile: true }
});

// Find with filtering, pagination, sorting
const posts = await prisma.post.findMany({
  where: { published: true, author: { role: 'ADMIN' } },
  include: { author: { select: { name: true, email: true } } },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: page * 10
});

// Upsert
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated' },
  create: { email: 'user@example.com', name: 'New' }
});

// Transaction
const [post, count] = await prisma.$transaction([
  prisma.post.create({ data: { ... } }),
  prisma.post.count({ where: { published: true } })
]);
```

### Step 4: Advanced patterns

- **Middleware**: logging, soft delete, audit trail
- **Extensions**: custom model methods, result extensions
- **Raw queries**: $queryRaw and $executeRaw for complex SQL
- **Cursor-based pagination**: using cursor + take
- **Full-text search**: with PostgreSQL
- **JSON filtering**: for JSON/JSONB columns

### Step 5: Migrations and seeding

```bash
npx prisma migrate dev --name init     # Create migration
npx prisma migrate deploy              # Apply in production
npx prisma db seed                     # Run seed script
npx prisma generate                    # Regenerate client
```

Generate seed script with realistic test data using faker.

### Step 6: Best practices singleton

```typescript
// lib/prisma.ts — singleton for hot reloading
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Best practices:
- Use @map and @@map for custom table/column names
- Use @@index for frequently queried fields
- Use onDelete: Cascade for owned relations
- Use @updatedAt for automatic timestamp tracking
- Use select instead of include to reduce payload
- Use transactions for multi-model operations
- Use Prisma Accelerate for connection pooling in serverless
- Run migrate deploy (not dev) in production
