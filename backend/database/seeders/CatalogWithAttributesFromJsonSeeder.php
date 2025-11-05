<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CatalogWithAttributesFromJsonSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data to ensure clean slate
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('sub_category_att_options')->truncate();
        DB::table('category_attributes')->truncate();
        DB::table('att_options')->truncate();
        DB::table('attributes')->truncate();
        DB::table('fixed_items')->truncate();
        DB::table('sub_category')->truncate();
        DB::table('categories')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Read JSON file
        $jsonPath = base_path('../Docs/stracture.json');
        if (!File::exists($jsonPath)) {
            throw new \Exception("JSON file not found at: {$jsonPath}");
        }

        $jsonContent = File::get($jsonPath);
        $data = json_decode($jsonContent, true);

        if (!$data) {
            throw new \Exception("Invalid JSON content");
        }

        // Process categories
        $categories = [];
        foreach ($data as $categoryData) {
            $categories[] = [
                'name' => $categoryData['category'],
                'description' => '',
            ];
        }
        DB::table('categories')->upsert($categories, ['name'], ['description']);
        $catId = DB::table('categories')->pluck('id', 'name');

        // Process attributes
        $attributes = [];
        $categoryAttributes = [];
        foreach ($data as $categoryData) {
            $categoryName = $categoryData['category'];
            $categoryId = $catId[$categoryName];

            foreach ($categoryData['attributes'] as $attribute) {
                // Handle attribute naming: keep first word for "Material - brand - fixture"
                $cleanAttribute = $this->cleanAttributeName($attribute);

                if (!isset($attributes[$cleanAttribute])) {
                    $attributes[$cleanAttribute] = [
                        'name' => $cleanAttribute,
                    ];
                }

                $categoryAttributes[] = [
                    'category_id' => $categoryId,
                    'att_id' => null, // Will be set after attributes are inserted
                    'attribute_name' => $cleanAttribute,
                ];
            }
        }

        // Insert attributes
        $attributeList = array_values($attributes);
        DB::table('attributes')->upsert($attributeList, ['name'], []);
        $attrId = DB::table('attributes')->pluck('id', 'name');

        // Update category_attributes with correct att_id
        foreach ($categoryAttributes as &$catAttr) {
            $catAttr['att_id'] = $attrId[$catAttr['attribute_name']];
            unset($catAttr['attribute_name']);
        }
        DB::table('category_attributes')->upsert($categoryAttributes, ['category_id', 'att_id'], []);

        // Process subcategories and their data
        $subcategories = [];
        $fixedItems = [];
        $attributeOptions = [];
        $subCategoryAttOptions = [];

        foreach ($data as $categoryData) {
            $categoryName = $categoryData['category'];
            $categoryId = $catId[$categoryName];

            foreach ($categoryData['sub_categories'] as $subcategoryData) {
                $subcategoryName = $subcategoryData['name'];

                // Add subcategory
                $subcategories[] = [
                    'cat_id' => $categoryId,
                    'name' => $subcategoryName,
                    'description' => '',
                ];

                // Process items
                foreach ($subcategoryData['items'] as $item) {
                    $fixedItems[] = [
                        'sub_id' => null, // Will be set after subcategories are inserted
                        'name' => $item,
                        'subcategory_name' => $subcategoryName,
                        'category_id' => $categoryId,
                    ];
                }

                // Process options for each attribute
                foreach ($categoryData['attributes'] as $attribute) {
                    $cleanAttribute = $this->cleanAttributeName($attribute);

                    if (isset($subcategoryData['options'][$attribute])) {
                        $options = $subcategoryData['options'][$attribute];

                        foreach ($options as $option) {
                            // Add to attribute options
                            $attributeOptions[] = [
                                'att_id' => $attrId[$cleanAttribute],
                                'value' => $option,
                                'attribute_name' => $cleanAttribute,
                                'subcategory_name' => $subcategoryName,
                                'category_id' => $categoryId,
                            ];

                            // Add to sub_category_att_options - create unique key for this specific subcategory-option combination
                            $subCatOptKey = $categoryId . '::' . $subcategoryName . '::' . $cleanAttribute . '::' . $option;
                            $subCategoryAttOptions[$subCatOptKey] = [
                                'sub_category_id' => null, // Will be set after subcategories are inserted
                                'att_option_id' => null, // Will be set after options are inserted
                                'attribute_name' => $cleanAttribute,
                                'option_value' => $option,
                                'subcategory_name' => $subcategoryName,
                                'category_id' => $categoryId,
                            ];
                        }
                    }
                }
            }
        }

        // Insert subcategories
        DB::table('sub_category')->upsert($subcategories, ['cat_id', 'name'], ['description']);
        $subRows = DB::table('sub_category')->get(['id', 'cat_id', 'name']);
        $subId = [];
        foreach ($subRows as $r) {
            $subId[$r->cat_id . '::' . $r->name] = $r->id;
        }

        // Update fixed items with correct sub_id
        foreach ($fixedItems as &$item) {
            $key = $item['category_id'] . '::' . $item['subcategory_name'];
            if (isset($subId[$key])) {
                $item['sub_id'] = $subId[$key];
            }
            unset($item['subcategory_name'], $item['category_id']);
        }
        $validFixedItems = array_filter($fixedItems, fn($item) => $item['sub_id'] !== null);
        if (!empty($validFixedItems)) {
            DB::table('fixed_items')->upsert($validFixedItems, ['sub_id', 'name'], []);
        }

        // Insert attribute options
        $optionInserts = [];
        $seenOptions = [];
        foreach ($attributeOptions as $option) {
            $normalizedValue = strtolower(trim($option['value']));
            $key = $option['att_id'] . '::' . $normalizedValue;
            if (!isset($seenOptions[$key])) {
                $seenOptions[$key] = true;
                $optionInserts[] = [
                    'att_id' => $option['att_id'],
                    'value' => $option['value'],
                ];
            }
        }
        if (!empty($optionInserts)) {
            DB::table('att_options')->upsert($optionInserts, ['att_id', 'value'], []);
        }

        // Get option IDs
        $optRows = DB::table('att_options')->get(['id', 'att_id', 'value']);
        $optId = [];
        foreach ($optRows as $r) {
            $optId[$r->att_id . '::' . $r->value] = $r->id;
            // Also create normalized lookup for case-insensitive matching
            $optId[$r->att_id . '::' . strtolower(trim($r->value))] = $r->id;
        }

        // Update sub_category_att_options with correct IDs
        $subCatOptInserts = [];
        $seenSubCatOpts = [];
        foreach ($subCategoryAttOptions as $subCatOpt) {
            $subKey = $subCatOpt['category_id'] . '::' . $subCatOpt['subcategory_name'];
            if (!isset($subId[$subKey])) continue;

            // Try exact match first, then normalized match
            $optKey = $attrId[$subCatOpt['attribute_name']] . '::' . $subCatOpt['option_value'];
            if (!isset($optId[$optKey])) {
                // Try normalized lookup
                $optKey = $attrId[$subCatOpt['attribute_name']] . '::' . strtolower(trim($subCatOpt['option_value']));
                if (!isset($optId[$optKey])) continue;
            }

            $combinedKey = $subId[$subKey] . '::' . $optId[$optKey];
            if (!isset($seenSubCatOpts[$combinedKey])) {
                $seenSubCatOpts[$combinedKey] = true;
                $subCatOptInserts[] = [
                    'sub_category_id' => $subId[$subKey],
                    'att_option_id' => $optId[$optKey],
                ];
            }
        }
        if (!empty($subCatOptInserts)) {
            DB::table('sub_category_att_options')->upsert($subCatOptInserts, ['sub_category_id', 'att_option_id'], []);
        }
    }

    /**
     * Clean attribute name by keeping only the first word
     * e.g., "Material - brand - fixture" becomes "Material"
     */
    private function cleanAttributeName(string $attribute): string
    {
        $parts = explode(' - ', $attribute);
        return trim($parts[0]);
    }
}
