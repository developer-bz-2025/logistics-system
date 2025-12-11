<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FloorSeeder extends Seeder
{
    public function run(): void
    {
        $floorNames = ['-1st floor','0th floor','1st floor','2nd floor','3rd floor','4th floor','5th floor','6th floor'];

        foreach ($floorNames as $name) {
            DB::table('floors')->updateOrInsert(['location_id' => null,'name' => $name], []);
        }


    }
}
