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
        Schema::create('donors', function (Blueprint $table) {
            $table->id();
            $table->string('account_no')->nullable();
            $table->enum('department_name', [
                'education',
                'protection',
                'FSL',
                'peace_building',
                'advocacy_research',
                'support_community',
                'basic_assistance_emergency',
                'capacity_building_admin_support'
            ])->nullable();
            $table->foreignId('finance_officer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('donor');
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donors');
    }
};
