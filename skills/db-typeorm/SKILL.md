---
name: db-typeorm
description: Generate TypeORM entities, repositories, migrations, relations, and query builders. Use when the user wants to set up or work with TypeORM.
argument-hint: "[entity|query|migrate|setup] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx typeorm *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a TypeORM expert. Generate production-ready entities and data access patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: entity design, queries, migrations, repository pattern
- **Database**: PostgreSQL, MySQL, SQLite, MSSQL, Oracle
- **Framework**: NestJS (recommended), Express, standalone

### Step 2: Entity design

Generate TypeORM entities with decorators:
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @OneToMany(() => Post, (post) => post.author, { cascade: true })
  posts: Post[];

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // Soft delete
}
```

Relations:
- @OneToOne, @OneToMany, @ManyToOne, @ManyToMany
- Cascade options for auto-save
- Eager/lazy loading
- JoinTable for many-to-many

### Step 3: Repository and QueryBuilder

```typescript
// Repository pattern
const users = await userRepository.find({
  where: { role: Role.ADMIN },
  relations: { posts: true },
  order: { createdAt: 'DESC' },
  take: 10, skip: page * 10,
});

// QueryBuilder for complex queries
const results = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post', 'post.published = :pub', { pub: true })
  .where('user.role = :role', { role: 'admin' })
  .andWhere('user.createdAt > :date', { date: startDate })
  .orderBy('user.createdAt', 'DESC')
  .take(10)
  .getMany();

// Raw queries
const stats = await dataSource.query(
  'SELECT role, COUNT(*) as count FROM users GROUP BY role'
);

// Transactions
await dataSource.transaction(async (manager) => {
  const user = manager.create(User, { email, name });
  await manager.save(user);
  const post = manager.create(Post, { title, authorId: user.id });
  await manager.save(post);
});
```

### Step 4: Migrations

```bash
npx typeorm migration:generate -d src/data-source.ts src/migrations/CreateUsers
npx typeorm migration:run -d src/data-source.ts
npx typeorm migration:revert -d src/data-source.ts
```

Generate DataSource configuration:
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Post, Profile],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // NEVER true in production
  logging: process.env.NODE_ENV !== 'production',
});
```

### Step 5: NestJS integration

Generate NestJS module with:
- TypeOrmModule.forRootAsync with ConfigService
- TypeOrmModule.forFeature per module
- Custom repositories with @EntityRepository
- Service layer with proper error handling

### Step 6: Advanced features

- Subscribers for entity lifecycle events
- Custom repositories for reusable query logic
- Tree entities (closure table, materialized path, nested set)
- View entities for database views
- Embedded entities for value objects

### Best practices:
- NEVER use synchronize: true in production
- Use migrations for all schema changes
- Use QueryBuilder for complex joins and conditions
- Use repository pattern for clean architecture
- Use transactions for multi-entity operations
- Use soft delete for data retention requirements
- Use connection pooling in production
- Always use parameterized queries (built-in with TypeORM)
