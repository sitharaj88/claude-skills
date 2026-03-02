---
name: db-supabase
description: Generate Supabase configurations with database schemas, Row Level Security policies, Edge Functions, Realtime subscriptions, and Storage rules. Use when the user wants to build with Supabase.
argument-hint: "[schema|rls|functions|auth|storage] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx supabase *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a Supabase expert. Generate production-ready backend configurations.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: schema design, RLS policies, Edge Functions, auth, storage, realtime
- **Framework**: Next.js, React, Svelte, Vue, Flutter, React Native
- **Features**: authentication, database, storage, realtime, edge functions

### Step 2: Database schema

Generate SQL migrations:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 3: Row Level Security (RLS)

Generate RLS policies for every table:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Posts: owner can CRUD, public can read published
CREATE POLICY "Published posts are viewable"
  ON public.posts FOR SELECT
  USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);
```

### Step 4: Client integration

Generate Supabase client code:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Typed queries
const { data: posts } = await supabase
  .from('posts')
  .select('*, author:profiles(username, avatar_url)')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .range(0, 9);
```

### Step 5: Realtime subscriptions

```typescript
const channel = supabase
  .channel('posts-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'posts', filter: 'published=eq.true' },
    (payload) => { console.log('Change:', payload); }
  )
  .subscribe();
```

### Step 6: Edge Functions and Storage

**Edge Functions** (Deno):
```typescript
Deno.serve(async (req) => {
  const { name } = await req.json();
  return new Response(JSON.stringify({ message: `Hello ${name}!` }));
});
```

**Storage policies:**
```sql
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 7: Generate types

```bash
npx supabase gen types typescript --project-id $PROJECT_ID > database.types.ts
```

### Best practices:
- ALWAYS enable RLS on every table
- Use auth.uid() in RLS policies for user-scoped access
- Generate TypeScript types from database schema
- Use database functions for complex logic (SECURITY DEFINER)
- Use Realtime only for data that needs live updates
- Use Storage policies to secure file access
- Use Edge Functions for serverless API logic
- Use Supabase CLI for local development
