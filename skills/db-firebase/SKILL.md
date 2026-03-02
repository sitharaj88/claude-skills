---
name: db-firebase
description: Generate Firebase Firestore schemas, security rules, queries, Cloud Functions, and real-time listeners. Use when the user wants to build with Firebase/Firestore.
argument-hint: "[schema|rules|queries|functions] [description]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(firebase *), Bash(npm *)
user-invocable: true
---

## Instructions

You are a Firebase/Firestore expert. Generate production-ready configurations and code.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Task**: data modeling, security rules, queries, Cloud Functions, real-time
- **Platform**: Web, React Native, Flutter, iOS, Android
- **SDK**: Firebase JS SDK v9+ (modular), Admin SDK

### Step 2: Data modeling

Design Firestore collections:
- **Documents** are limited to 1MB
- **Subcollections** for one-to-many relationships
- **Denormalization** is expected (duplicate data for query efficiency)
- **Collection group queries** for querying across subcollections

```
users/{userId}
  ├── profile fields (name, email, avatar, role)
  └── posts/{postId}     (subcollection)
        ├── content fields
        └── comments/{commentId}  (sub-subcollection)

posts/{postId}            (root collection for querying all posts)
  ├── content, authorId, authorName (denormalized)
  └── tags[], category
```

### Step 3: Security rules

Generate Firestore security rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    function isAdmin() {
      return request.auth.token.role == 'admin';
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();

      match /posts/{postId} {
        allow read: if resource.data.published == true || isOwner(userId);
        allow create: if isOwner(userId)
          && request.resource.data.keys().hasAll(['title', 'content'])
          && request.resource.data.title is string
          && request.resource.data.title.size() <= 200;
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId) || isAdmin();
      }
    }

    match /posts/{postId} {
      allow read: if resource.data.published == true;
      allow write: if false; // Only via Cloud Functions
    }
  }
}
```

### Step 4: Client queries (modular SDK v9+)

```typescript
import { collection, query, where, orderBy, limit, getDocs, onSnapshot,
         addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// Read with filtering
const q = query(
  collection(db, 'posts'),
  where('published', '==', true),
  where('category', '==', 'tech'),
  orderBy('createdAt', 'desc'),
  limit(10)
);
const snapshot = await getDocs(q);

// Real-time listener
const unsubscribe = onSnapshot(q, (snapshot) => {
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setPosts(posts);
});

// Write
await addDoc(collection(db, 'posts'), {
  title: 'New Post',
  content: 'Hello',
  authorId: auth.currentUser.uid,
  createdAt: serverTimestamp(),
});

// Batch writes
const batch = writeBatch(db);
batch.set(doc(db, 'posts', postId), postData);
batch.update(doc(db, 'users', userId), { postCount: increment(1) });
await batch.commit();

// Transaction
await runTransaction(db, async (transaction) => {
  const userDoc = await transaction.get(userRef);
  transaction.update(userRef, { postCount: userDoc.data().postCount + 1 });
  transaction.set(postRef, postData);
});
```

### Step 5: Cloud Functions

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const onPostCreated = onDocumentCreated('users/{userId}/posts/{postId}', async (event) => {
  const post = event.data?.data();
  // Denormalize to root posts collection
  await admin.firestore().doc(`posts/${event.params.postId}`).set({
    ...post,
    authorId: event.params.userId,
  });
});

export const deleteAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  // Delete user data, then auth account
});
```

### Step 6: Indexes

Generate firestore.indexes.json for composite queries:
```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "published", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Best practices:
- Denormalize data for query efficiency
- Use security rules for ALL access control (not just client-side)
- Validate data shape in security rules
- Use batch writes and transactions for atomicity
- Create composite indexes for multi-field queries
- Use Cloud Functions for server-side logic and denormalization
- Use subcollections when documents in a collection can grow large
- Use serverTimestamp() for consistent timestamps
