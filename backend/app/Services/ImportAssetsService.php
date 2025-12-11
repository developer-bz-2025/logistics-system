<?php
// app/Services/ImportAssetsService.php
namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use App\Services\ItemHistoryService;
class ImportAssetsService
{
    // Sheet names in your workbook (legacy - not currently used in main import)
    private const SHEETS = [
        'REF_SUPPLIERS' => 'suppliers',
        'REF_CAT1' => 'Category1',
        'REF_CAT2' => 'Category2',
        'REF_CAT3' => 'Category3',
        'ITEMS_FAM' => 'Furniture',
        'ITEMS_VEH' => 'Vehicles',
        'ITEMS_CE' => 'Computer and Electronics',
    ];


    public function run(string $absolutePath): array
{
    $absolutePath = str_replace('\\', '/', $absolutePath);
    if (!is_file($absolutePath)) {
        logger()->error('Import absolutePath not found', ['abs' => $absolutePath]);
        abort(400, "Import file not found: {$absolutePath}");
    }

    try {
        $reader = IOFactory::createReaderForFile($absolutePath);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($absolutePath);
    } catch (\Throwable $e) {
        logger()->error('PhpSpreadsheet load failed', ['abs' => $absolutePath, 'msg' => $e->getMessage()]);
        abort(400, "Unable to read Excel: ".$e->getMessage());
    }

    // We won’t re-create refs anymore:
    // $refSummary = $this->importReferences($spreadsheet);

    $results = [];
    foreach ($spreadsheet->getAllSheets() as $sheet) {
        $sheetName = $sheet->getTitle();

        // Skip any known non-category sheets (reference sheets)
        if (preg_match('/^suppliers$/i', $sheetName)) continue;
        if (preg_match('/^Category\d+$/i', $sheetName)) continue; // Skip Category1, Category2, etc. if they are reference sheets
        if (preg_match('/^REF_/i', $sheetName)) continue;

        // Resolve category by sheet title (trimmed, case-sensitive match by default)
        $categoryName = trim($sheetName);

        // Get attribute names from DB for this category
        $categoryId = DB::table('categories')->where('name', $categoryName)->value('id');
        if (!$categoryId) {
            logger()->warning('Import skip: category not found for sheet', ['sheet' => $sheetName]);
            $results[] = [
                'sheet' => $sheetName,
                'category' => $categoryName,
                'inserted' => 0, 'updated' => 0, 'att_options_created' => 0,
                'skipped_missing_category' => 1, 'skipped_missing_sub' => 0,
                'skipped_missing_fixed' => 0, 'skipped_empty_row' => 0,
                'skipped_category_names' => [$categoryName],
                'skipped_sub_names' => [],
                'skipped_fixed_names' => [],
                'duplicate_sns' => [],
            ];
            continue;
        }

        $attrNames = DB::table('category_attributes as ca')
            ->join('attributes as a', 'a.id', '=', 'ca.att_id')
            ->where('ca.category_id', $categoryId)
            ->orderBy('a.name')
            ->pluck('a.name')
            ->all();

        // Import this sheet
        $results[] = $this->importItemsSheet(
            $spreadsheet,
            $sheetName,
            $categoryName,
            ['attributes' => $attrNames] // pass the list; the function reads columns by these names
        );
    }

    // Aggregate skipped names across all sheets
    $all_skipped_category_names = [];
    $all_skipped_sub_names = [];
    $all_skipped_fixed_names = [];
    
    foreach ($results as $result) {
        if (isset($result['skipped_category_names'])) {
            $all_skipped_category_names = array_merge($all_skipped_category_names, $result['skipped_category_names']);
        }
        if (isset($result['skipped_sub_names'])) {
            $all_skipped_sub_names = array_merge($all_skipped_sub_names, $result['skipped_sub_names']);
        }
        if (isset($result['skipped_fixed_names'])) {
            $all_skipped_fixed_names = array_merge($all_skipped_fixed_names, $result['skipped_fixed_names']);
        }
    }
    
    // Remove duplicates and re-index
    $all_skipped_category_names = array_values(array_unique($all_skipped_category_names));
    $all_skipped_sub_names = array_values(array_unique($all_skipped_sub_names));
    $all_skipped_fixed_names = array_values(array_unique($all_skipped_fixed_names));

    $summary = [
        // 'references' => $refSummary ?? null,
        'items' => [
            'sheets'    => count($results),
            'inserted'  => array_sum(array_column($results, 'inserted')),
            'updated'   => array_sum(array_column($results, 'updated')),
            'att_options_created' => array_sum(array_column($results, 'att_options_created')),
            'skipped_missing_category' => array_sum(array_column($results, 'skipped_missing_category')),
            'skipped_missing_sub'      => array_sum(array_column($results, 'skipped_missing_sub')),
            'skipped_missing_fixed'    => array_sum(array_column($results, 'skipped_missing_fixed')),
            'skipped_empty_row'        => array_sum(array_column($results, 'skipped_empty_row')),
            'skipped_category_names'   => $all_skipped_category_names,
            'skipped_sub_names'        => $all_skipped_sub_names,
            'skipped_fixed_names'      => $all_skipped_fixed_names,
        ],
    ];

    DB::table('activity_log')->insert([
        'user_id'    => auth()->id() ?? null,
        'created_at' => now(),
        'action_id'  => $this->ensureAction('excel_import'),
    ]);

    return [$summary, ['per_sheet' => $results]];
}



