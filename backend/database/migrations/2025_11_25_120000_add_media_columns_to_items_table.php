<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            if (! Schema::hasColumn('items', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('notes');
            }

            if (! Schema::hasColumn('items', 'details_pdf_path')) {
                $table->string('details_pdf_path')->nullable()->after('photo_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            if (Schema::hasColumn('items', 'photo_path')) {
                $table->dropColumn('photo_path');
            }

            if (Schema::hasColumn('items', 'details_pdf_path')) {
                $table->dropColumn('details_pdf_path');
            }
        });
    }
};

