<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prs', function (Blueprint $table) {
            if (! Schema::hasColumn('prs', 'total_items_count')) {
                $table->integer('total_items_count')->default(0)->after('total_price');
            }
            if (! Schema::hasColumn('prs', 'remaining_items_count')) {
                $table->integer('remaining_items_count')->default(0)->after('total_items_count');
            }
        });

        // Calculate and set counts for existing PRs
        DB::statement('
            UPDATE prs 
            SET total_items_count = (
                SELECT COALESCE(SUM(qty), 0) 
                FROM pr_items 
                WHERE pr_items.pr_id = prs.id
            ),
            remaining_items_count = (
                SELECT COALESCE(SUM(qty), 0) - COALESCE((
                    SELECT COUNT(*) 
                    FROM items 
                    WHERE items.pr_id = prs.id
                ), 0)
                FROM pr_items 
                WHERE pr_items.pr_id = prs.id
            )
        ');
    }

    public function down(): void
    {
        Schema::table('prs', function (Blueprint $table) {
            if (Schema::hasColumn('prs', 'total_items_count')) {
                $table->dropColumn('total_items_count');
            }
            if (Schema::hasColumn('prs', 'remaining_items_count')) {
                $table->dropColumn('remaining_items_count');
            }
        });
    }
};