    private function importReferences($spreadsheet): array
    {
        $sum = ['suppliers' => 0, 'categories' => 0, 'subs' => 0, 'fixed_items' => 0, 'brands' => 0];

        // Example: suppliers
        $sheet = $spreadsheet->getSheetByName(self::SHEETS['REF_SUPPLIERS']);
        if ($sheet) {
            $rows = $sheet->toArray(null, true, true, true);
            $header = array_shift($rows);
            foreach ($rows as $r) {
                $name = trim((string) ($r['A'] ?? ''));
                if (!$name)
                    continue;
                DB::table('suppliers')->updateOrInsert(['name' => $name], [
                    'phone' => (string) ($r['B'] ?? null),
                    'address' => (string) ($r['C'] ?? null),
                    'email' => (string) ($r['D'] ?? null),
                    'docs' => (string) ($r['E'] ?? null),
                ]);
                $sum['suppliers']++;
            }
        }

        // Category resources sheets (example structure—adapt to your columns; same technique)
        foreach ([self::SHEETS['REF_CAT1'], self::SHEETS['REF_CAT2'], self::SHEETS['REF_CAT3']] as $name) {
            $s = $spreadsheet->getSheetByName($name);
            if (!$s)
                continue;
            $rows = $s->toArray(null, true, true, true);
            $header = array_shift($rows);

            foreach ($rows as $r) {
                $cat = $this->clean((string) ($r['A'] ?? ''));
                $sub = $this->clean((string) ($r['B'] ?? ''));
                $fix = $this->clean((string) ($r['C'] ?? ''));
                $brand = $this->clean((string) ($r['D'] ?? ''));

                if (!$cat) {
                    // skip rows without a category entirely
                    continue;
                }

                $catId = $this->firstId('categories', ['name' => $cat], ['description' => null]);
                $sum['categories']++;

                if ($brand) {
                    $brandId = $this->firstId('brands', ['name' => $brand]);
                    $this->pivotOnce('brand_category', ['brand_id' => $brandId, 'category_id' => $catId]);
                    $sum['brands']++;
                }

                if (!$sub) {
                    // No sub-category in this row → skip creating sub/fixed entries
                    // (Optional) log skipped row to help you clean the sheet
                    // logger()->warning('Import: missing sub-category', ['sheet'=>$name,'category'=>$cat,'row'=>$r]);
                    continue;
                }

                $subId = $this->firstId('sub_category', ['name' => $sub, 'cat_id' => $catId]);
                $sum['subs']++;

                if ($fix) {
                    $this->firstId('fixed_items', ['name' => $fix, 'sub_id' => $subId]);
                    $sum['fixed_items']++;
                }
            }
        }

        return $sum;
    }
    



public function importItemsSheet(Spreadsheet $spreadsheet, string $sheetName, string $categoryName, array $cfg = []): array
{
    $ws = $spreadsheet->getSheetByName($sheetName);
    if (!$ws) {
        logger()->warning('Import: sheet not found', ['sheet' => $sheetName]);
        return [
            'sheet' => $sheetName,
            'category' => $categoryName,
            'inserted' => 0,
            'updated' => 0,
            'att_options_created' => 0,
            'skipped_missing_category' => 0,
            'skipped_missing_sub' => 0,
            'skipped_missing_fixed' => 0,
            'skipped_empty_row' => 0,
            'skipped_category_names' => [],
            'skipped_sub_names' => [],
            'skipped_fixed_names' => [],
            'duplicate_sns' => [],
        ];
    }

    // Get attribute names from DB for this category
    $attrNames = $cfg['attributes'] ?? [];

    // 1) Read sheet -> array (preserve column letters)
    $rows = $ws->toArray(null, true, true, true);
    if (count($rows) < 2) {
        return [
            'sheet' => $sheetName,
            'category' => $categoryName,
            'inserted' => 0,
            'updated' => 0,
            'att_options_created' => 0,
            'skipped_missing_category' => 0,
            'skipped_missing_sub' => 0,
            'skipped_missing_fixed' => 0,
            'skipped_empty_row' => 0,
            'skipped_category_names' => [],
            'skipped_sub_names' => [],
            'skipped_fixed_names' => [],
            'duplicate_sns' => [],
        ];
    }

    // 2) Header mapping (case-insensitive)
    $header = $rows[1] ?? [];
    $H = $this->mapHeaderAliases($header, [
        'category' => ['category'],
        'sub_category' => ['sub category', 'sub_category', 'subcategory', 'sub'],
        'fixed_item' => ['item', 'fixed item', 'fixed_item', 'item/fixed item', 'item name', 'name'],
        'sn' => ['sn', 'serial', 'serial number'],
        'description' => ['description', 'desc'],
        'brand' => ['brand'],
        'color' => ['color'],
        'supplier' => ['supplier'],
        'status' => ['status'],
        'acquisition_date' => ['acquisition date', 'aquisition date', 'acquisition_date', 'date'],
        'acquisition_cost' => ['acquisition cost', 'aquisition cost', 'acquisition_cost', 'cost'],
        'warranty_start' => ['warranty start', 'warranty start date', 'warranty_start'],
        'warranty_end' => ['warranty end', 'warranty end date', 'warranty_end'],
        'budget_code' => ['budget code', 'budget_code'],
        'budget_donor' => ['budget donor', 'budget_donor','Budget/ Doner'],
        'location' => ['location'],
        'floor' => ['floor'],
        'notes' => ['notes', 'note'],
    ], $attrNames);

    // 3) Resolve category id (strict)
    $categoryId = $this->idOrNull('categories', ['name' => $categoryName]);
    if (!$categoryId) {
        logger()->warning('Import skip: category not found for sheet', ['sheet' => $sheetName, 'category' => $categoryName]);
        return [
            'sheet' => $sheetName,
            'category' => $categoryName,
            'inserted' => 0,
            'updated' => 0,
            'att_options_created' => 0,
            'skipped_missing_category' => 1,
            'skipped_missing_sub' => 0,
            'skipped_missing_fixed' => 0,
            'skipped_empty_row' => 0,
            'skipped_category_names' => [$categoryName],
            'skipped_sub_names' => [],
            'skipped_fixed_names' => [],
            'duplicate_sns' => [],
        ];
    }

    $inserted = $updated = $att_options_created = 0;
    $skipped_missing_sub = $skipped_missing_fixed = $skipped_empty_row = 0;
    $skipped_sub_names = [];
    $skipped_fixed_names = [];
    $duplicate_sns = []; // Track duplicate serial numbers found during import

    // 4) Iterate data rows (skip header row)
    // Note: toArray returns 1-indexed array, so row 1 is header, rows 2+ are data
    for ($i = 2; $i <= count($rows); $i++) {
        $r = $rows[$i] ?? [];

        // Grab core fields
        $subName = $this->clean($this->cell($r, $H, 'sub_category'));
        $fixedName = $this->clean($this->cell($r, $H, 'fixed_item'));
        $sn = $this->clean($this->cell($r, $H, 'sn'));
        $desc = $this->clean($this->cell($r, $H, 'description'));

        // Handle SN: if empty or "NA"/"N/A", set to null to avoid unique constraint conflicts
        if (!$sn || strtoupper($sn) === 'NA' || strtoupper($sn) === 'N/A') {
            $sn = null; // Allow multiple items without SN
        }

        // Special handling for Vehicles category - use plate number as SN if available
        if ($categoryName === 'vehicle' || $categoryName === 'Vehicles') {
            $plateNumber = $this->clean($this->cell($r, $H, ['plate number', 'plate_number']));
            $chassisNumber = $this->clean($this->cell($r, $H, ['chassis number', 'chassis_number']));

            // If plate number exists and SN is null, use plate number as SN
            if ($plateNumber && $sn === null) {
                $sn = $plateNumber;
            }
            // Chassis number is just informational, not stored in SN
        }

        // Handle empty cells: set to "NA" for required fields
        $subName = $subName ?: 'NA';
        $fixedName = $fixedName ?: 'NA';
        $desc = $desc ?: 'NA';

        // Skip rows that are completely empty (all NA or null)
        // Note: $sn can be null, so we check for both null and 'NA'
        $isSnEmpty = ($sn === null || $sn === 'NA');
        if ($subName === 'NA' && $fixedName === 'NA' && $isSnEmpty && $desc === 'NA') {
            $skipped_empty_row++;
            continue;
        }

        // Resolve subcategory (strict)
        $subId = $this->idOrNull('sub_category', ['name' => $subName, 'cat_id' => $categoryId]);
        if (!$subId) {
            logger()->warning('Import skip: subcategory not found', [
                'sheet' => $sheetName,
                'category' => $categoryName,
                'subcategory' => $subName,
                'row' => $i
            ]);
            $skipped_missing_sub++;
            // Store the skipped subcategory name (avoid duplicates)
            if (!in_array($subName, $skipped_sub_names)) {
                $skipped_sub_names[] = $subName;
            }
            continue;
        }

        // Resolve fixed item (strict)
        $fixedId = $this->idOrNull('fixed_items', ['name' => $fixedName, 'sub_id' => $subId]);
        if (!$fixedId) {
            logger()->warning('Import skip: fixed item not found', [
                'sheet' => $sheetName,
                'category' => $categoryName,
                'subcategory' => $subName,
                'fixed_item' => $fixedName,
                'row' => $i
            ]);
            $skipped_missing_fixed++;
            // Store the skipped fixed item name with its subcategory for context
            $skipped_fixed_key = $subName . ' > ' . $fixedName;
            if (!in_array($skipped_fixed_key, $skipped_fixed_names)) {
                $skipped_fixed_names[] = $skipped_fixed_key;
            }
            continue;
        }

        // Resolve optional references (strict)
        $brandId = $this->resolveOptionalRef($r, $H, 'brand', 'brands', $sheetName, $i);
        $colorId = $this->resolveOptionalRef($r, $H, 'color', 'colors', $sheetName, $i);
        $supplierId = $this->resolveOptionalRefWithCreation($r, $H, 'supplier', 'suppliers', $sheetName, $i);
        $statusId = $this->resolveOptionalRef($r, $H, 'status', 'status', $sheetName, $i);

        // Resolve location and floor
        $locationId = $this->resolveOptionalRef($r, $H, 'location', 'locations', $sheetName, $i);
        $floorId = null;
        $floorName = $this->clean($this->cell($r, $H, 'floor'));

        if ($floorName) {
            // First try to find floor with location_id (if location exists)
            if ($locationId) {
                $floorId = $this->idOrNull('floors', ['name' => $floorName, 'location_id' => $locationId]);
            }

            // If not found with location, try to find floor without location constraint
            if (!$floorId) {
                $floorId = $this->idOrNull('floors', ['name' => $floorName, 'location_id' => null]);
            }

            // If still not found, try any floor with this name (legacy support)
            if (!$floorId) {
                $floorId = $this->idOrNull('floors', ['name' => $floorName]);
            }

            if (!$floorId) {
                logger()->warning('Import: floor not found', [
                    'sheet' => $sheetName,
                    'location' => $this->clean($this->cell($r, $H, 'location')) ?: 'none',
                    'floor' => $floorName,
                    'row' => $i
                ]);
            }
        }

        // Parse dates and numbers
        $acquisitionDate = $this->date($this->cell($r, $H, 'acquisition_date'));
        $acquisitionCost = $this->num($this->cell($r, $H, 'acquisition_cost'));
        $warrantyStart = $this->date($this->cell($r, $H, 'warranty_start'));
        $warrantyEnd = $this->date($this->cell($r, $H, 'warranty_end'));

        $budgetCode = $this->clean($this->cell($r, $H, 'budget_code'));
        $budgetDonor = $this->clean($this->cell($r, $H, 'budget_donor'));
        $notes = $this->clean($this->cell($r, $H, 'notes'));

        // Process attributes
        $attributeValues = [];
        foreach ($attrNames as $attrName) {
            $attrValue = $this->clean($this->cell($r, $H, $attrName));
            if (!$attrValue) continue;

            // Find attribute
            $attrId = $this->idOrNull('attributes', ['name' => $attrName]);
            if (!$attrId) {
                logger()->warning('Import: attribute not found', [
                    'sheet' => $sheetName,
                    'attribute' => $attrName,
                    'row' => $i
                ]);
                continue;
            }

            // Check if attribute is allowed for category
            $allowedForCategory = DB::table('category_attributes')
                ->where('category_id', $categoryId)
                ->where('att_id', $attrId)
                ->exists();

            if (!$allowedForCategory) {
                logger()->warning('Import: attribute not allowed for category', [
                    'sheet' => $sheetName,
                    'category' => $categoryName,
                    'attribute' => $attrName,
                    'row' => $i
                ]);
                continue;
            }

            // Find option
            $optionId = DB::table('att_options')
                ->where('att_id', $attrId)
                ->where('value', $attrValue)
                ->value('id');

            if (!$optionId) {
                logger()->warning('Import: attribute option not found', [
                    'sheet' => $sheetName,
                    'attribute' => $attrName,
                    'value' => $attrValue,
                    'row' => $i
                ]);
                continue;
            }

            // Check if option is allowed for subcategory
            $allowedForSubcategory = DB::table('sub_category_att_options')
                ->where('sub_category_id', $subId)
                ->where('att_option_id', $optionId)
                ->exists();

            if (!$allowedForSubcategory) {
                logger()->warning('Import: attribute option not linked to subcategory', [
                    'sheet' => $sheetName,
                    'subcategory' => $subName,
                    'attribute' => $attrName,
                    'value' => $attrValue,
                    'row' => $i
                ]);
                continue;
            }

            $attributeValues[$attrId] = $optionId;
        }

        // Prepare item data
        $itemData = [
            'fixed_item_id' => $fixedId,
            'description' => $desc,
            'sn' => $sn,
            'color_id' => $colorId,
            'brand_id' => $brandId,
            'supplier_id' => $supplierId,
            'status_id' => $statusId,
            'location_id' => $locationId,
            'floor_id' => $floorId,
            'acquisition_date' => $acquisitionDate,
            'acquisition_cost' => $acquisitionCost,
            'warranty_start_date' => $warrantyStart,
            'warranty_end_date' => $warrantyEnd,
            'budget_code' => $budgetCode,
            'budget_donor' => $budgetDonor,
            'Notes' => $notes,
            'created_by' => auth()->id(),
            'updated_at' => now(),
        ];

        // Handle item insertion - check for existing items with SN, but allow multiples without SN
        if ($sn) {
            // If item has SN, check for existing item with same SN
            $existingItem = DB::table('items')->where('sn', $sn)->first();
            if ($existingItem) {
                // Update existing item with same SN (duplicate SN in Excel file)
                DB::table('items')->where('id', $existingItem->id)->update($itemData);
                $itemId = $existingItem->id;
                $updated++;

                // Track duplicate serial number
                if (!in_array($sn, $duplicate_sns)) {
                    $duplicate_sns[] = $sn;
                }

                // Log item update
                ItemHistoryService::logItemUpdated($itemId, $itemData);
            } else {
                // Insert new item
                $itemData['created_at'] = now();
                $itemId = DB::table('items')->insertGetId($itemData);
                $inserted++;

                // Log item creation
                ItemHistoryService::logItemCreated($itemId, $itemData, auth()->id());
            }
        } else {
            // For items without SN, always insert as new (no deduplication)
            // This allows multiple items with identical data to be inserted
            $itemData['created_at'] = now();
            $itemId = DB::table('items')->insertGetId($itemData);
            $inserted++;

            // Log item creation
            ItemHistoryService::logItemCreated($itemId, $itemData, auth()->id());
        }

        // Insert/update attribute values
        foreach ($attributeValues as $attrId => $optionId) {
            DB::table('item_attribute_values')->updateOrInsert(
                ['item_id' => $itemId, 'att_id' => $attrId],
                ['att_option_id' => $optionId]
            );
        }
    }

    return [
        'sheet' => $sheetName,
        'category' => $categoryName,
        'inserted' => $inserted,
        'updated' => $updated,
        'att_options_created' => $att_options_created,
        'skipped_missing_category' => 0,
        'skipped_missing_sub' => $skipped_missing_sub,
        'skipped_missing_fixed' => $skipped_missing_fixed,
        'skipped_empty_row' => $skipped_empty_row,
        'skipped_sub_names' => $skipped_sub_names,
        'skipped_fixed_names' => $skipped_fixed_names,
        'duplicate_sns' => $duplicate_sns,
    ];
}

/**
 * Map headers to normalized keys + include attribute headers.
 * $aliases: ['key' => ['alias1','alias2',...]]
 * For attribute names, we add them verbatim to the map so cell($r,$H,$attName) works.
 */
private function mapHeaderAliases(array $headerRow, array $aliases, array $attributeNames = []): array
{
    // Build normalized header->column map, e.g. 'sub category' => 'B'
    $norm = [];
    foreach ($headerRow as $col => $label) {
        $lbl = is_string($label) ? strtolower(trim(preg_replace('/\s+/u', ' ', $label))) : '';
        if ($lbl !== '') $norm[$lbl] = $col;
    }

    $H = [];
    foreach ($aliases as $key => $alts) {
        foreach ($alts as $a) {
            $needle = strtolower(trim($a));
            if (isset($norm[$needle])) { $H[$key] = $norm[$needle]; break; }
        }
    }

    // Attributes: map each attribute name directly (case-insensitive)
    foreach ($attributeNames as $attr) {
        $needle = strtolower(trim($attr));
        if (isset($norm[$needle])) {
            $H[$attr] = $norm[$needle]; // key by real name to look up via cell(..., $attr)
        }
    }

    // Common optional: notes column
    if (!isset($H['notes']) && isset($norm['notes'])) $H['notes'] = $norm['notes'];
    if (!isset($H['note'])  && isset($norm['note']))  $H['note']  = $norm['note'];

    return $H;
}

/**
 * Read a value from row $r using header map $H.
 * $key can be a string (mapped key) or an array of fallback keys.
 */
private function cell(array $r, array $H, string|array $key)
{
    if (is_array($key)) {
        foreach ($key as $k) {
            if (isset($H[$k])) return $r[$H[$k]] ?? null;
        }
        return null;
    }
    return isset($H[$key]) ? ($r[$H[$key]] ?? null) : null;
}


