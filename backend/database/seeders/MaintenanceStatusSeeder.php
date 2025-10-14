<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class MaintenanceStatusSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['name' => 'In Progress'],
            ['name' => 'Completed'],
            ['name' => 'Pending Approval'],
            ['name' => 'Cancelled'],
        ];

        // Idempotent: unique key is on `name`
        DB::table('maintenance_status')->upsert($rows, ['name'], []);
    }
}