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
        Schema::create('pr_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pr_id')->constrained('prs')->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->foreignId('fixed_item_id')->constrained('fixed_items');

            $table->integer('qty')->default(1);
            $table->decimal('unit_cost', 14, 2)->default(0);
            $table->string('currency', 8)->default('USD');

            $table->timestamps();

            $table->index(['pr_id', 'fixed_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pr_items');
    }
};