    /* ----------------- helpers ----------------- */


private function clean(?string $s): ?string
{
    if ($s === null) return null;
    $s = str_replace(["\xC2\xA0", "\u{00A0}"], ' ', $s); // NBSP
    $s = preg_replace('/\s+/u', ' ', $s);
    $s = trim($s);
    return $s === '' ? null : $s;
}

private function idOrNull(string $table, array $where): ?int
{
    $row = DB::table($table)->where($where)->first(['id']);
    return $row ? (int)$row->id : null;
}

private function requireIdOrSkip(?int $id, string $what, array $context, &$skipsCounter): ?int
{
    if ($id) return $id;
    $skipsCounter++;
    logger()->warning("Import skip: missing $what", $context);
    return null;
}


    private function mapHeaders(array $header): array
    {
        $H = [];
        foreach ($header as $col => $name) {
            $n = Str::lower(trim((string) $name));
            if ($n)
                $H[$n] = $col; // map "name" => "A"
        }
        return $H;
    }



    private function val($v)
    {
        return is_string($v) ? trim($v) : $v;
    }
    private function num($v)
    {
        return is_numeric($v) ? (float) $v : (is_string($v) && $v !== '' ? (float) str_replace([','], [''], $v) : null);
    }
    private function date($v)
    {
        if (!$v)
            return null;
        
        // Clean the value first
        $v = is_string($v) ? trim($v) : $v;
        
        // Check for NA/N/A values and return null
        if (is_string($v) && (strtoupper($v) === 'NA' || strtoupper($v) === 'N/A')) {
            return null;
        }
        
        try {
            // handle Excel serials or ISO strings
            if (is_numeric($v)) {
                $ts = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($v);
                return $ts->format('Y-m-d');
            }

            // Try DD/MM/YYYY format first (common in Excel)
            if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $v)) {
                $date = \DateTime::createFromFormat('d/m/Y', $v);
                if ($date) {
                    return $date->format('Y-m-d');
                }
            }

