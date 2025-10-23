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
        Schema::create('pr_edit_request_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pr_edit_request_id')->constrained('pr_edit_requests')->cascadeOnDelete();
            $table->foreignId('pr_item_id')->nullable()->constrained('pr_items')->cascadeOnDelete();

            $table->foreignId('old_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('new_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();

            $table->enum('action', ['delete','add']);

            $table->timestamps();

            $table->index(['pr_edit_request_id','pr_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pr_edit_request_items');
    }
};
