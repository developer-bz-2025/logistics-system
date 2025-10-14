<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class StatusSeeder extends Seeder
{
    public function run(): void
    {

        $rows = [
            ['name' => 'Functional'],
            ['name' => 'New'],
            ['name' => 'Damaged'],
            ['name' => 'Lost'],
            ['name' => 'Donated'],
            ['name' => 'Stolen'],
            ['name' => 'Transferred'],
        ];

        // Idempotent: unique key is on `name`
        DB::table('status')->upsert($rows, ['name'], []);

       
    }
}