            // Fallback to strtotime for other formats
            $timestamp = strtotime($v);
            // If strtotime fails, return null instead of 1970-01-01
            if ($timestamp === false) {
                return null;
            }
            return date('Y-m-d', $timestamp);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function firstId(string $table, array $where, array $extra = [])
    {
        $row = DB::table($table)->where($where)->first();
        if ($row)
            return $row->id;
        return DB::table($table)->insertGetId($where + $extra);
    }

    private function pivotOnce(string $table, array $pair): void
    {
        $exists = DB::table($table)->where($pair)->exists();
        if (!$exists)
            DB::table($table)->insert($pair);
    }

    private function ensureAction(string $action): int
    {
        $id = DB::table('actions')->where('action', $action)->value('id');
        return $id ?: DB::table('actions')->insertGetId(['action' => $action]);
    }

    /**
     * Resolve optional reference by name (strict mode - only existing refs)
     */
    private function resolveOptionalRef(array $row, array $headerMap, string $fieldName, string $tableName, string $sheetName, int $rowIndex): ?int
    {
        $value = $this->clean($this->cell($row, $headerMap, $fieldName));
        if (!$value) {
            return null;
        }

        $id = $this->idOrNull($tableName, ['name' => $value]);
        if (!$id) {
            logger()->warning("Import: {$fieldName} not found", [
                'sheet' => $sheetName,
                'field' => $fieldName,
                'value' => $value,
                'row' => $rowIndex
            ]);
        }

        return $id;
    }

    /**
     * Resolve optional reference with creation for special cases (like "N/A" supplier)
     */
    private function resolveOptionalRefWithCreation(array $row, array $headerMap, string $fieldName, string $tableName, string $sheetName, int $rowIndex): ?int
    {
        $value = $this->clean($this->cell($row, $headerMap, $fieldName));
        if (!$value) {
            return null;
        }

        // Special case: if supplier is "N/A", create it if it doesn't exist
        if ($fieldName === 'supplier' && strtoupper($value) === 'N/A') {
            return DB::table($tableName)->updateOrInsert(
                ['name' => 'N/A'],
                ['phone' => null, 'address' => null, 'email' => null, 'docs' => null]
            ) ? $this->idOrNull($tableName, ['name' => 'N/A']) : null;
        }

        // For other cases, use strict mode
        $id = $this->idOrNull($tableName, ['name' => $value]);
        if (!$id) {
            logger()->warning("Import: {$fieldName} not found", [
                'sheet' => $sheetName,
                'field' => $fieldName,
                'value' => $value,
                'row' => $rowIndex
            ]);
        }

        return $id;
    }
}
