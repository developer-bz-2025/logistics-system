<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify enum to include finance role
        DB::statement("ALTER TABLE roles MODIFY COLUMN name ENUM('pr_admin', 'log_admin', 'super_admin', 'finance') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove finance role from enum
        DB::statement("ALTER TABLE roles MODIFY COLUMN name ENUM('pr_admin', 'log_admin', 'super_admin') NOT NULL");
    }
};
