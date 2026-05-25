<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blok_tpu', function (Blueprint $table) {
            $table->unsignedInteger('blok_id')->nullable()->after('id');
            $table->foreign('blok_id')->references('id')->on('blok')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('blok_tpu', function (Blueprint $table) {
            $table->dropForeign(['blok_id']);
            $table->dropColumn('blok_id');
        });
    }
};
