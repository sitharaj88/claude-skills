---
name: gcp-firestore
description: Generate Firestore data models, security rules, indexes, and query patterns for document-based NoSQL storage. Use when the user wants to design or configure Firestore databases.
argument-hint: "[operation]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(gcloud *), Bash(firebase *)
user-invocable: true
---

## Instructions

You are a GCP Firestore expert. Generate production-ready Firestore data models, security rules, and query patterns.

### Step 1: Gather requirements

Determine from user input or `$ARGUMENTS`:
- **Operation**: model (data modeling), rules (security rules), queries (query patterns), indexes (composite indexes)
- **Mode**: Native mode (real-time, mobile/web) or Datastore mode (server-side, batch processing)
- **Data entities**: what collections and documents are needed
- **Access patterns**: real-time listeners, complex queries, offline support
- **Scale**: expected document count, read/write throughput, concurrent users

### Step 2: Choose mode

**Native mode (recommended for most new projects):**
- Real-time listeners and offline support
- Mobile/web SDK integration via Firebase
- Document/collection hierarchy
- Strong consistency for all reads

**Datastore mode:**
- Server-side only (no real-time listeners)
- Compatible with legacy Datastore applications
- Supports Entity Groups
- Better for batch/background processing

**Note**: Mode cannot be changed after database creation.

### Step 3: Design data model

**Document/collection hierarchy:**

```
users (collection)
  |-- userId (document)
        |-- name: "Jane Doe"
        |-- email: "jane@example.com"
        |-- createdAt: Timestamp
        |-- roles: ["admin", "editor"]
        |-- profile (map)
        |     |-- bio: "..."
        |     |-- avatar: "https://..."
        |
        |-- orders (subcollection)
              |-- orderId (document)
                    |-- total: 99.99
                    |-- status: "shipped"
                    |-- items: [{ productId, quantity, price }]
                    |-- createdAt: Timestamp

products (collection)
  |-- productId (document)
        |-- name: "Widget"
        |-- price: 29.99
        |-- category: "electronics"
        |-- tags: ["sale", "featured"]
        |-- inventory: 150
```

**Embedding vs referencing decision guide:**

| Approach | When to Use | Example |
|----------|-------------|---------|
| Embed (map/array) | Data always read together, rarely updated independently | User profile fields |
| Subcollection | Large/growing lists, need independent queries | User's orders |
| Root collection + reference | Many-to-many, shared across documents | Products referenced in orders |

**Distributed counter pattern (for high-write fields):**

```javascript
// Create counter shards
const NUM_SHARDS = 10;

async function createCounter(db, counterRef) {
  const batch = db.batch();
  for (let i = 0; i < NUM_SHARDS; i++) {
    const shardRef = counterRef.collection('shards').doc(i.toString());
    batch.set(shardRef, { count: 0 });
  }
  await batch.commit();
}

async function incrementCounter(db, counterRef) {
  const shardId = Math.floor(Math.random() * NUM_SHARDS);
  const shardRef = counterRef.collection('shards').doc(shardId.toString());
  await shardRef.update({
    count: admin.firestore.FieldValue.increment(1)
  });
}

async function getCount(counterRef) {
  const shards = await counterRef.collection('shards').get();
  let totalCount = 0;
  shards.forEach(doc => { totalCount += doc.data().count; });
  return totalCount;
}
```

### Step 4: Generate security rules

**Comprehensive security rules template:**

```javascript
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

    function hasRole(role) {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
    }

    function isAdmin() {
      return hasRole('admin');
    }

    function isValidUser() {
      return request.resource.data.keys().hasAll(['name', 'email']) &&
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 100 &&
        request.resource.data.email is string &&
        request.resource.data.email.matches('.*@.*\\..*');
    }

    function isValidTimestamp() {
      return request.resource.data.createdAt == request.time;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && isValidUser() && isValidTimestamp();
      allow update: if isOwner(userId) && isValidUser();
      allow delete: if isAdmin();

      // User's orders subcollection
      match /orders/{orderId} {
        allow read: if isOwner(userId) || isAdmin();
        allow create: if isOwner(userId) &&
          request.resource.data.keys().hasAll(['total', 'status', 'items', 'createdAt']) &&
          request.resource.data.total is number &&
          request.resource.data.total > 0 &&
          request.resource.data.status == 'pending';
        allow update: if isAdmin() &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']);
        allow delete: if false;  // Never delete orders
      }
    }

    // Products collection
    match /products/{productId} {
      allow read: if true;  // Public read
      allow write: if isAdmin();
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 5: Generate composite indexes

**firestore.indexes.json:**

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "products",
      "fieldPath": "description",
      "indexes": [
        { "queryScope": "COLLECTION", "order": "ASCENDING" },
        { "queryScope": "COLLECTION", "order": "DESCENDING" }
      ]
    }
  ]
}
```

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 6: Query patterns

**Basic CRUD operations:**

