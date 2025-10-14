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
        Schema::create('pr_edit_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pr_id')->constrained('prs')->cascadeOnDelete();
            $table->foreignId('requested_by_admin_id')->constrained('users');
            $table->foreignId('approved_by_admin_id')->constrained('users');
            $table->foreignId('status_id')->constrained('change_status');

            $table->dateTime('request_date')->useCurrent();

            $table->string('old_pr_code')->nullable();
            $table->string('new_pr_code')->nullable();

            $table->date('old_acquisition_date')->nullable();
            $table->date('new_acquisition_date')->nullable();

            $table->string('old_pr_path')->nullable();
            $table->string('new_pr_path')->nullable();

            $table->decimal('old_total_price', 14, 2)->nullable();
            $table->decimal('new_total_price', 14, 2)->nullable();

            $table->timestamps();

            $table->index(['pr_id','status_id','request_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pr_edit_requests');
    }
};
