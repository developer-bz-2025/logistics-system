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
        Schema::create('maintenance', function (Blueprint $table) {
            $table->id();
            $table->timestamp('dateIn')->useCurrent();
            $table->timestamp('dateOut')->nullable(); // set when COMPLETE
            $table->foreignId('status_id')->constrained('maintenance_status');
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['item_id','status_id','dateIn']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance');
    }
};
