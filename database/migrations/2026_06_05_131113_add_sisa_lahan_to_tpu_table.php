<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tpu', function (Blueprint $table) {
            $table->decimal('sisa_lahan_m2', 10, 2)->nullable()->after('alamat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tpu', function (Blueprint $table) {
            $table->dropColumn('sisa_lahan_m2');
        });
    }
};
