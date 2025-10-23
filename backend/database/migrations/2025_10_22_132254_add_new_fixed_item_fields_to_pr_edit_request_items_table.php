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
        Schema::table('pr_edit_request_items', function (Blueprint $table) {
            // new_fixed_item_id → FK to fixed_items
            $table->foreignId('new_fixed_item_id')
                ->nullable()
                ->after('new_supplier_id')
                ->constrained('fixed_items')
                ->nullOnDelete();

            // Optional: quantity for new items
            if (!Schema::hasColumn('pr_edit_request_items', 'qty')) {
                $table->decimal('qty', 12, 2)->nullable()->after('new_unit_cost');
            }

            // Optional: currency for new items
            if (!Schema::hasColumn('pr_edit_request_items', 'currency')) {
                $table->string('currency', 10)->nullable()->after('qty');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pr_edit_request_items', function (Blueprint $table) {
            $table->dropForeign(['new_fixed_item_id']);
            $table->dropColumn(['new_fixed_item_id', 'qty', 'currency']);
        });
    }
};
