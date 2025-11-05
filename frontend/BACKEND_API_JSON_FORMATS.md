# Backend API - Expected JSON Formats

## Complete JSON Response Examples for Assets Module

Based on your items table structure:
```
id, fixed_item_id, description, sn, color_id, brand_id, pr_id, 
acquisition_cost, acquisition_date, warranty_start_date, warranty_end_date, 
budget_code, budget_donor, supplier_id, location_id, floor_id, status_id, 
notes, holder_user_id, created_by, created_at, updated_at
```

---

## 1. GET /api/categories

**Description:** Fetch all categories for sidebar

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "Furniture" },
    { "id": 2, "name": "Appliances" },
    { "id": 3, "name": "Machines" },
    { "id": 4, "name": "Vehicles" },
    { "id": 5, "name": "Electronics" },
    { "id": 6, "name": "IT Equipment" }
  ]
}
```

---

## 2. GET /api/categories/{categoryId}/sub-categories

**Description:** Fetch subcategories when category is selected

**Example:** GET /api/categories/1/sub-categories

**Response:**
```json
{
  "data": [
    { "id": 10, "name": "Chair", "category_id": 1 },
    { "id": 11, "name": "Desk", "category_id": 1 },
    { "id": 12, "name": "Cabinet", "category_id": 1 },
    { "id": 13, "name": "Table", "category_id": 1 }
  ]
}
```

---

## 3. GET /api/sub-categories/{subCategoryId}/fixed-items

**Description:** Fetch fixed items when subcategory is selected

**Example:** GET /api/sub-categories/10/fixed-items

**Response:**
```json
{
  "data": [
    { "id": 100, "name": "Fixed chair", "sub_category_id": 10 },
    { "id": 101, "name": "Rolling chair", "sub_category_id": 10 },
    { "id": 102, "name": "Executive chair", "sub_category_id": 10 }
  ]
}
```

---

## 4. GET /api/categories/{categoryId}/attributes

**Description:** Get dynamic attributes for a specific category (Material, Size, etc.)

**Example:** GET /api/categories/1/attributes

**Response:**
```json
{
  "data": [
    {
      "name": "Material",
      "field_name": "material_id",
      "type": "select",
      "options": [
        { "id": 1, "label": "Wood" },
        { "id": 2, "label": "Metal" },
        { "id": 3, "label": "Plastic" },
        { "id": 4, "label": "Aluminum&Stainless" }
      ]
    },
    {
      "name": "Size/Capacity",
      "field_name": "size",
      "type": "select",
      "options": [
        { "id": "small", "label": "small" },
        { "id": "medium", "label": "medium" },
        { "id": "large", "label": "large" },
        { "id": "Double", "label": "Double" }
      ]
    }
  ]
}
```

**Note:** Different categories can have different attributes:
- **Furniture:** Material, Size/Capacity
- **Vehicles:** Engine Type, Fuel Type, Year
- **Electronics:** Screen Size, Resolution, Connectivity
- **Appliances:** Energy Rating, Capacity

---

## 5. GET /api/items

**Description:** List items with filters and pagination

**Query Parameters:**
- `category_id` (number) - Filter by category
- `sub_category_id` (number) - Filter by subcategory
- `fixed_item_id` (number) - Filter by fixed item type
- `status_id` (number) - Filter by status
- `location_id` (number) - Filter by location
- `floor_id` (number) - Filter by floor
- `supplier_id` (number) - Filter by supplier
- `holder_user_id` (number) - Filter by holder
- `search` (string) - Search in sn, description
- Dynamic filters like `material_id`, `size`, etc.
- `page` (number) - Page number (1-based)
- `pageSize` (number) - Items per page
- `sort` (string) - Sort field
- `dir` (string) - Sort direction ('asc' or 'desc')

**Example Request:**
```
GET /api/items?category_id=1&sub_category_id=10&status_id=1&page=1&pageSize=10&sort=acquisition_date&dir=desc
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "sn": "FC-2024-001",
      "fixed_item_id": 100,
      "fixed_item_name": "Fixed chair",
      "description": "Office chair with adjustable height",
      "category_name": "Furniture",
      "sub_category_name": "Chair",
      "status_id": 1,
      "status_name": "In Use",
      "location_id": 2,
      "location_name": "HQ",
      "floor_id": 3,
      "floor_name": "2nd Floor",
      "supplier_id": 5,
      "supplier_name": "Bekaa Furniture",
      "brand_id": 10,
      "brand_name": "Fisher & Paykel",
      "color_id": 1,
      "color_name": "Black",
      "holder_user_id": 15,
      "holder_name": "John Doe",
      "acquisition_date": "2024-01-15",
      "acquisition_cost": 250.00,
      "warranty_start_date": "2024-01-15",
      "warranty_end_date": "2025-01-15",
      "budget_code": "DEPT-2024-001",
      "budget_donor": "Main Budget",
      "pr_id": 123,
      "notes": "Purchased for new employee",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "attributes": {
        "material_id": 2,
        "material_name": "Metal",
        "size": "medium"
      }
    },
    {
      "id": 2,
      "sn": "TC-2024-002",
      "fixed_item_id": 101,
      "fixed_item_name": "Rolling chair",
      "description": "Ergonomic rolling chair",
      "category_name": "Furniture",
      "sub_category_name": "Chair",
      "status_id": 2,
      "status_name": "In Storage",
      "location_id": 1,
      "location_name": "Bekaa",
      "floor_id": 1,
      "floor_name": "Ground Floor",
      "supplier_id": 5,
      "supplier_name": "Bekaa Furniture",
      "brand_id": 11,
      "brand_name": "Maytag",
      "color_id": null,
      "color_name": null,
      "holder_user_id": null,
      "holder_name": null,
      "acquisition_date": "2024-02-10",
      "acquisition_cost": 180.00,
      "warranty_start_date": null,
      "warranty_end_date": null,
      "budget_code": null,
      "budget_donor": null,
      "pr_id": null,
      "notes": null,
      "created_at": "2024-02-10T14:20:00Z",
      "updated_at": "2024-02-10T14:20:00Z",
      "attributes": {
        "material_id": 1,
        "material_name": "Wood",
        "size": "large"
      }
    },
    {
      "id": 3,
      "sn": "DSK-2024-003",
      "fixed_item_id": 102,
      "fixed_item_name": "Executive chair",
      "description": "Leather executive chair",
      "category_name": "Furniture",
      "sub_category_name": "Chair",
      "status_id": 3,
      "status_name": "Under Maintenance",
      "location_id": 2,
      "location_name": "HQ",
      "floor_id": 4,
      "floor_name": "3rd Floor",
      "supplier_id": 5,
      "supplier_name": "Bekaa Furniture",
      "brand_id": 12,
      "brand_name": "Whirlpool",
      "color_id": 3,
      "color_name": "Brown",
      "holder_user_id": 20,
      "holder_name": "Jane Smith",
      "acquisition_date": "2024-01-20",
      "acquisition_cost": 450.00,
      "warranty_start_date": "2024-01-20",
      "warranty_end_date": "2026-01-20",
      "budget_code": "EXEC-2024",
      "budget_donor": "Executive Budget",
      "pr_id": 125,
      "notes": "Requires cushion replacement",
      "created_at": "2024-01-20T09:15:00Z",
      "updated_at": "2024-03-15T11:45:00Z",
      "attributes": {
        "material_id": 2,
        "material_name": "Metal",
        "size": "Double"
      }
    }
  ],
  "total": 145,
  "page": 1,
  "pageSize": 10
}
```

**Important Notes:**
- The `attributes` object contains dynamic attributes specific to the category
- All foreign key IDs should include their corresponding names (e.g., `s tatus_id` + `status_name`)
- Null values are allowed for optional fields
- The backend should use JOINs to fetch related data efficiently

---

## 6. GET /api/statuses

**Description:** Get all available statuses

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "In Use" },
    { "id": 2, "name": "In Storage" },
    { "id": 3, "name": "Under Maintenance" },
    { "id": 4, "name": "Retired" },
    { "id": 5, "name": "Lost" },
    { "id": 6, "name": "Sold" }
  ]
}
```

