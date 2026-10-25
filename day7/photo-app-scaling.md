# SnapShare Photo App Scaling Plan

## 1. Assumptions

This plan uses the following starting facts and additional assumptions:

- Registered users: 10,000,000.
- Daily active users (DAU): 10% of registered users = 1,000,000 users per day.
- Each daily active user uploads 1 original photo per day.
- Each daily active user views 50 feed pages per day.
- Average original photo size: 2 MB.
- Each photo also has one thumbnail of 50 KB.
- One feed page request is counted as one feed view; it may contain several posts and images.
- A year is estimated as 365 days.
- The calculations below use average daily traffic, not peak traffic. The design should allow extra capacity for traffic spikes.
- Every uploaded photo is retained for the full year. Storage estimates exclude backups, replicas, logs, and other metadata.
- For decimal storage units, 1 GB = 1,000 MB and 1 TB = 1,000 GB.
- Thumbnail generation happens asynchronously after the original photo has been stored.

## 2. Traffic and storage estimates

### Daily uploads

There are 1,000,000 daily active users, and each uploads one photo per day:

- Uploads per day = 1,000,000 × 1 = **1,000,000 photos/day**
- Average uploads per second = 1,000,000 ÷ 86,400 = **about 11.6 uploads/second**

### Feed views

Each daily active user views 50 feed pages per day:

- Feed views per day = 1,000,000 × 50 = **50,000,000 feed views/day**
- Average feed views per second = 50,000,000 ÷ 86,400 = **about 579 feed views/second**

This is the rate of feed-page requests, not the number of individual photos displayed. Peak traffic may be several times higher than these averages, so monitoring and load testing are needed to choose safe capacity.

### Storage

Each photo creates an original file of 2 MB and a thumbnail of 50 KB (0.05 MB):

- Storage per photo = 2 MB + 0.05 MB = **2.05 MB**
- New storage per day = 1,000,000 × 2.05 MB = **2,050,000 MB**, or about **2.05 TB/day**
- New storage per year = 2.05 TB × 365 = **748.25 TB/year**

Therefore, SnapShare needs approximately **748.25 TB of additional photo-file storage per year**, before backups, replicas, metadata, and other overhead. This assumes all originals and thumbnails are retained for the year.

## 3. Is SnapShare read-heavy or write-heavy?

SnapShare is **read-heavy** based on these assumptions. It receives about 579 feed-page requests per second on average, compared with about 11.6 photo uploads per second—roughly 50 feed views for every upload. Feed reads and image delivery therefore need strong caching and efficient delivery, while the upload path needs reliable storage and asynchronous thumbnail processing.

## 4. why photos should not be stored inside the database, and where they should go instead.
Photos should not be stored directly in the database because they are large files that can slow down queries, backups, and database performance. Instead, they should be stored in object storage, such as Amazon S3 or Azure Blob Storage, while the database stores photo metadata and the storage reference. A CDN can then deliver photos quickly to users, improving performance and scalability.

## 5. Architecture diagram

```text
                         +----------------------+
                         |    Users / Clients   |
                         +----------+-----------+
                                    |
                    +---------------+----------------+
                    |                                |
                    v                                v
          +-------------------+            +-------------------+
          |        CDN        |            |   Load Balancer   |
          | Cached thumbnails |            | Routes API traffic|
          | and photo files   |            +---------+---------+
          +---------+---------+                      |
                    |                                v
                    |                    +-------------------------+
                    |                    |      App Servers        |
                    |                    | Upload API and Feed API |
                    |                    +--+----------+---------+-+
                    |                       |          |         |
                    |                       |          |         |
                    |                       v          v         v
                    |                 +---------+  +--------+  +----------------+
                    |                 |  Cache  |  | Queue  |  |   Database     |
                    |                 | Hot feed|  | Upload |  | Primary        |
                    |                 | data    |  | events |  | + Read Replica |
                    |                 +---------+  +---+----+  +----------------+
                    |                                   |               ^
                    |                                   v               |
                    |                            +---------------+      |
                    |                            | Thumbnail     |      |
                    |                            | Worker        |      |
                    |                            +-------+-------+      |
                    |                                    |              |
                    v                                    v              |
          +-------------------+                 +----------------+      |
          |  Object Storage   |<----------------| Reads original |      |
          | Original photos   |                 | and writes     |      |
          | and thumbnails    |                 | thumbnails     |      |
          +-------------------+                 +----------------+      |
                                                                         |
                                      Feed metadata reads can use -------+
                                      the database read replica.
```

