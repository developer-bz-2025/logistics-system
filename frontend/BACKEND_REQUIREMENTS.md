# Backend Requirements for Assets Module

## Overview
The frontend assets module requires the following backend endpoints to support category-based filtering and asset management.

## Required API Endpoints

### 1. Get All Categories
**Endpoint:** `GET /api/categories`

**Description:** Fetch all categories to display in the sidebar

**Response Format:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Vehicles"
    },
    {
      "id": 2,
      "name": "Equipment"
    }
  ]
}
```

**Alternative Response Format (also supported):**
```json
[
  { "id": 1, "name": "Vehicles" },
  { "id": 2, "name": "Equipment" }
]
```

---

### 2. Get Subcategories by Category ID
**Endpoint:** `GET /api/categories/{categoryId}/sub-categories`

**Description:** Fetch subcategories for a specific category when user selects a category

**Path Parameters:**
- `categoryId` (number): The ID of the selected category

**Response Format:**
```json
{
  "data": [
    {
      "id": 10,
      "name": "Cars",
      "category_id": 1
    },
    {
      "id": 11,
      "name": "Trucks",
      "category_id": 1
    }
  ]
}
```

**Alternative Response Format (also supported):**
```json
[
  { "id": 10, "name": "Cars", "category_id": 1 },
  { "id": 11, "name": "Trucks", "category_id": 1 }
]
```

---

### 3. Get Fixed Items by Subcategory ID
**Endpoint:** `GET /api/sub-categories/{subCategoryId}/fixed-items`

**Description:** Fetch fixed items for a specific subcategory when user selects a subcategory

**Path Parameters:**
- `subCategoryId` (number): The ID of the selected subcategory

**Response Format:**
```json
{
  "data": [
    {
      "id": 100,
      "name": "Toyota Camry",
      "sub_category_id": 10
    },
    {
      "id": 101,
      "name": "Honda Accord",
      "sub_category_id": 10
    }
  ]
}
```

**Alternative Response Format (also supported):**
```json
[
  { "id": 100, "name": "Toyota Camry", "sub_category_id": 10 },
  { "id": 101, "name": "Honda Accord", "sub_category_id": 10 }
]
```

---

### 4. List Assets with Filters
**Endpoint:** `GET /api/assets`

**Description:** Get paginated list of assets with optional filtering

**Query Parameters:**
- `page` (number, optional): Page number (1-based), default: 1
- `pageSize` (number, optional): Number of items per page, default: 10
- `search` (string, optional): Search term for code, item name, status, etc.
- `category_id` (number, optional): Filter by category ID
- `sub_category_id` (number, optional): Filter by subcategory ID
- `fixed_item_id` (number, optional): Filter by fixed item ID
- `status` (string, optional): Filter by status
- `location` (string, optional): Filter by location
- `sort` (string, optional): Field to sort by (e.g., 'created_at', 'code', 'item_name', 'status_name')
- `dir` (string, optional): Sort direction ('asc' or 'desc'), default: 'desc'

**Example Request:**
```
GET /api/assets?category_id=1&sub_category_id=10&page=1&pageSize=10&sort=created_at&dir=desc
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 1001,
      "code": "VH-001",
      "fixed_item_id": 100,
      "item_name": "Toyota Camry",
      "category_name": "Vehicles",
      "sub_category_name": "Cars",
      "status_name": "Active",
      "location_name": "Warehouse A",
      "created_at": "2024-10-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 10
}
```

**Backend Logic:**
- When `category_id` is provided, filter assets by category
- When `sub_category_id` is provided, filter assets by subcategory (and implicitly by category)
- When `fixed_item_id` is provided, filter assets by fixed item (and implicitly by subcategory and category)
- All filters should work together (AND logic)
- The `search` parameter should search across: code, item_name, status_name, location_name
- Include joins to get category_name, sub_category_name from related tables

---

### 5. Get Available Statuses
**Endpoint:** `GET /api/assets/statuses`

**Description:** Get list of distinct statuses available for assets (for dropdown filter)

**Response Format:**
```json
{
  "data": ["Active", "Inactive", "Under Maintenance", "Retired"]
}
```

**Alternative Response Format (also supported):**
```json
["Active", "Inactive", "Under Maintenance", "Retired"]
```

**Backend Logic:**
- Return distinct status values from the assets or asset_statuses table
- Only return statuses that are actually used in the assets

---

### 6. Get Available Locations
**Endpoint:** `GET /api/assets/locations`

**Description:** Get list of distinct locations available for assets (for dropdown filter)

**Response Format:**
```json
{
  "data": ["Warehouse A", "Warehouse B", "Head Office", "Branch 1"]
}
```

**Alternative Response Format (also supported):**
```json
["Warehouse A", "Warehouse B", "Head Office", "Branch 1"]
```

**Backend Logic:**
- Return distinct location values from the assets or locations table
- Only return locations that are actually used in the assets

---

## Database Schema Suggestions

### Categories Table
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sub-Categories Table
```sql
CREATE TABLE sub_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Fixed Items Table
```sql
CREATE TABLE fixed_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sub_category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
);
```

### Assets Table
```sql
CREATE TABLE assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) UNIQUE,  -- Asset tag/code
  fixed_item_id INT NOT NULL,
  status_name VARCHAR(100),
  location_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fixed_item_id) REFERENCES fixed_items(id)
);
```

