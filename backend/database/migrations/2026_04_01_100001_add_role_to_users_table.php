<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'school', 'teacher', 'parent'])->default('parent')->after('name');
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete()->after('role');
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn(['role', 'school_id', 'phone', 'avatar']);
        });
    }
};
