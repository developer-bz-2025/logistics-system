<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogWithAttributesFromExcelSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('categories')->upsert(
            [
                ['name' => 'Computer', 'description' => ''],
                ['name' => 'Electronics', 'description' => ''],
                ['name' => 'Furniture', 'description' => ''],
                ['name' => 'IT Equipment', 'description' => ''],
                ['name' => 'Machine', 'description' => ''],
                ['name' => 'Vehicles', 'description' => ''],
                ['name' => 'appliances', 'description' => '']
            ],
            ['name'],
            ['description']
        );

        $catId = DB::table('categories')->pluck('id', 'name');

        $subs = [];
        foreach ([
            ['category' => 'Computer', 'name' => 'Desktop', 'description' => ''],
            ['category' => 'Electronics', 'name' => 'Receiver', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'AC', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Battery', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Blood_pressure_monitor', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Cabinet', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Computer_Case', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Cork_Board', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Curtain', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'DVR', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Desk', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Diesel_Tank', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Electric_cooker', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Electric_drill', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'External_DVD', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Fan', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Fire_extinguisher', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'General', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Heater', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Hoover', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Mixer', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Mouse', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Punching_Machine', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Safe_Money', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Sofa', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Stove', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'TV', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'Table', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'White_Board', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'chair', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'computer_screen', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'kettle', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'sprayer', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'water_cooler', 'description' => ''],
            ['category' => 'Furniture', 'name' => 'water_pump_power', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'Camera', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'General', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'Keyboard', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'Monitors', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'Printer', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'UPS', 'description' => ''],
            ['category' => 'IT Equipment', 'name' => 'projector', 'description' => ''],
            ['category' => 'Machine', 'name' => 'Blood_pressure_monitor', 'description' => ''],
            ['category' => 'Machine', 'name' => 'Computer_Case', 'description' => ''],
            ['category' => 'Machine', 'name' => 'General', 'description' => ''],
            ['category' => 'Machine', 'name' => 'Mouse', 'description' => ''],
            ['category' => 'Machine', 'name' => 'Punching_Machine', 'description' => ''],
            ['category' => 'Machine', 'name' => 'Safe_Money', 'description' => ''],
            ['category' => 'Machine', 'name' => 'sprayer', 'description' => ''],
            ['category' => 'Machine', 'name' => 'water_pump_power', 'description' => ''],
            ['category' => 'Vehicles', 'name' => 'Bus', 'description' => ''],
            ['category' => 'Vehicles', 'name' => 'Car', 'description' => ''],
            ['category' => 'Vehicles', 'name' => 'General', 'description' => ''],
            ['category' => 'Vehicles', 'name' => 'Moto', 'description' => ''],
            ['category' => 'Vehicles', 'name' => 'Pickup_Trucks', 'description' => ''],
            ['category' => 'Vehicles', 'name' => 'mini_van', 'description' => ''],
            ['category' => 'appliances', 'name' => 'AC', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Battery', 'description' => ''],
            ['category' => 'appliances', 'name' => 'DVR', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Electric_cooker', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Electric_drill', 'description' => ''],
            ['category' => 'appliances', 'name' => 'External_DVD', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Fan', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Fire_extinguisher', 'description' => ''],
            ['category' => 'appliances', 'name' => 'General', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Heater', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Hoover', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Mixer', 'description' => ''],
            ['category' => 'appliances', 'name' => 'Stove', 'description' => ''],
            ['category' => 'appliances', 'name' => 'TV', 'description' => ''],
            ['category' => 'appliances', 'name' => 'computer_screen', 'description' => ''],
            ['category' => 'appliances', 'name' => 'kettle', 'description' => ''],
            ['category' => 'appliances', 'name' => 'water_cooler', 'description' => '']
        ] as $row) {
            $subs[] = [
                'cat_id' => $catId[$row['category']],
                'name' => $row['name'],
                'description' => $row['description'],
            ];
        }
        DB::table('sub_category')->upsert($subs, ['cat_id', 'name'], ['description']);

        $subRows = DB::table('sub_category')->get(['id', 'cat_id', 'name']);
        $subId = [];
        foreach ($subRows as $r) {
            $subId[$r->cat_id . '::' . $r->name] = $r->id;
        }

        $fixed = [];
        foreach ([
            ['category' => 'Computer', 'subcategory' => 'Desktop', 'name' => 'Desktop'],
            ['category' => 'Electronics', 'subcategory' => 'Receiver', 'name' => 'Receiver'],
            ['category' => 'Furniture', 'subcategory' => 'AC', 'name' => 'AC inverter'],
            ['category' => 'Furniture', 'subcategory' => 'Battery', 'name' => 'Gel battery'],
            ['category' => 'Furniture', 'subcategory' => 'Blood_pressure_monitor', 'name' => 'Manual'],
            ['category' => 'Furniture', 'subcategory' => 'Cabinet', 'name' => 'Cabinet with lock'],
            ['category' => 'Furniture', 'subcategory' => 'Computer_Case', 'name' => 'Computer Case'],
            ['category' => 'Furniture', 'subcategory' => 'Cork_Board', 'name' => 'cork board'],
            ['category' => 'Furniture', 'subcategory' => 'Curtain', 'name' => 'Rollers shades Curtains'],
            ['category' => 'Furniture', 'subcategory' => 'DVR', 'name' => 'DVR'],
            ['category' => 'Furniture', 'subcategory' => 'Desk', 'name' => 'Desk with drawers'],
            ['category' => 'Furniture', 'subcategory' => 'Diesel_Tank', 'name' => 'Tank'],
            ['category' => 'Furniture', 'subcategory' => 'Electric_cooker', 'name' => 'Electric_cooker'],
            ['category' => 'Furniture', 'subcategory' => 'Electric_drill', 'name' => 'Electric drill with battery'],
            ['category' => 'Furniture', 'subcategory' => 'External_DVD', 'name' => 'External_DVD'],
            ['category' => 'Furniture', 'subcategory' => 'Fan', 'name' => 'Ceiling fan'],
            ['category' => 'Furniture', 'subcategory' => 'Fire_extinguisher', 'name' => 'Foam fire extinguisher'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'AC non inverter'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Automated'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Cabinet with drawers'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Cabinet with open shelves'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Carbon dioxide (CO2) fire extinguisher'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Curtains block'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Customize Cabinet'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Desk without drawers'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Diesel Heaters'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Electric and Diesel Heaters'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Electric drill without drill'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Fixed chair'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Gas and electric heater'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Gaz Heaters'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Gaz_bottle'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Kids chair Assorted color'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Lead-acid battery'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Lithium battery'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Meeting table'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Microwave'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Money Counter'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Oxygen_Machine'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Portable Heaters'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Powder fire extinguisher'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Recorder'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Refrigerator'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Rocking chair'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Shredder'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Sofa without hands'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Stand fan'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Stove and gas oven'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'TV'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Table for computer'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Wall fan'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Wheelchair with hands'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Wheelchair without hands'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'Whiteboard 2 side'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'double Student chair with table'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'double student table'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'name' => 'single Student chair without table'],
            ['category' => 'Furniture', 'subcategory' => 'Heater', 'name' => 'Electric heaters'],
            ['category' => 'Furniture', 'subcategory' => 'Hoover', 'name' => 'Hoover'],
            ['category' => 'Furniture', 'subcategory' => 'Mixer', 'name' => 'Mixer'],
            ['category' => 'Furniture', 'subcategory' => 'Mouse', 'name' => 'Mouse'],
            ['category' => 'Furniture', 'subcategory' => 'Punching_Machine', 'name' => 'Punching Machine'],
            ['category' => 'Furniture', 'subcategory' => 'Safe_Money', 'name' => 'Safe monry with lock'],
            ['category' => 'Furniture', 'subcategory' => 'Sofa', 'name' => 'Sofa with hand'],
            ['category' => 'Furniture', 'subcategory' => 'Stove', 'name' => 'Stove'],
            ['category' => 'Furniture', 'subcategory' => 'TV', 'name' => 'Smart TV'],
            ['category' => 'Furniture', 'subcategory' => 'Table', 'name' => 'Table'],
            ['category' => 'Furniture', 'subcategory' => 'White_Board', 'name' => 'Whitboard 1 side'],
            ['category' => 'Furniture', 'subcategory' => 'chair', 'name' => 'single Student chair with table'],
            ['category' => 'Furniture', 'subcategory' => 'computer_screen', 'name' => 'computer_screen'],
            ['category' => 'Furniture', 'subcategory' => 'kettle', 'name' => 'Electric kettle'],
            ['category' => 'Furniture', 'subcategory' => 'sprayer', 'name' => 'Manual'],
            ['category' => 'Furniture', 'subcategory' => 'water_cooler', 'name' => 'Hot and Cold Water Dispensers'],
            ['category' => 'Furniture', 'subcategory' => 'water_pump_power', 'name' => 'water pump power'],
            ['category' => 'IT Equipment', 'subcategory' => 'Camera', 'name' => 'Dome Cameras'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => '4K Projectors'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Bullet Cameras'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'FHD Monitors'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'HD Monitors'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Heavy Duty'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Indoor Cameras'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'LED Monitors'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Large UPS'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Laser jet'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Network IP Cameras'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Outdoor Cameras'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Portable Projectors'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'QHD Monitors'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'Wireless Cameras'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'black'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'colored'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'name' => 'wireless keyboard'],
            ['category' => 'IT Equipment', 'subcategory' => 'Keyboard', 'name' => 'wired keyboard'],
            ['category' => 'IT Equipment', 'subcategory' => 'Monitors', 'name' => 'LCD Monitors'],
            ['category' => 'IT Equipment', 'subcategory' => 'Printer', 'name' => 'Ink jet'],
            ['category' => 'IT Equipment', 'subcategory' => 'UPS', 'name' => 'Small UPS'],
            ['category' => 'IT Equipment', 'subcategory' => 'projector', 'name' => 'HD Projectors'],
            ['category' => 'Machine', 'subcategory' => 'Blood_pressure_monitor', 'name' => 'Manual'],
            ['category' => 'Machine', 'subcategory' => 'Computer_Case', 'name' => 'Computer Case'],
            ['category' => 'Machine', 'subcategory' => 'General', 'name' => 'Automated'],
            ['category' => 'Machine', 'subcategory' => 'General', 'name' => 'Money Counter'],
            ['category' => 'Machine', 'subcategory' => 'General', 'name' => 'Shredder'],
            ['category' => 'Machine', 'subcategory' => 'Mouse', 'name' => 'Mouse'],
            ['category' => 'Machine', 'subcategory' => 'Punching_Machine', 'name' => 'Punching Machine'],
            ['category' => 'Machine', 'subcategory' => 'Safe_Money', 'name' => 'Safe monry with lock'],
            ['category' => 'Machine', 'subcategory' => 'sprayer', 'name' => 'Manual'],
            ['category' => 'Machine', 'subcategory' => 'water_pump_power', 'name' => 'water pump power'],
            ['category' => 'Vehicles', 'subcategory' => 'Bus', 'name' => 'Mini Bus'],
            ['category' => 'Vehicles', 'subcategory' => 'Car', 'name' => 'rapid'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'Double-Decker Bus'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'Full-Size Bus'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'Midibus'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'Part'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'SUV'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'School bus'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'closed'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'sedan'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'name' => 'trailer'],
            ['category' => 'Vehicles', 'subcategory' => 'Moto', 'name' => 'Scooter'],
            ['category' => 'Vehicles', 'subcategory' => 'Pickup_Trucks', 'name' => 'small'],
            ['category' => 'Vehicles', 'subcategory' => 'mini_van', 'name' => 'H1'],
            ['category' => 'appliances', 'subcategory' => 'AC', 'name' => 'AC inverter'],
            ['category' => 'appliances', 'subcategory' => 'Battery', 'name' => 'Gel battery'],
            ['category' => 'appliances', 'subcategory' => 'DVR', 'name' => 'DVR'],
            ['category' => 'appliances', 'subcategory' => 'Electric_cooker', 'name' => 'Electric_cooker'],
            ['category' => 'appliances', 'subcategory' => 'Electric_drill', 'name' => 'Electric drill with battery'],
            ['category' => 'appliances', 'subcategory' => 'External_DVD', 'name' => 'External_DVD'],
            ['category' => 'appliances', 'subcategory' => 'Fan', 'name' => 'Ceiling fan'],
            ['category' => 'appliances', 'subcategory' => 'Fire_extinguisher', 'name' => 'Foam fire extinguisher'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'AC non inverter'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Carbon dioxide (CO2) fire extinguisher'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Diesel Heaters'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Electric and Diesel Heaters'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Electric drill without drill'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Gas and electric heater'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Gaz Heaters'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Gaz_bottle'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Lead-acid battery'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Lithium battery'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Microwave'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Oxygen_Machine'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Portable Heaters'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Powder fire extinguisher'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Recorder'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Refrigerator'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Stand fan'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Stove and gas oven'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'TV'],
            ['category' => 'appliances', 'subcategory' => 'General', 'name' => 'Wall fan'],
            ['category' => 'appliances', 'subcategory' => 'Heater', 'name' => 'Electric heaters'],
            ['category' => 'appliances', 'subcategory' => 'Hoover', 'name' => 'Hoover'],
            ['category' => 'appliances', 'subcategory' => 'Mixer', 'name' => 'Mixer'],
            ['category' => 'appliances', 'subcategory' => 'Stove', 'name' => 'Stove'],
            ['category' => 'appliances', 'subcategory' => 'TV', 'name' => 'Smart TV'],
            ['category' => 'appliances', 'subcategory' => 'computer_screen', 'name' => 'computer_screen'],
            ['category' => 'appliances', 'subcategory' => 'kettle', 'name' => 'Electric kettle'],
            ['category' => 'appliances', 'subcategory' => 'water_cooler', 'name' => 'Hot and Cold Water Dispensers']
        ] as $row) {
            $key = $catId[$row['category']] . '::' . $row['subcategory'];
            if (!isset($subId[$key]))
                continue;
            $fixed[] = [
                'sub_id' => $subId[$key],
                'name' => $row['name'],
            ];
        }
        DB::table('fixed_items')->upsert($fixed, ['sub_id', 'name'], []);

        DB::table('attributes')->upsert(
            [
                ['name' => 'Cyllenders'],
                ['name' => 'Gear Transmission'],
                ['name' => 'Load weight'],
                ['name' => 'Material'],
                ['name' => 'Number of Passengers'],
                ['name' => 'Size'],
                ['name' => 'cubic capacity CC']
            ],
            ['name'],
            []
        );
        $attrId = DB::table('attributes')->pluck('id', 'name');

        $canon = function (?string $s): string {
            $s = (string) $s;
            $s = preg_replace('/\s+/u', ' ', trim($s));
            return mb_strtolower($s);
        };
        $clean = function ($s): string {
            // what we will store as value (first-seen original, but trimmed)
            return preg_replace('/\s+/u', ' ', trim((string) $s));
        };

        $catAttr = [];
        foreach ([
            ['category' => 'Computer', 'attr' => 'Size'],
            ['category' => 'Furniture', 'attr' => 'Material'],
            ['category' => 'Furniture', 'attr' => 'Size'],
            ['category' => 'IT Equipment', 'attr' => 'Size'],
            ['category' => 'Machine', 'attr' => 'Material'],
            ['category' => 'Machine', 'attr' => 'Size'],
            ['category' => 'Vehicles', 'attr' => 'Cyllenders'],
            ['category' => 'Vehicles', 'attr' => 'Gear Transmission'],
            ['category' => 'Vehicles', 'attr' => 'Load weight'],
            ['category' => 'Vehicles', 'attr' => 'Number of Passengers'],
            ['category' => 'Vehicles', 'attr' => 'cubic capacity CC'],
            ['category' => 'appliances', 'attr' => 'Material'],
            ['category' => 'appliances', 'attr' => 'Size']
        ] as $row) {
            $catAttr[] = [
                'category_id' => $catId[$row['category']],
                'att_id' => $attrId[$row['attr']],
            ];
        }
        if (!empty($catAttr)) {
            DB::table('category_attributes')->upsert($catAttr, ['category_id', 'att_id'], []);
        }

        $seenOptions = [];
        foreach ([
            ['attr' => 'Cyllenders', 'value' => '12.0'],
            ['attr' => 'Cyllenders', 'value' => '4.0'],
            ['attr' => 'Cyllenders', 'value' => '6.0'],
            ['attr' => 'Cyllenders', 'value' => '8.0'],
            ['attr' => 'Gear Transmission', 'value' => 'Automated'],
            ['attr' => 'Gear Transmission', 'value' => 'manual'],
            ['attr' => 'Load weight', 'value' => '5 TON'],
            ['attr' => 'Load weight', 'value' => '6 TON'],
            ['attr' => 'Material', 'value' => 'Aluminum'],
            ['attr' => 'Material', 'value' => 'Aluminum&stainless'],
            ['attr' => 'Material', 'value' => 'Brand'],
            ['attr' => 'Material', 'value' => 'Cotton'],
            ['attr' => 'Material', 'value' => 'Glass&wood'],
            ['attr' => 'Material', 'value' => 'Iron'],
            ['attr' => 'Material', 'value' => 'Iron & Wood'],
            ['attr' => 'Material', 'value' => 'No portable'],
            ['attr' => 'Material', 'value' => 'Plastic'],
            ['attr' => 'Material', 'value' => 'Portable'],
            ['attr' => 'Material', 'value' => 'Quadruple reception chair'],
            ['attr' => 'Material', 'value' => 'Stainless Steel'],
            ['attr' => 'Material', 'value' => 'Wood'],
            ['attr' => 'Material', 'value' => 'Wood&fabric'],
            ['attr' => 'Material', 'value' => 'bar'],
            ['attr' => 'Material', 'value' => 'brand'],
            ['attr' => 'Material', 'value' => 'fabric'],
            ['attr' => 'Material', 'value' => 'iron'],
            ['attr' => 'Material', 'value' => 'leather'],
            ['attr' => 'Material', 'value' => 'leather&wood'],
            ['attr' => 'Material', 'value' => 'plastic'],
            ['attr' => 'Material', 'value' => 'wood'],
            ['attr' => 'Number of Passengers', 'value' => '11 passenger'],
            ['attr' => 'Number of Passengers', 'value' => '12 passenger'],
            ['attr' => 'Number of Passengers', 'value' => '14 passenger'],
            ['attr' => 'Number of Passengers', 'value' => '2'],
            ['attr' => 'Number of Passengers', 'value' => '30 passenger'],
            ['attr' => 'Number of Passengers', 'value' => '5'],
            ['attr' => 'Number of Passengers', 'value' => '7'],
            ['attr' => 'Number of Passengers', 'value' => '9 passenger'],
            ['attr' => 'Size', 'value' => '100 AM'],
            ['attr' => 'Size', 'value' => '12 kg'],
            ['attr' => 'Size', 'value' => '12000'],
            ['attr' => 'Size', 'value' => '128 GB'],
            ['attr' => 'Size', 'value' => '14–16 inches tall'],
            ['attr' => 'Size', 'value' => '16 (40 cm)'],
            ['attr' => 'Size', 'value' => '18 (45 cm)'],
            ['attr' => 'Size', 'value' => '2 Kg'],
            ['attr' => 'Size', 'value' => '2 drawers'],
            ['attr' => 'Size', 'value' => '2 shelves'],
            ['attr' => 'Size', 'value' => '20 L'],
            ['attr' => 'Size', 'value' => '200 AM'],
            ['attr' => 'Size', 'value' => '2000 Mga pixel'],
            ['attr' => 'Size', 'value' => '25 L'],
            ['attr' => 'Size', 'value' => '250 AM'],
            ['attr' => 'Size', 'value' => '3 drawers'],
            ['attr' => 'Size', 'value' => '3000 Mga pixel'],
            ['attr' => 'Size', 'value' => '32 inch'],
            ['attr' => 'Size', 'value' => '32GB'],
            ['attr' => 'Size', 'value' => '3500 Mga pixel'],
            ['attr' => 'Size', 'value' => '36(91 cm)'],
            ['attr' => 'Size', 'value' => '4 kg'],
            ['attr' => 'Size', 'value' => '4 shelves'],
            ['attr' => 'Size', 'value' => '42 inch'],
            ['attr' => 'Size', 'value' => '50 inch'],
            ['attr' => 'Size', 'value' => '500 L'],
            ['attr' => 'Size', 'value' => '55 inch'],
            ['attr' => 'Size', 'value' => '6 kg'],
            ['attr' => 'Size', 'value' => '60 inch'],
            ['attr' => 'Size', 'value' => '64GB'],
            ['attr' => 'Size', 'value' => '9000'],
            ['attr' => 'Size', 'value' => 'Big'],
            ['attr' => 'Size', 'value' => 'Double'],
            ['attr' => 'Size', 'value' => 'Havy Duty'],
            ['attr' => 'Size', 'value' => 'Large'],
            ['attr' => 'Size', 'value' => 'Large Printer'],
            ['attr' => 'Size', 'value' => 'Medium Fridges 200 to 400 liters'],
            ['attr' => 'Size', 'value' => 'Medium Microwaves - 28 to 42 liters'],
            ['attr' => 'Size', 'value' => 'Single'],
            ['attr' => 'Size', 'value' => 'Small'],
            ['attr' => 'Size', 'value' => 'Stove with 2 Burners'],
            ['attr' => 'Size', 'value' => 'Stove with 3 Burners'],
            ['attr' => 'Size', 'value' => 'large'],
            ['attr' => 'Size', 'value' => 'medium'],
            ['attr' => 'Size', 'value' => 'single'],
            ['attr' => 'Size', 'value' => 'small'],
            ['attr' => 'Size', 'value' => 'small Printer'],
            ['attr' => 'Size', 'value' => 'two-seater'],
            ['attr' => 'cubic capacity CC', 'value' => '1000cc'],
            ['attr' => 'cubic capacity CC', 'value' => '1200cc'],
            ['attr' => 'cubic capacity CC', 'value' => '150 cc'],
            ['attr' => 'cubic capacity CC', 'value' => '200 cc'],
            ['attr' => 'cubic capacity CC', 'value' => '2000cc'],
            ['attr' => 'cubic capacity CC', 'value' => '2200cc'],
            ['attr' => 'cubic capacity CC', 'value' => '2400cc'],
            ['attr' => 'cubic capacity CC', 'value' => '2500cc'],
            ['attr' => 'cubic capacity CC', 'value' => '2700cc'],
            ['attr' => 'cubic capacity CC', 'value' => '600cc'],
            ['attr' => 'cubic capacity CC', 'value' => '800cc'],
            ['attr' => 'cubic capacity CC', 'value' => '900cc']
        ] as $row) {
            $attName = $row['attr'];
            $valOrig = $row['value'];

            if (!isset($attrId[$attName]))
                continue;
            $att = $attrId[$attName];

            $cv = $canon($valOrig);        // canonical (for dedup)
            if ($cv === '')
                continue;

            $ov = $clean($valOrig);        // store cleaned original
            if (!isset($seenOptions[$att]))
                $seenOptions[$att] = [];
            if (!isset($seenOptions[$att][$cv])) {
                $seenOptions[$att][$cv] = $ov; // keep first original form
            }
        }

        $optionRows = [];
        foreach ($seenOptions as $att => $map) {
            foreach ($map as $cv => $ov) {
                $optionRows[] = ['att_id' => $att, 'value' => $ov];
            }
        }

        if (!empty($optionRows)) {
            DB::table('att_options')->upsert($optionRows, ['att_id', 'value'], []);
        }

        $optRows = DB::table('att_options')->get(['id', 'att_id', 'value']);
        $optId = [];
        foreach ($optRows as $r) {
            $optId[$r->att_id . '::' . $r->value] = $r->id;
        }

        $subCatOpts = [];
        foreach ([
            ['category' => 'Furniture', 'subcategory' => 'chair', 'attr' => 'Material', 'value' => 'Wood'],
            ['category' => 'Furniture', 'subcategory' => 'chair', 'attr' => 'Size', 'value' => 'single'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Wood'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'plastic'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'leather'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'No portable'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'bar'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Aluminum&stainless'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Iron & Wood'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'iron'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Quadruple reception chair'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'fabric'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Glass&wood'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Wood&fabric'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'Aluminum'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '12 kg'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '3 drawers'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Medium Microwaves - 28 to 42 liters'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Stove with 3 Burners'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '36(91 cm)'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'two-seater'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'large'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'small'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Medium Fridges 200 to 400 liters'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'medium'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Large'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '4 shelves'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '200 AM'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '42 inch'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Big'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '18 (45 cm)'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '12000'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '25 L'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Double'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '2 drawers'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '4 kg'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '6 kg'],
            ['category' => 'Furniture', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '250 AM'],
            ['category' => 'Furniture', 'subcategory' => 'Cabinet', 'attr' => 'Material', 'value' => 'Iron'],
            ['category' => 'Furniture', 'subcategory' => 'Cabinet', 'attr' => 'Size', 'value' => '2 shelves'],
            ['category' => 'Furniture', 'subcategory' => 'Table', 'attr' => 'Material', 'value' => 'Plastic'],
            ['category' => 'Furniture', 'subcategory' => 'Table', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'Furniture', 'subcategory' => 'Desk', 'attr' => 'Material', 'value' => 'wood'],
            ['category' => 'Furniture', 'subcategory' => 'Desk', 'attr' => 'Size', 'value' => 'small'],
            ['category' => 'Furniture', 'subcategory' => 'Sofa', 'attr' => 'Material', 'value' => 'leather&wood'],
            ['category' => 'Furniture', 'subcategory' => 'Sofa', 'attr' => 'Size', 'value' => 'Single'],
            ['category' => 'Furniture', 'subcategory' => 'Curtain', 'attr' => 'Material', 'value' => 'Cotton'],
            ['category' => 'Furniture', 'subcategory' => 'Diesel_Tank', 'attr' => 'Material', 'value' => 'Plastic'],
            ['category' => 'Furniture', 'subcategory' => 'Diesel_Tank', 'attr' => 'Size', 'value' => '500 L'],
            ['category' => 'Furniture', 'subcategory' => 'Cork_Board', 'attr' => 'Material', 'value' => 'Wood'],
            ['category' => 'Furniture', 'subcategory' => 'Cork_Board', 'attr' => 'Size', 'value' => 'small'],
            ['category' => 'Furniture', 'subcategory' => 'White_Board', 'attr' => 'Material', 'value' => 'Wood'],
            ['category' => 'Furniture', 'subcategory' => 'White_Board', 'attr' => 'Size', 'value' => 'small'],
            ['category' => 'Furniture', 'subcategory' => 'AC', 'attr' => 'Material', 'value' => 'Portable'],
            ['category' => 'Furniture', 'subcategory' => 'AC', 'attr' => 'Size', 'value' => '9000'],
            ['category' => 'Furniture', 'subcategory' => 'Stove', 'attr' => 'Material', 'value' => 'Stainless Steel'],
            ['category' => 'Furniture', 'subcategory' => 'Stove', 'attr' => 'Size', 'value' => 'Stove with 2 Burners'],
            ['category' => 'Furniture', 'subcategory' => 'Fire_extinguisher', 'attr' => 'Material', 'value' => 'Stainless Steel'],
            ['category' => 'Furniture', 'subcategory' => 'Fire_extinguisher', 'attr' => 'Size', 'value' => '2 Kg'],
            ['category' => 'Furniture', 'subcategory' => 'Heater', 'attr' => 'Material', 'value' => 'Stainless Steel'],
            ['category' => 'Furniture', 'subcategory' => 'Heater', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'Furniture', 'subcategory' => 'Fan', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'Fan', 'attr' => 'Size', 'value' => '16 (40 cm)'],
            ['category' => 'Furniture', 'subcategory' => 'Battery', 'attr' => 'Material', 'value' => 'Brand'],
            ['category' => 'Furniture', 'subcategory' => 'Battery', 'attr' => 'Size', 'value' => '100 AM'],
            ['category' => 'Furniture', 'subcategory' => 'Hoover', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'kettle', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'kettle', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'Furniture', 'subcategory' => 'TV', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'TV', 'attr' => 'Size', 'value' => '32 inch'],
            ['category' => 'Furniture', 'subcategory' => 'Electric_drill', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'External_DVD', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'DVR', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'Electric_cooker', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'Mixer', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'computer_screen', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Furniture', 'subcategory' => 'Safe_Money', 'attr' => 'Material', 'value' => 'Iron'],
            ['category' => 'Furniture', 'subcategory' => 'Safe_Money', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'Furniture', 'subcategory' => 'sprayer', 'attr' => 'Size', 'value' => '20 L'],
            ['category' => 'appliances', 'subcategory' => 'AC', 'attr' => 'Material', 'value' => 'Portable'],
            ['category' => 'appliances', 'subcategory' => 'AC', 'attr' => 'Size', 'value' => '9000'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'No portable'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '12 kg'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Big'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '18 (45 cm)'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Stove with 3 Burners'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '12000'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Large'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '36(91 cm)'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'large'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Medium Microwaves - 28 to 42 liters'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '200 AM'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '4 kg'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '6 kg'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '250 AM'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Medium Fridges 200 to 400 liters'],
            ['category' => 'appliances', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '42 inch'],
            ['category' => 'appliances', 'subcategory' => 'Stove', 'attr' => 'Material', 'value' => 'Stainless Steel'],
            ['category' => 'appliances', 'subcategory' => 'Stove', 'attr' => 'Size', 'value' => 'Stove with 2 Burners'],
            ['category' => 'appliances', 'subcategory' => 'Fire_extinguisher', 'attr' => 'Material', 'value' => 'Stainless Steel'],
            ['category' => 'appliances', 'subcategory' => 'Fire_extinguisher', 'attr' => 'Size', 'value' => '2 Kg'],
            ['category' => 'appliances', 'subcategory' => 'Heater', 'attr' => 'Material', 'value' => 'Stainless Steel'],
            ['category' => 'appliances', 'subcategory' => 'Heater', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'appliances', 'subcategory' => 'Fan', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'Fan', 'attr' => 'Size', 'value' => '16 (40 cm)'],
            ['category' => 'appliances', 'subcategory' => 'Battery', 'attr' => 'Material', 'value' => 'Brand'],
            ['category' => 'appliances', 'subcategory' => 'Battery', 'attr' => 'Size', 'value' => '100 AM'],
            ['category' => 'appliances', 'subcategory' => 'Hoover', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'kettle', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'kettle', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'appliances', 'subcategory' => 'TV', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'TV', 'attr' => 'Size', 'value' => '32 inch'],
            ['category' => 'appliances', 'subcategory' => 'Electric_drill', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'External_DVD', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'DVR', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'Electric_cooker', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'Mixer', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'appliances', 'subcategory' => 'computer_screen', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Machine', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'brand'],
            ['category' => 'Machine', 'subcategory' => 'General', 'attr' => 'Material', 'value' => 'iron'],
            ['category' => 'Machine', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Big'],
            ['category' => 'Machine', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '25 L'],
            ['category' => 'Machine', 'subcategory' => 'Safe_Money', 'attr' => 'Material', 'value' => 'Iron'],
            ['category' => 'Machine', 'subcategory' => 'Safe_Money', 'attr' => 'Size', 'value' => 'Small'],
            ['category' => 'Machine', 'subcategory' => 'sprayer', 'attr' => 'Size', 'value' => '20 L'],
            ['category' => 'Vehicles', 'subcategory' => 'Moto', 'attr' => 'cubic capacity CC', 'value' => '150 cc'],
            ['category' => 'Vehicles', 'subcategory' => 'Moto', 'attr' => 'Gear Transmission', 'value' => 'manual'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '1200cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '900cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '200 cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '2700cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '2200cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '2400cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '2500cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'cubic capacity CC', 'value' => '800cc'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Gear Transmission', 'value' => 'Automated'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Cyllenders', 'value' => '12.0'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Cyllenders', 'value' => '8.0'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Cyllenders', 'value' => '6.0'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Number of Passengers', 'value' => '11 passenger'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Number of Passengers', 'value' => '12 passenger'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Number of Passengers', 'value' => '14 passenger'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Number of Passengers', 'value' => '5'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Number of Passengers', 'value' => '7'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Number of Passengers', 'value' => '30 passenger'],
            ['category' => 'Vehicles', 'subcategory' => 'General', 'attr' => 'Load weight', 'value' => '6 TON'],
            ['category' => 'Vehicles', 'subcategory' => 'Car', 'attr' => 'Cyllenders', 'value' => '4.0'],
            ['category' => 'Vehicles', 'subcategory' => 'Car', 'attr' => 'cubic capacity CC', 'value' => '600cc'],
            ['category' => 'Vehicles', 'subcategory' => 'Car', 'attr' => 'Number of Passengers', 'value' => '2'],
            ['category' => 'Vehicles', 'subcategory' => 'Bus', 'attr' => 'Cyllenders', 'value' => '4.0'],
            ['category' => 'Vehicles', 'subcategory' => 'Bus', 'attr' => 'cubic capacity CC', 'value' => '2000cc'],
            ['category' => 'Vehicles', 'subcategory' => 'Bus', 'attr' => 'Number of Passengers', 'value' => '9 passenger'],
            ['category' => 'Vehicles', 'subcategory' => 'mini_van', 'attr' => 'Cyllenders', 'value' => '4.0'],
            ['category' => 'Vehicles', 'subcategory' => 'mini_van', 'attr' => 'cubic capacity CC', 'value' => '1000cc'],
            ['category' => 'Vehicles', 'subcategory' => 'mini_van', 'attr' => 'Number of Passengers', 'value' => '9 passenger'],
            ['category' => 'Vehicles', 'subcategory' => 'Pickup_Trucks', 'attr' => 'Cyllenders', 'value' => '4.0'],
            ['category' => 'Vehicles', 'subcategory' => 'Pickup_Trucks', 'attr' => 'cubic capacity CC', 'value' => '2000cc'],
            ['category' => 'Vehicles', 'subcategory' => 'Pickup_Trucks', 'attr' => 'Load weight', 'value' => '5 TON'],
            ['category' => 'IT Equipment', 'subcategory' => 'Monitors', 'attr' => 'Size', 'value' => '32 inch'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '128 GB'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '3500 Mga pixel'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Large Printer'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '3000 Mga pixel'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '50 inch'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '60 inch'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => 'Havy Duty'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '64GB'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '55 inch'],
            ['category' => 'IT Equipment', 'subcategory' => 'General', 'attr' => 'Size', 'value' => '42 inch'],
            ['category' => 'IT Equipment', 'subcategory' => 'projector', 'attr' => 'Size', 'value' => '2000 Mga pixel'],
            ['category' => 'IT Equipment', 'subcategory' => 'Camera', 'attr' => 'Size', 'value' => '32GB'],
            ['category' => 'IT Equipment', 'subcategory' => 'Printer', 'attr' => 'Size', 'value' => 'small Printer'],
            ['category' => 'Computer', 'subcategory' => 'Desktop', 'attr' => 'Size', 'value' => '14–16 inches tall']
        ] as $row) {
            $catKey = $catId[$row['category']] . '::' . $row['subcategory'];
            if (!isset($subId[$catKey]))
                continue;
            $sub = $subId[$catKey];
            $aoKey = $attrId[$row['attr']] . '::' . $canon($row['value']);
            if (!isset($optId[$aoKey]))
                continue;
            $subCatOpts[] = [
                'sub_category_id' => $sub,
                'att_option_id' => $optId[$aoKey],
            ];
        }
        $seen = [];
        $dedup = [];
        foreach ($subCatOpts as $x) {
            $key = $x['sub_category_id'] . '::' . $x['att_option_id'];
            if (isset($seen[$key]))
                continue;
            $seen[$key] = true;
            $dedup[] = $x;
        }
        if (!empty($dedup)) {
            DB::table('sub_category_att_options')->upsert($dedup, ['sub_category_id', 'att_option_id'], []);
        }
    }
}
