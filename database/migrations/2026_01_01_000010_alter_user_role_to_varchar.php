<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Changes the `role` column from PostgreSQL ENUM to VARCHAR so it
     * supports values: superadmin, admin, petugas, pengguna.
     */
    public function up(): void
    {
        // Drop the old enum column and replace with varchar
        DB::statement("ALTER TABLE \"user\" DROP COLUMN IF EXISTS role");
        DB::statement("ALTER TABLE \"user\" ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'pengguna'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE \"user\" DROP COLUMN IF EXISTS role");
        DB::statement("ALTER TABLE \"user\" ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'pengguna'");
    }
};
