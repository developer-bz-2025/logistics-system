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
        Schema::create('item_attribute_values', function (Blueprint $t) {
            $t->id();
            $t->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $t->foreignId('att_id')->constrained('attributes')->cascadeOnDelete();
            $t->foreignId('att_option_id')->nullable()->constrained('att_options')->nullOnDelete();
            // Optional free text for attributes that have no predefined options (rare)
            $t->string('free_text')->nullable();

            // One value per (item, attribute)
            $t->unique(['item_id','att_id']);
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_attribute_values');
    }
};
