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
        Schema::create('jalur', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('tpu_id')->nullable();
            $table->string('nama', 64)->nullable();
            $table->timestamps();

            $table->foreign('tpu_id')->references('id')->on('tpu')->nullOnDelete();
        });

        // Add PostGIS geometry column (LINESTRING, SRID 4326)
        DB::statement('ALTER TABLE jalur ADD COLUMN geom GEOMETRY(LINESTRING, 4326)');
        DB::statement('CREATE INDEX jalur_geom_idx ON jalur USING GIST (geom)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jalur');
    }
};
