<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('academic_year', 10)->default('2025/2026');
            $table->unsignedSmallInteger('capacity')->default(30);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
