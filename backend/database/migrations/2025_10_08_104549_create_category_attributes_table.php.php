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
        Schema::create('category_attributes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $t->foreignId('att_id')->constrained('attributes')->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['category_id', 'att_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_attributes');

    }
};
