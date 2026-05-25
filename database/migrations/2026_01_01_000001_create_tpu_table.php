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
        Schema::create('tpu', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nama', 64)->nullable();
            $table->string('alamat', 1000)->nullable();
            $table->timestamps();
        });

        // Add PostGIS geometry column (POLYGON, SRID 4326)
        DB::statement('ALTER TABLE tpu ADD COLUMN geom GEOMETRY(POLYGON, 4326)');
        DB::statement('CREATE INDEX tpu_geom_idx ON tpu USING GIST (geom)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tpu');
    }
};
