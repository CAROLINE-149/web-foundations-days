
# Library Books REST API

## Overview

This API allows clients to manage books in a library. The resource is
`/api/books`, and each book has an ID, title, author, publication year,
and ISBN.

Base URL: `https://example.com/api`

## Endpoints

### 1. List all books

- **Method:** GET
- **Path:** `/api/books`
- **Description:** Retrieves a list of all books in the library.
- **Success status:** `200 OK`
- **Example request body:** Not required.

### 2. Get one book

- **Method:** GET
- **Path:** `/api/books/:id`
- **Description:** Retrieves a single book using its ID.
- **Success status:** `200 OK`
- **Example request body:** Not required.

Example: `GET /api/books/5`

### 3. Create a book

- **Method:** POST
- **Path:** `/api/books`
- **Description:** Adds a new book to the library.
- **Success status:** `201 Created`
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publicationYear": 1958,
  "isbn": "9780385474542"
}
```

### 4. Update a book

- **Method:** PUT
- **Path:** `/api/books/:id`
- **Description:** Replaces the details of an existing book.
- **Success status:** `200 OK`
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publicationYear": 1958,
  "isbn": "9780385474542"
}
```

### 5. Delete a book

- **Method:** DELETE
- **Path:** `/api/books/:id`
- **Description:** Deletes a book using its ID.
- **Success status:** `204 No Content`
- **Example request body:** Not required.

### 6. List books by author

- **Method:** GET
- **Path:** `/api/books?author=Chinua%20Achebe`
- **Description:** Retrieves books written by the specified author.
- **Success status:** `200 OK`
- **Example request body:** Not required.

The author is supplied as a query parameter rather than a path parameter.

## Error Codes

### 400 Bad Request

Returned when the request contains invalid data or fails validation.

Example: A client attempts to create a book without the required title
or author fields.

### 404 Not Found

Returned when the requested book does not exist.

Example: A client requests `GET /api/books/9999`, but no book with
ID `9999` exists.

## Notes

- `GET` retrieves resources.
- `POST` creates a resource.
- `PUT` replaces an existing resource.
- `DELETE` removes a resource.
- `200 OK` indicates a successful request.
- `201 Created` indicates that a resource was created.
- `204 No Content` indicates successful deletion with no response body.
- `400 Bad Request` indicates invalid input.
- `404 Not Found` indicates that a requested resource does not exist.
