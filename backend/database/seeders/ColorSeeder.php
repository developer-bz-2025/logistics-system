<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class ColorSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data for fresh seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('colors')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $rows = [
            ['name' => 'Red'],
            ['name' => 'Orange'],
            ['name' => 'Yellow'],
            ['name' => 'Brown'],
            ['name' => 'Gold'],
            ['name' => 'Maroon'],
            ['name' => 'Crimson'],
            ['name' => 'Blue'],
            ['name' => 'Green'],
            ['name' => 'Navy'],
            ['name' => 'Black'],
            ['name' => 'White'],
            ['name' => 'Purple'],
            ['name' => 'Cyan'],
            ['name' => 'Turquoise'],
            ['name' => 'Teal'],
            ['name' => 'Gray'],
            ['name' => 'Beige'],
            ['name' => 'Ivory'],
            ['name' => 'Tan'],
            ['name' => 'Move'],
        ];

        // Insert fresh data
        DB::table('colors')->insert($rows);
    }
}
