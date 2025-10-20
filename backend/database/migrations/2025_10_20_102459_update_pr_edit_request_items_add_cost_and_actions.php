<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pr_edit_request_items', function (Blueprint $t) {
            // Add old/new unit cost; keep precision consistent with pr_items
            $t->decimal('old_unit_cost', 12, 2)->nullable()->after('new_supplier_id');
            $t->decimal('new_unit_cost', 12, 2)->nullable()->after('old_unit_cost');
        });

        // Fix typo and extend enum values:
        // MySQL requires full MODIFY with the full enum set.
        DB::statement("
            ALTER TABLE pr_edit_request_items 
            MODIFY COLUMN action ENUM('add','delete','update_supplier','update_cost') NOT NULL
        ");
    }

    public function down(): void
    {
        // Revert enum to previous (WARNING: change to your original set if different)
        DB::statement("
            ALTER TABLE pr_edit_request_items 
            MODIFY COLUMN action ENUM('dalete','add') NOT NULL
        ");

        Schema::table('pr_edit_request_items', function (Blueprint $t) {
            $t->dropColumn(['old_unit_cost','new_unit_cost']);
        });
    }
};