---

## 7. GET /api/locations

**Description:** Get all available locations

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "Bekaa" },
    { "id": 2, "name": "HQ" },
    { "id": 3, "name": "Branch 1" },
    { "id": 4, "name": "Warehouse A" }
  ]
}
```

---

## 8. GET /api/floors

**Description:** Get all available floors

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "Ground Floor" },
    { "id": 2, "name": "1st Floor" },
    { "id": 3, "name": "2nd Floor" },
    { "id": 4, "name": "3rd Floor" },
    { "id": 5, "name": "Basement" }
  ]
}
```

---

## 9. GET /api/suppliers

**Description:** Get all suppliers

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "ABC Suppliers" },
    { "id": 2, "name": "XYZ Trading" },
    { "id": 3, "name": "Tech Solutions" },
    { "id": 4, "name": "Office Depot" },
    { "id": 5, "name": "Bekaa Furniture" }
  ]
}
```

---

## 10. GET /api/users

**Description:** Get all users (for holder filter)

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "John Doe", "email": "john@example.com" },
    { "id": 2, "name": "Jane Smith", "email": "jane@example.com" },
    { "id": 3, "name": "Bob Johnson", "email": "bob@example.com" }
  ]
}
```

---

## Database Relationships

```
categories
  ├── sub_categories
  │     └── fixed_items
  │           └── items (your assets)
  │                 ├── status (statuses table)
  │                 ├── location (locations table)
  │                 ├── floor (floors table)
  │                 ├── supplier (suppliers table)
  │                 ├── brand (brands table)
  │                 ├── color (colors table)
  │                 ├── holder_user (users table)
  │                 └── dynamic attributes (category-specific)
```