```javascript
const { getFirestore, collection, doc, addDoc, getDoc, getDocs,
        updateDoc, deleteDoc, query, where, orderBy, limit,
        startAfter, serverTimestamp, writeBatch, runTransaction,
        onSnapshot } = require('firebase/firestore');

const db = getFirestore();

// Create document with auto-generated ID
async function createProduct(data) {
  const docRef = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Read single document
async function getProduct(productId) {
  const docSnap = await getDoc(doc(db, 'products', productId));
  if (!docSnap.exists()) throw new Error('Product not found');
  return { id: docSnap.id, ...docSnap.data() };
}

// Query with filters
async function getProductsByCategory(category, maxPrice) {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category),
    where('price', '<=', maxPrice),
    orderBy('price', 'asc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Pagination with cursors
async function getProductsPage(lastDoc, pageSize = 20) {
  let q = query(
    collection(db, 'products'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  const snapshot = await getDocs(q);
  return {
    products: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === pageSize,
  };
}

// Collection group query (across all subcollections named 'orders')
async function getAllPendingOrders() {
  const q = query(
    collectionGroup(db, 'orders'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

**Transactions and batched writes:**

```javascript
// Transaction: transfer inventory between warehouses
async function transferInventory(fromId, toId, quantity) {
  await runTransaction(db, async (transaction) => {
    const fromRef = doc(db, 'warehouses', fromId);
    const toRef = doc(db, 'warehouses', toId);
    const fromSnap = await transaction.get(fromRef);
    const toSnap = await transaction.get(toRef);

    if (fromSnap.data().inventory < quantity) {
      throw new Error('Insufficient inventory');
    }

    transaction.update(fromRef, {
      inventory: fromSnap.data().inventory - quantity
    });
    transaction.update(toRef, {
      inventory: toSnap.data().inventory + quantity
    });
  });
}

// Batched write: create order with multiple items
async function createOrder(userId, items) {
  const batch = writeBatch(db);

  const orderRef = doc(collection(db, 'users', userId, 'orders'));
  batch.set(orderRef, {
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: 'pending',
    items: items,
    createdAt: serverTimestamp(),
  });

  // Update inventory for each product
  for (const item of items) {
    const productRef = doc(db, 'products', item.productId);
    batch.update(productRef, {
      inventory: increment(-item.quantity)
    });
  }

  await batch.commit();
  return orderRef.id;
}
```

**Real-time listeners:**

```javascript
// Listen to document changes
function subscribeToOrder(userId, orderId, callback) {
  return onSnapshot(
    doc(db, 'users', userId, 'orders', orderId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (error) => {
      console.error('Listener error:', error);
    }
  );
}

// Listen to query results
function subscribeToProducts(category, callback) {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges().map(change => ({
      type: change.type,  // 'added', 'modified', 'removed'
      doc: { id: change.doc.id, ...change.doc.data() },
    }));
    callback(changes);
  });
}
```

### Step 7: TTL policies and data management

```bash
# Create TTL policy for automatic document deletion
gcloud firestore fields ttls update expiresAt \
  --collection-group=sessions \
  --enable-ttl

# Export data for backup
gcloud firestore export gs://my-backup-bucket/firestore-backup \
  --collection-ids=users,products

# Import data
gcloud firestore import gs://my-backup-bucket/firestore-backup
```

### Step 8: Firestore bundles for CDN caching

```javascript
const { getFirestore } = require('firebase-admin/firestore');

async function buildBundle() {
  const db = getFirestore();
  const bundle = db.bundle('featured-products');

  const featuredQuery = db.collection('products')
    .where('featured', '==', true)
    .orderBy('price', 'asc')
    .limit(50);

  const snapshot = await featuredQuery.get();

  const bundleBuffer = bundle
    .add('featured-products-query', featuredQuery)
    .build();

  // Serve via CDN or Cloud Storage
  return bundleBuffer;
}
```

### Step 9: Server-side (Admin SDK) patterns

```javascript
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Bulk operations with BulkWriter
async function bulkUpdate(updates) {
  const bulkWriter = db.bulkWriter();

  bulkWriter.onWriteError((error) => {
    if (error.failedAttempts < 3) return true;  // Retry
    console.error('Write failed:', error.documentRef.path);
    return false;
  });

  for (const { id, data } of updates) {
    bulkWriter.update(db.doc(`products/${id}`), {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await bulkWriter.close();
}

// Recursive delete
async function deleteCollection(collectionPath, batchSize = 500) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}
```

### Best practices

- **Use subcollections** for large, growing lists (orders, comments) instead of arrays
- **Denormalize data** for read-heavy access patterns; keep writes manageable
- **Use server timestamps** (`serverTimestamp()`) instead of client-generated timestamps
- **Implement security rules** that validate data shape, not just authentication
- **Use transactions** for operations that require reading before writing
- **Set up composite indexes** proactively based on known query patterns
- **Enable offline persistence** for mobile/web apps that need offline support
- **Use collection group queries** cautiously; they require collection-group-scoped indexes
- **Implement pagination** with cursors (`startAfter`) for large result sets
- **Use BulkWriter** on the server side for batch operations (better than batched writes for large sets)

### Anti-patterns to avoid

- Storing large blobs or files in documents (use Cloud Storage with references)
- Deeply nested subcollections (max 100 levels, but keep shallow for simplicity)
- Unbounded array growth in documents (1MB document size limit)
- Reading entire collections when only a subset is needed
- Using offset-based pagination (wasteful; use cursor-based)
- Not handling security rules for subcollections separately from parent
- Relying on client-side filtering instead of server-side queries
- Creating overly permissive security rules (`allow read, write: if true`)

### Cost optimization

- **Minimize document reads** by denormalizing data (fewer reads per page load)
- **Use Firestore bundles** to serve pre-built query results via CDN
- **Set TTL policies** to auto-delete temporary documents (sessions, caches)
- **Use `select()` field masks** to read only needed fields (server-side)
- **Avoid unnecessary real-time listeners** that keep connections open
- **Export data to BigQuery** for analytics instead of running expensive queries
- **Use collection group indexes sparingly** (indexed across all matching subcollections)
- **Monitor usage** in Firebase Console and set budget alerts
