<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prs', function (Blueprint $table) {
            if (!Schema::hasColumn('prs', 'location_id')) {
                $table->foreignId('location_id')->nullable()->constrained('locations')->after('pr_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prs', function (Blueprint $table) {
            if (Schema::hasColumn('prs', 'location_id')) {
                $table->dropForeign(['location_id']);
                $table->dropColumn('location_id');
            }
        });
    }
};