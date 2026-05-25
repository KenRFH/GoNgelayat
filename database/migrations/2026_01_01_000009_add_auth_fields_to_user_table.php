<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds Laravel authentication columns (name, email, password, remember_token)
     * to the existing `user` table so it can be used with Laravel Auth.
     */
    public function up(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->string('name', 100)->nullable()->after('id');
            $table->string('email', 255)->unique()->nullable()->after('name');
            $table->string('password', 255)->nullable()->after('email');
            $table->rememberToken()->after('password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->dropColumn(['name', 'email', 'password', 'remember_token']);
        });
    }
};
