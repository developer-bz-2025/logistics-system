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
        Schema::create('att_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('att_id')->constrained('attributes')->cascadeOnDelete();
            $table->string('value');
            $table->timestamps();

            $table->unique(['att_id','value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('att_options');
    }
};
