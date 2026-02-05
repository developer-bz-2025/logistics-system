<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pr_edit_requests', function (Blueprint $table) {
            $table->foreignId('old_location_id')->nullable()->constrained('locations')->after('new_total_price');
            $table->foreignId('new_location_id')->nullable()->constrained('locations')->after('old_location_id');
        });
    }

    public function down(): void
    {
        Schema::table('pr_edit_requests', function (Blueprint $table) {
            $table->dropForeign(['new_location_id']);
            $table->dropForeign(['old_location_id']);
            $table->dropColumn(['new_location_id', 'old_location_id']);
        });
    }
};