<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','school','teacher','parent','stockkeeper') NOT NULL DEFAULT 'parent'");
    }

    public function down(): void
    {
        // Move any stockkeeper users to parent before reverting
        DB::statement("UPDATE users SET role = 'parent' WHERE role = 'stockkeeper'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','school','teacher','parent') NOT NULL DEFAULT 'parent'");
    }
};
