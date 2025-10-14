<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class ChangeStatusSeeder extends Seeder
{
    public function run(): void
    {

        $rows = [
            ['value' => 'Pending'],
            ['value' => 'Approved'],
            ['value' => 'Rejected'],
        ];

        // Idempotent: unique key is on `name`
        DB::table('change_status')->upsert($rows, ['value'], []);

     
    }
}