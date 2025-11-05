<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class StatusSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data for fresh seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('status')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $rows = [
            ['name' => 'Functional'],
            ['name' => 'New'],
            ['name' => 'Damaged'],
            ['name' => 'Lost'],
            ['name' => 'Donated'],
            ['name' => 'Stolen'],
            ['name' => 'Transferred'],
        ];

        // Insert fresh data
        DB::table('status')->insert($rows);
    }
}
