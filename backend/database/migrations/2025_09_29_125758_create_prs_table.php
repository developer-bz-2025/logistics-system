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
        Schema::create('prs', function (Blueprint $table) {
            $table->id();
            $table->string('pr_code')->unique();
            $table->string('pr_path')->nullable();
            $table->date('pr_date')->nullable();

            // $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            // $table->foreignId('location_id')->nullable()->constrained('locations');

            $table->decimal('total_price', 14, 2)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');

            $table->timestamps();

            // $table->index(['location_id', 'supplier_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prs');
    }
};
