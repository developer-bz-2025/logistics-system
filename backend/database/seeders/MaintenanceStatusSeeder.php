<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class MaintenanceStatusSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data for fresh seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('maintenance_status')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $rows = [
            ['name' => 'In Progress'],
            ['name' => 'Completed'],
            ['name' => 'Pending Approval'],
            ['name' => 'Cancelled'],
        ];

        // Insert fresh data
        DB::table('maintenance_status')->insert($rows);
    }
}
