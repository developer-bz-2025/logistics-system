<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('location_change_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('current_location_id')->constrained('locations');
            $table->foreignId('requested_location_id')->constrained('locations');

            $table->foreignId('requested_by_admin_id')->constrained('users');
            $table->foreignId('approved_by_admin_id')->nullable()->constrained('users');

            $table->foreignId('change_location_status_id')->constrained('change_status');

            $table->timestamp('request_date')->useCurrent();
            $table->timestamp('approval_date')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            // $table->index(['item_id','change_location_status_id','request_date']);
            $table->index(
                ['item_id', 'change_location_status_id', 'request_date'],
                'idx_lcr_item_status_date'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('location_change_requests');
    }
};
