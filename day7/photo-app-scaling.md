 # SnapShare Photo App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed of photos posted by people they follow.

The following assumptions are used:

- Registered users: 10 million.
- Daily active users: 10% of registered users.
- Each active user uploads one photo per day.
- Each active user views 50 feed pages per day.
- Each original photo is 2 MB.
- Each photo has one thumbnail of 50 KB.
- One day has 86,400 seconds, and one year has 365 days.
- Storage estimates use decimal units: 1 TB = 1,000,000 MB.
- Traffic is distributed across the day for average-rate calculations. Peak feed traffic is five times the average.
- All uploaded photos are retained for the year, and every upload produces one thumbnail.

## 2. Traffic and Storage Calculations

### Daily Active Users

Daily active users = Registered users × Daily activity rate

= 10,000,000 × 0.10

= **1,000,000 daily active users**

### Uploads per Second

Daily uploads = 1,000,000 users × 1 photo

= 1,000,000 uploads per day

Average uploads per second = 1,000,000 ÷ 86,400

= **11.57 uploads per second**

### Feed Views per Second

Daily feed views = 1,000,000 users × 50 pages

= 50,000,000 feed views per day

Average feed views per second = 50,000,000 ÷ 86,400

= **578.70 feed views per second**

Peak feed views per second = 578.70 × 5

= **Approximately 2,894 feed views per second**

### Photo Storage per Year

Original photos per year:

1,000,000 × 2 MB × 365 = 730,000,000 MB = **730 TB**

Thumbnails per year:

1,000,000 × 0.05 MB × 365 = 18,250,000 MB = **18.25 TB**

Total new photo storage per year:

730 TB + 18.25 TB = **748.25 TB per year**

This estimate excludes backups, replicas, metadata, and storage overhead.

## 3. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system** because users view 50 feed pages per day but upload only one photo per day. Feed views greatly outnumber photo uploads, so the architecture must handle many more reads than writes.

The design should use a CDN to serve photos and thumbnails, a cache to reduce repeated database queries, and a database read replica to distribute read traffic. Load balancing and multiple application servers help handle incoming requests and traffic spikes.

## 4. Why Photos Should Not Be Stored Inside the Database

Photos should not be stored directly inside the database because large binary files consume significant database space, increase backup and recovery times, and make database scaling more expensive.

Instead, original photos and thumbnails should be stored in **object storage**, while the database stores their URLs or object keys and associated metadata, such as the uploader, upload time, caption, and access permissions. A CDN can deliver the images efficiently to users around the world.

## 5. Architecture Diagram

```text
                        USERS
                          |
                          v
                 +------------------+
                 |       CDN        |
                 | Cached images    |
                 +------------------+
                          |
                          v
                 +------------------+
                 |  Load Balancer   |
                 +------------------+
                          |
             +------------+------------+
             |            |            |
             v            v            v
        +----------+ +----------+ +----------+
        | App      | | App      | | App      |
        | Server 1 | | Server 2 | | Server 3 |
        +----------+ +----------+ +----------+
             |            |            |
             +------------+------------+
                          |
             +------------+-------------+
             |                          |
             v                          v
      +---------------+        +------------------+
      | Cache         |        | Primary Database |
      | Feed/metadata |        | Users and posts  |
      +---------------+        +------------------+
                                          |
                                          v
                                 +------------------+
                                 | Database Read    |
                                 | Replica          |
                                 +------------------+

        UPLOAD AND THUMBNAIL PROCESSING

        App Server
             |
             v
      +------------------+
      | Object Storage   |
      | Original photos  |
      | and thumbnails   |
      +------------------+
             ^
             |
      +------------------+       +------------------+
      | Message Queue    | ----> | Thumbnail Worker |
      | Thumbnail jobs   |       | Creates previews |
      +------------------+       +------------------+
                                          |
                                          v
                                  +------------------+
                                  | Object Storage   |
                                  | Saves thumbnail  |
                                  +------------------+
```

## 6. What Each Component Does

- **CDN:** Serves cached photos and thumbnails close to users, reducing latency and the load on application servers and object storage.
- **Load balancer:** Distributes incoming requests across application servers to prevent one server from becoming overloaded.
- **Application servers:** Handle business logic, authenticate users, process uploads, and generate feed responses.
- **Cache:** Stores frequently accessed feed data and metadata to reduce repeated database queries.
- **Primary database:** Stores user accounts, posts, captions, relationships, and image object keys.
- **Database read replica:** Handles read queries to reduce pressure on the primary database.
- **Object storage:** Stores original photo files and thumbnails without filling the database with large binary files.
- **Message queue:** Holds thumbnail-generation jobs so image processing can happen asynchronously.
- **Thumbnail worker:** Processes queued jobs, generates smaller image versions, and saves the thumbnails to object storage.

## 7. Photo Upload Flow

1. A user selects a photo and submits it through the application.
2. An application server authenticates the user and validates the file type, file size, and upload permissions.
3. The original photo is uploaded to object storage, where it receives a unique object key.
4. The application saves the post information and original photo object key in the primary database.
5. The application publishes a thumbnail-generation job to the message queue.
6. The server confirms that the original upload has been accepted, without waiting for thumbnail processing to finish.
7. A thumbnail worker retrieves the job from the queue and downloads or reads the original photo from object storage.
8. The worker generates a 50 KB thumbnail and uploads it to object storage.
9. The worker updates the post metadata to indicate that the thumbnail is ready.
10. When users view their feeds, the application retrieves post metadata and image references, while the CDN serves the original photos or thumbnails.

The worker should retry temporary failures, and failed jobs should eventually move to a dead-letter queue for investigation. The application should also avoid creating duplicate thumbnails when a job is retried.

## 8. Trade-Offs

### Trade-Off 1: Caching vs. Freshness

Caching reduces database load and improves response times, but users may briefly see outdated feed data after a new post is published. Cache invalidation or short expiration times can reduce this problem.

### Trade-Off 2: Asynchronous Thumbnails vs. Immediate Availability

Using a queue allows uploads to complete without waiting for thumbnail generation, improving responsiveness. However, thumbnails may not be available immediately, so the application must display a placeholder or the original image until processing finishes.

### Trade-Off 3: Read Replicas vs. Data Consistency

Read replicas improve read capacity, but replication delays may cause users to see stale data immediately after an upload. Critical reads can temporarily use the primary database when fresh data is required.

### Trade-Off 4: Object Storage and CDN vs. Cost and Complexity

Object storage and a CDN scale well for large image collections and reduce application-server load, but introduce additional storage, delivery, and operational costs. Appropriate caching policies and lifecycle rules can help control these expenses.

## 9. Conclusion

SnapShare requires a read-optimized architecture because feed views greatly outnumber uploads. With approximately 1 million daily active users, 11.57 average uploads per second, and 2,894 peak feed views per second, the system should distribute requests across application servers, use caching and read replicas, and store photos in object storage. A message queue and background worker allow thumbnails to be generated efficiently without slowing down the upload experience.

The estimated new storage requirement is approximately 748.25 TB per year for original photos and thumbnails alone.