---

## Dynamic Attributes Implementation

Each category can have different attributes. Example tables:

### category_attributes table
```sql
CREATE TABLE category_attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,       -- e.g., "Material"
  field_name VARCHAR(100) NOT NULL, -- e.g., "material_id"
  type ENUM('select', 'text', 'number') DEFAULT 'select',
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### attribute_options table (for select type attributes)
```sql
CREATE TABLE attribute_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_attribute_id INT NOT NULL,
  value VARCHAR(100) NOT NULL,
  label VARCHAR(100) NOT NULL,
  FOREIGN KEY (category_attribute_id) REFERENCES category_attributes(id)
);
```

### item_attributes table (to store actual values)
```sql
CREATE TABLE item_attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  category_attribute_id INT NOT NULL,
  value VARCHAR(255),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (category_attribute_id) REFERENCES category_attributes(id)
);
```

**OR** you can add specific columns to the items table for common attributes:
```sql
ALTER TABLE items ADD COLUMN material_id INT NULL;
ALTER TABLE items ADD COLUMN size VARCHAR(50) NULL;
ALTER TABLE items ADD COLUMN capacity VARCHAR(50) NULL;
-- etc.
```

---

## Backend Filtering Logic

When `GET /api/items` is called with filters:

1. Start with base query joining all related tables
2. Apply category filter (from URL parameter)
3. Apply sub_category filter if provided
4. Apply fixed_item filter if provided
5. Apply standard filters (status_id, location_id, floor_id, supplier_id, holder_user_id)
6. Apply dynamic attribute filters (material_id, size, etc.)
7. Apply search filter (search in sn, description)
8. Apply sorting
9. Apply pagination
10. Return results with total count

**Example SQL (Laravel Eloquent):**
```php
$query = Item::query()
    ->join('fixed_items', 'items.fixed_item_id', '=', 'fixed_items.id')
    ->join('sub_categories', 'fixed_items.sub_category_id', '=', 'sub_categories.id')
    ->join('categories', 'sub_categories.category_id', '=', 'categories.id')
    ->leftJoin('statuses', 'items.status_id', '=', 'statuses.id')
    ->leftJoin('locations', 'items.location_id', '=', 'locations.id')
    ->leftJoin('floors', 'items.floor_id', '=', 'floors.id')
    ->leftJoin('suppliers', 'items.supplier_id', '=', 'suppliers.id')
    ->leftJoin('brands', 'items.brand_id', '=', 'brands.id')
    ->leftJoin('colors', 'items.color_id', '=', 'colors.id')
    ->leftJoin('users as holders', 'items.holder_user_id', '=', 'holders.id')
    ->select(
        'items.*',
        'fixed_items.name as fixed_item_name',
        'categories.name as category_name',
        'sub_categories.name as sub_category_name',
        'statuses.name as status_name',
        'locations.name as location_name',
        'floors.name as floor_name',
        'suppliers.name as supplier_name',
        'brands.name as brand_name',
        'colors.name as color_name',
        'holders.name as holder_name'
    );

// Apply filters
if ($request->has('category_id')) {
    $query->where('categories.id', $request->category_id);
}

if ($request->has('sub_category_id')) {
    $query->where('sub_categories.id', $request->sub_category_id);
}

if ($request->has('fixed_item_id')) {
    $query->where('items.fixed_item_id', $request->fixed_item_id);
}

// ... apply other filters

// Apply search
if ($request->has('search')) {
    $search = $request->search;
    $query->where(function($q) use ($search) {
        $q->where('items.sn', 'like', "%{$search}%")
          ->orWhere('items.description', 'like', "%{$search}%");
    });
}

// Apply sorting
$sortField = $request->get('sort', 'items.created_at');
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
```

---

## Complete Flow Summary

1. **User clicks "Furniture" in sidebar** → Navigate to `/assets?category_id=1`
2. **Frontend loads** → Fetch subcategories and category attributes
3. **User selects "Chair" subcategory** → Fetch fixed items for chairs
4. **User selects "Fixed chair"** → Filter items list by fixed_item_id=100
5. **Items display in table** with dynamic Material and Size columns
6. **User can further filter** by Status, Location, Floor, Supplier, Holder, Material, Size
7. **User can search** by serial number or description
8. **User can sort** by any column
9. **User can paginate** through results

All data flows through the backend with proper JOIN queries to include related table names.
