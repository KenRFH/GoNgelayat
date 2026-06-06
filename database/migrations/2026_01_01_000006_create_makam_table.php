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
        Schema::create('makam', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('tpu_id')->nullable();
            $table->unsignedInteger('user_id')->nullable();
            $table->string('nama_nisan', 64)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->date('tanggal_wafat')->nullable();
            $table->string('gambar', 255)->nullable();
            $table->string('keterangan', 1000)->nullable();
            $table->timestamps();

            $table->foreign('tpu_id')->references('id')->on('tpu')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('user')->nullOnDelete();
        });

        // Add PostGIS geometry column (POINT, SRID 4326)
        DB::statement('ALTER TABLE makam ADD COLUMN geom GEOMETRY(POINT, 4326)');
        DB::statement('CREATE INDEX makam_geom_idx ON makam USING GIST (geom)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('makam');
    }
};
