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
        Schema::table('pr_edit_requests', function (Blueprint $t) {
            $t->unsignedBigInteger('approved_by_admin_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pr_edit_requests', function (Blueprint $t) {
            $t->unsignedBigInteger('approved_by_admin_id')->nullable(false)->change();
        });
    }
};
