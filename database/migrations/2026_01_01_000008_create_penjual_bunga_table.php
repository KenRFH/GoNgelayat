<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('penjual_bunga', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nama_toko', 100)->nullable();
            $table->string('alamat', 1000)->nullable();
            $table->string('no_hp', 20)->nullable();
            $table->timestamps();
        });

        // Add PostGIS geometry column (POINT, SRID 4326)
        DB::statement('ALTER TABLE penjual_bunga ADD COLUMN geom GEOMETRY(POINT, 4326)');
        DB::statement('CREATE INDEX penjual_bunga_geom_idx ON penjual_bunga USING GIST (geom)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penjual_bunga');
    }
};