---

## Data Flow

1. **User opens the assets page:**
   - Frontend loads all categories via `GET /api/categories`
   - Categories are displayed in both the sidebar AND the filters section

2. **User clicks a category in the sidebar:**
   - Frontend navigates to `/assets?category_id=1`
   - Frontend automatically fetches subcategories via `GET /api/categories/1/sub-categories`
   - Subcategories populate the subcategory dropdown
   - Assets are filtered and fetched via `GET /api/assets?category_id=1`

3. **User selects a subcategory from the dropdown:**
   - Frontend fetches fixed items via `GET /api/sub-categories/10/fixed-items`
   - Fixed items populate the fixed items dropdown
   - Assets are filtered and fetched via `GET /api/assets?category_id=1&sub_category_id=10`

4. **User selects a fixed item:**
   - Assets are filtered via `GET /api/assets?category_id=1&sub_category_id=10&fixed_item_id=100`

5. **User applies additional filters (status, location, search):**
   - All filters combine: `GET /api/assets?category_id=1&status=Active&location=Warehouse%20A&search=VH`

---

## Important Notes

1. **Response Format Flexibility:** The frontend handles both `{ data: [...] }` and direct array `[...]` formats

2. **Pagination:** Use 1-based page numbers (page=1 is the first page)

3. **Filtering Logic:** 
   - Filters should use AND logic (all conditions must match)
   - The hierarchy is: Category → Subcategory → Fixed Item
   - When filtering by fixed_item_id, the backend should automatically include the related category and subcategory information

4. **Performance Optimization:**
   - Use database indexes on foreign keys (category_id, sub_category_id, fixed_item_id)
   - Index commonly filtered fields (status_name, location_name, code)
   - Use proper JOIN queries to fetch related data efficiently

5. **CORS:** Ensure CORS is properly configured to allow requests from the frontend origin

6. **Authentication:** All endpoints should require authentication (JWT token in Authorization header)

---

## Testing Checklist

- [ ] Categories load in sidebar
- [ ] Clicking a category in sidebar navigates to assets page with category filter
- [ ] Subcategories populate when category is selected
- [ ] Fixed items populate when subcategory is selected
- [ ] Assets list updates when any filter changes
- [ ] Pagination works correctly
- [ ] Search functionality works across code, item name, status, location
- [ ] Status dropdown shows only used statuses
- [ ] Location dropdown shows only used locations
- [ ] Multiple filters can be combined
- [ ] Sorting works for all sortable columns

---

## Sample Backend Implementation (Laravel/PHP Example)

```php
// Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}/sub-categories', [CategoryController::class, 'subCategories']);
    Route::get('/sub-categories/{id}/fixed-items', [SubCategoryController::class, 'fixedItems']);
    
    Route::get('/assets', [AssetController::class, 'index']);
    Route::get('/assets/statuses', [AssetController::class, 'statuses']);
    Route::get('/assets/locations', [AssetController::class, 'locations']);
});

// AssetController
public function index(Request $request)
{
    $query = Asset::query()
        ->join('fixed_items', 'assets.fixed_item_id', '=', 'fixed_items.id')
        ->join('sub_categories', 'fixed_items.sub_category_id', '=', 'sub_categories.id')
        ->join('categories', 'sub_categories.category_id', '=', 'categories.id')
        ->select(
            'assets.*',
            'fixed_items.name as item_name',
            'categories.name as category_name',
            'sub_categories.name as sub_category_name'
        );

    // Apply filters
    if ($request->has('category_id')) {
        $query->where('categories.id', $request->category_id);
    }
    
    if ($request->has('sub_category_id')) {
        $query->where('sub_categories.id', $request->sub_category_id);
    }
    
    if ($request->has('fixed_item_id')) {
        $query->where('assets.fixed_item_id', $request->fixed_item_id);
    }
    
    if ($request->has('status')) {
        $query->where('assets.status_name', $request->status);
    }
    
    if ($request->has('location')) {
        $query->where('assets.location_name', $request->location);
    }
    
    if ($request->has('search')) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('assets.code', 'like', "%{$search}%")
              ->orWhere('fixed_items.name', 'like', "%{$search}%")
              ->orWhere('assets.status_name', 'like', "%{$search}%")
              ->orWhere('assets.location_name', 'like', "%{$search}%");
        });
    }

    // Apply sorting
    $sortField = $request->get('sort', 'assets.created_at');
    $sortDir = $request->get('dir', 'desc');
    $query->orderBy($sortField, $sortDir);

    // Paginate
    $pageSize = $request->get('pageSize', 10);
    $result = $query->paginate($pageSize);

    return response()->json([
        'data' => $result->items(),
        'total' => $result->total(),
        'page' => $result->currentPage(),
        'pageSize' => $result->perPage()
    ]);
}

public function statuses()
{
    $statuses = Asset::whereNotNull('status_name')
        ->distinct()
        ->pluck('status_name')
        ->values();
    
    return response()->json(['data' => $statuses]);
}

public function locations()
{
    $locations = Asset::whereNotNull('location_name')
        ->distinct()
        ->pluck('location_name')
        ->values();
    
    return response()->json(['data' => $locations]);
}