**Diagram note:** The CDN serves cached image files from object storage. API requests go through the load balancer to app servers. The app servers use the cache for frequently requested feed data and the database for durable metadata. The queue sends thumbnail jobs to workers, which read originals from object storage and write generated thumbnails back to object storage. The database read replica serves eligible read queries copied from the primary database; writes go to the primary.

## 6. What problem each component solves

- **CDN:** Delivers cached photos and thumbnails from locations closer to users, reducing image latency and load on object storage.
- **Load balancer:** Distributes API requests across healthy app-server instances so one server does not handle all traffic.
- **App servers:** Run the upload and feed APIs, validate requests, enforce permissions, and coordinate storage and database operations.
- **Cache:** Keeps frequently requested feed data or post metadata in fast memory, reducing repeated database reads and improving response time.
- **Primary database:** Stores durable structured data such as users, follows, captions, photo IDs, timestamps, and object-storage keys.
- **Database read replica:** Handles eligible read queries to reduce load on the primary database; replication lag means very recent changes may not appear immediately on replica-backed reads.
- **Object storage:** Stores large original image files and generated thumbnails without putting the image bytes directly in the relational database.
- **Queue:** Holds thumbnail-generation jobs so upload requests do not have to wait for image processing and jobs can be retried if a worker fails.
- **Thumbnail worker:** Processes queued jobs, creates appropriately sized thumbnails, and stores them in object storage for faster feed loading.

## 7. Step-by-step photo upload flow

1. **User selects a photo.** The client checks basic file constraints, while the server remains responsible for validating file type, size, and permissions.
2. **Client requests an upload.** The app server authenticates the user and authorizes the upload. It can issue a short-lived, restricted upload URL so the client can send the file directly to object storage.
3. **Original photo is uploaded.** The client uploads the original file to object storage. This avoids routing large image bytes through every app server.
4. **Upload is confirmed.** The client or storage event notifies the backend that the upload completed. The backend verifies the object exists and records photo metadata in the primary database.
5. **Thumbnail job is queued.** The backend publishes a job containing the photo ID and storage key to the queue. The upload can be acknowledged without waiting for thumbnail generation.
6. **Worker processes the job.** A thumbnail worker reads the original image, validates/processes it, creates a 50 KB thumbnail (or a suitably sized version), and stores it in object storage.
7. **Metadata is updated.** The worker or backend marks thumbnail processing as complete in the database. Failed jobs can be retried, and processing should be idempotent so a retry does not create inconsistent records.
8. **Photo appears in feeds.** The feed API returns post metadata and image URLs for posts from followed users. The CDN delivers the thumbnail or photo file, while the cache can serve hot feed data. If the feed is read before thumbnail processing finishes, the app can temporarily show a placeholder or the original image.

## 8. Trade-offs

### Trade-off 1: CDN and caching vs. freshness and invalidation

Caching images and feed data reduces latency, bandwidth costs, and database load. However, cached feed results may be stale after a new upload, deletion, or privacy change. SnapShare must use suitable cache lifetimes and invalidation rules, and sensitive authorization checks must not rely solely on cached data.

### Trade-off 2: Asynchronous thumbnail generation vs. immediate availability

Using a queue and workers makes uploads faster and allows thumbnail processing to scale independently. However, thumbnails are not available immediately, and the queue introduces operational complexity, retries, monitoring, and possible processing delays. The interface should handle a pending-thumbnail state.

### Trade-off 3: Read replica vs. perfectly fresh reads

A read replica reduces pressure on the primary database and helps serve many feed requests. However, replication lag can cause a newly uploaded photo or updated metadata to be temporarily missing from replica-backed results. Reads that require immediate consistency can be routed to the primary database.

### Trade-off 4: Direct-to-object-storage uploads vs. simpler server-side uploads

Direct uploads reduce app-server bandwidth and are easier to scale for large files. However, they require secure, short-lived upload permissions, validation after upload, and cleanup of abandoned or invalid files. A server-proxied upload flow is simpler initially but can become a bandwidth and capacity bottleneck.

## 9. Summary

SnapShare is read-heavy: the estimated average is about 579 feed-page requests per second and 11.6 uploads per second. It adds approximately 748.25 TB of original-photo and thumbnail storage each year under the stated retention assumptions. A CDN, cache, load balancer, horizontally scalable app servers, a primary database with a read replica, object storage, and a queue-driven thumbnail worker help the system scale while balancing speed, reliability, consistency, and cost.