<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class ChangeStatusSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data for fresh seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('change_status')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $rows = [
            ['value' => 'Pending'],
            ['value' => 'Approved'],
            ['value' => 'Rejected'],
        ];

        // Insert fresh data
        DB::table('change_status')->insert($rows);
    }
}
