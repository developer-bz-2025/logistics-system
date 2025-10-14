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
        Schema::create('sub_category_att_options', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sub_category_id')->constrained('sub_category')->cascadeOnDelete();
            $t->foreignId('att_option_id')->constrained('att_options')->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['sub_category_id', 'att_option_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_category_att_options');

    }
};
