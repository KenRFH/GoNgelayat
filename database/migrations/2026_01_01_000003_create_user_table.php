<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Note: user.blok_tpu_id FK is intentionally omitted here to avoid
     * circular dependency with blok_tpu. It is added in a later migration
     * (add_blok_tpu_fk_to_user) after blok_tpu is created.
     */
    public function up(): void
    {
        Schema::create('user', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('blok_tpu_id')->nullable(); // FK added later
            $table->enum('role', ['admin', 'petugas', 'pengguna'])->default('pengguna');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
