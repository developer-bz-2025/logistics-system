<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $names = ['Shatila','Nabaa','Burj','Tripoli','Akkar','Bekaa','HQ'];

        foreach ($names as $name) {
            DB::table('locations')->updateOrInsert(['name' => $name], []);
        }
    }
}
