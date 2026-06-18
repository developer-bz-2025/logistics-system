# External API Documentation - Donor Data Export

**Base URL:** `https://logistic-backend.bzassets.org/api`

**Version:** v1

---

## Authentication

All external API requests must include a valid API key in the `X-API-Key` header.

| Header     | Value              |
|------------|--------------------|
| X-API-Key  | `<your-api-key>`   |

Requests without a valid key receive a `401 Unauthorized` response:

```json
{
  "message": "Invalid API key."
}
```

### Rate Limiting

External API endpoints are rate-limited to **60 requests per minute**. Exceeding this limit returns a `429 Too Many Requests` response.

---

## Endpoints

### 1. List All Donors

Retrieves all donors with their associated finance officer and location data.

**URL:** `GET /api/v1/external/donors`

**Query Parameters:**

| Parameter       | Type   | Required | Description                                                                 |
|-----------------|--------|----------|-----------------------------------------------------------------------------|
| `updated_since` | string | No       | ISO 8601 datetime (e.g. `2026-05-12T00:00:00`). Returns only donors updated on or after this timestamp. Useful for incremental sync. |

**Request Example:**

```
GET /api/v1/external/donors?updated_since=2026-05-01T00:00:00
X-API-Key: <your-api-key>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "account_no": "ACC-001",
      "department_name": "education",
      "donor": "UNICEF",
      "end_date": "2027-12-31",
      "notes": "Education funding for northern region",
      "finance_officer_id": 213,
      "finance_officer_name": "Rami Bader",
      "finance_officer_email": "rami@example.org",
      "locations": [
        { "id": 1, "name": "Beirut Office" },
        { "id": 3, "name": "Tripoli Office" }
      ],
      "created_at": "2026-02-15T10:30:00+00:00",
      "updated_at": "2026-05-10T14:22:00+00:00"
    }
  ],
  "count": 1
}
```

**Response Fields:**

| Field                  | Type         | Description                                                                                       |
|------------------------|--------------|---------------------------------------------------------------------------------------------------|
| `id`                   | integer      | Unique donor ID.                                                                                  |
| `account_no`           | string/null  | Financial account number.                                                                         |
| `department_name`      | string/null  | One of: `education`, `protection`, `FSL`, `peace_building`, `advocacy_research`, `support_community`, `basic_assistance_emergency`, `capacity_building_admin_support`. |
| `donor`                | string       | Donor name.                                                                                       |
| `end_date`             | string/null  | Grant/funding end date in `YYYY-MM-DD` format.                                                    |
| `notes`                | string/null  | Free-text notes.                                                                                  |
| `finance_officer_id`   | integer/null | ID of the assigned finance officer.                                                               |
| `finance_officer_name` | string/null  | Full name of the finance officer.                                                                 |
| `finance_officer_email`| string/null  | Email of the finance officer.                                                                     |
| `locations`            | array        | List of associated areas/locations, each with `id` (integer) and `name` (string).                 |
| `created_at`           | string       | ISO 8601 creation timestamp.                                                                      |
| `updated_at`           | string       | ISO 8601 last-update timestamp.                                                                   |
| `count`                | integer      | Total number of donors in the response (top-level field).                                         |

---

### 2. Get Single Donor

Retrieves a single donor by its ID, including finance officer and location data.

**URL:** `GET /api/v1/external/donors/{id}`

**Path Parameters:**

| Parameter | Type    | Required | Description        |
|-----------|---------|----------|--------------------|
| `id`      | integer | Yes      | The donor's ID.    |

**Request Example:**

```
GET /api/v1/external/donors/1
X-API-Key: <your-api-key>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "account_no": "ACC-001",
    "department_name": "education",
    "donor": "UNICEF",
    "end_date": "2027-12-31",
    "notes": "Education funding for northern region",
    "finance_officer_id": 213,
    "finance_officer_name": "Rami Bader",
    "finance_officer_email": "rami@example.org",
    "locations": [
      { "id": 1, "name": "Beirut Office" },
      { "id": 3, "name": "Tripoli Office" }
    ],
    "created_at": "2026-02-15T10:30:00+00:00",
    "updated_at": "2026-05-10T14:22:00+00:00"
  }
}
```

**Response (404 Not Found):**

Returned when the donor ID does not exist.

```json
{
  "message": "No query results for model [App\\Models\\Donor] 999"
}
```

---

## Error Responses

| HTTP Code | Meaning               | When                                          |
|-----------|-----------------------|-----------------------------------------------|
| 401       | Unauthorized          | Missing or invalid `X-API-Key` header.        |
| 404       | Not Found             | Donor ID does not exist (single donor endpoint). |
| 422       | Unprocessable Entity  | Invalid `updated_since` value (not a valid date). |
| 429       | Too Many Requests     | Rate limit exceeded (60 requests/minute).     |
| 500       | Internal Server Error | Unexpected server error.                      |

---

## Integration Guide

### Initial Full Sync
 
Fetch all donors without any filters:

```bash
curl -H "X-API-Key: <your-api-key>" \
  https://logistic-backend.bzassets.org/api/v1/external/donors
```

Store all returned donors in your local database and record the current timestamp.

### Incremental Sync

On subsequent calls, pass the timestamp of your last sync to only retrieve donors that have changed:

```bash
curl -H "X-API-Key: <your-api-key>" \
  "https://logistic-backend.bzassets.org/api/v1/external/donors?updated_since=2026-05-12T00:00:00"
```

Use the `id` field to match existing records in your local database (upsert pattern).

### Recommended Sync Frequency

For most use cases, syncing once every **15-30 minutes** via a scheduled job (cron) is sufficient. Adjust based on how frequently donor data changes.
