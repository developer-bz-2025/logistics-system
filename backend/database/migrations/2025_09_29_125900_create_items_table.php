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
        Schema::create('items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('fixed_item_id')->constrained('fixed_items');

            $table->string('description')->nullable();
            // SN is optional but must be unique if present
            $table->string('sn')->nullable()->unique();

            $table->foreignId('color_id')->nullable()->constrained('colors');
            $table->foreignId('brand_id')->nullable()->constrained('brands');

            $table->foreignId('pr_id')->nullable()->constrained('prs');

            $table->decimal('acquisition_cost', 14, 2)->nullable();
            $table->date('acquisition_date')->nullable();
            $table->date('warranty_start_date')->nullable();
            $table->date('warranty_end_date')->nullable();

            $table->string('budget_code')->nullable();
            $table->string('budget_donor')->nullable();

            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->foreignId('location_id')->nullable()->constrained('locations');
            $table->foreignId('floor_id')->nullable()->constrained('floors');
            $table->foreignId('status_id')->nullable()->constrained('status');

            $table->text('notes')->nullable();

            $table->foreignId('holder_user_id')->nullable()->constrained('users');
            $table->foreignId('created_by')->nullable()->constrained('users');

            $table->timestamps();

            // Query helpers
            $table->index(['location_id', 'status_id']);
            $table->index('fixed_item_id');
            $table->index('holder_user_id');
            $table->index('warranty_end_date');
        });;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
