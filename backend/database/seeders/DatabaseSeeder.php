<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        \Artisan::call('app:sync-employees');

        $this->call([
            StatusSeeder::class,
            MaintenanceStatusSeeder::class,
            ChangeStatusSeeder::class,
            RoleSeeder::class,
            CatalogWithAttributesFromJsonSeeder::class,
            BrandsSuppliersManualSeeder::class,
            LocationSeeder::class,
            FloorSeeder::class,
            ColorSeeder::class,
        ]);


        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}
