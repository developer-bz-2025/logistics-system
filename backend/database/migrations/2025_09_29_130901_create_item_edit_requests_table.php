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
        Schema::create('item_edit_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();

            $table->foreignId('requested_by_admin_id')->constrained('users');
            $table->foreignId('status_id')->constrained('change_status');

            $table->text('requested_changes'); // JSON string or diff blob
            $table->timestamp('submitted_at')->useCurrent();

            $table->foreignId('reviewed_by_admin_id')->nullable()->constrained('users');
            $table->dateTime('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            $table->index(['item_id','status_id','submitted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_edit_requests');
    }
};
