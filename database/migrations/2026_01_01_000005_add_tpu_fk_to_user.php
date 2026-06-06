<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds the tpu_id foreign key to the user table now that
     * tpu exists (resolves the circular dependency).
     */
    public function up(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->foreign('tpu_id')->references('id')->on('tpu')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->dropForeign(['tpu_id']);
        });
    }
};
