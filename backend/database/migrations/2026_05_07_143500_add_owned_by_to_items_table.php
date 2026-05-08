<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('owned_by', 20)->default('BZ')->after('notes');
            $table->index('owned_by');
        });

        DB::table('items')
            ->whereNull('owned_by')
            ->orWhere('owned_by', '')
            ->update(['owned_by' => 'BZ']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['owned_by']);
            $table->dropColumn('owned_by');
        });
    }
};
