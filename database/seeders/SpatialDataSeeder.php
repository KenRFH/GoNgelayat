<?php

namespace Database\Seeders;

use App\Models\Tpu;
use App\Models\Makam;
use App\Models\Jalur;
use App\Models\PenjualBunga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpatialDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Bersihkan data lama untuk menghindari duplikasi koordinat
        DB::statement('TRUNCATE TABLE penjual_bunga CASCADE');
        DB::statement('TRUNCATE TABLE jalur CASCADE');
        DB::statement('TRUNCATE TABLE makam CASCADE');
        DB::statement('TRUNCATE TABLE tpu CASCADE');

        // 1. Buat TPU Sumbersari Indah (Polygon)
        // Koordinat area Jember (Sumbersari)
        $tpu = Tpu::create([
            'nama' => 'TPU Sumbersari Indah',
            'alamat' => 'Jl. Kalimantan No. 37, Sumbersari, Jember',
        ]);
        
        // Polygon segi empat di sekitar area Sumbersari
        $wktTpu = "POLYGON((113.7150 -8.1680, 113.7170 -8.1680, 113.7170 -8.1695, 113.7150 -8.1695, 113.7150 -8.1680))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wktTpu, $tpu->id]);

        // 2. Buat Makam (POINT)
        // Makam 1: Di dalam batas TPU
        $makam1 = Makam::create([
            'nama_nisan' => 'Almarhum Ahmad Yusuf',
            'tpu_id' => $tpu->id,
            'tanggal_lahir' => '1950-05-12',
            'tanggal_wafat' => '2020-10-15',
            'keterangan' => 'Makam keluarga besar Yusuf',
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7155, -8.1685), 4326) WHERE id = ?', [$makam1->id]);

        // Makam 2: Di dalam batas TPU
        $makam2 = Makam::create([
            'nama_nisan' => 'Almarhumah Siti Aminah',
            'tpu_id' => $tpu->id,
            'tanggal_lahir' => '1962-08-20',
            'tanggal_wafat' => '2021-03-04',
            'keterangan' => 'Baris ke-3 dari depan',
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7165, -8.1690), 4326) WHERE id = ?', [$makam2->id]);

        // Makam 3: Di luar batas TPU (Grave test diluar batas)
        $makam3 = Makam::create([
            'nama_nisan' => 'Almarhum Budi Santoso (Luar Batas)',
            'tpu_id' => $tpu->id,
            'tanggal_lahir' => '1970-01-01',
            'tanggal_wafat' => '2022-12-12',
            'keterangan' => 'Makam di area perluasan liar',
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7190, -8.1710), 4326) WHERE id = ?', [$makam3->id]);

        // 3. Buat Jalur Pemakaman (LINESTRING)
        // Jalur 1: Jalur Utama
        $jalur1 = Jalur::create([
            'tpu_id' => $tpu->id,
            'nama' => 'Jalur Utama',
        ]);
        $wktJalur1 = "LINESTRING(113.7151 -8.1681, 113.7151 -8.1694)";
        DB::statement("UPDATE jalur SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wktJalur1, $jalur1->id]);

        // Jalur 2: Jalur Penghubung
        $jalur2 = Jalur::create([
            'tpu_id' => $tpu->id,
            'nama' => 'Jalur Penghubung',
        ]);
        $wktJalur2 = "LINESTRING(113.7151 -8.1688, 113.7169 -8.1688)";
        DB::statement("UPDATE jalur SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wktJalur2, $jalur2->id]);

        // 4. Buat Penjual Bunga (POINT)
        // Penjual Bunga 1: Dekat dengan Makam Ahmad Yusuf (sekitar 110 meter)
        $toko1 = PenjualBunga::create([
            'nama_toko' => 'Kios Bunga Mawar Jaya',
            'alamat' => 'Jl. Kalimantan Depan TPU, Sumbersari, Jember',
            'no_hp' => '081234567890',
        ]);
        DB::statement('UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(113.7151, -8.1676), 4326) WHERE id = ?', [$toko1->id]);

        // Penjual Bunga 2: Sangat jauh dari makam (sekitar 2.5 km)
        $toko2 = PenjualBunga::create([
            'nama_toko' => 'Toko Bunga Lestari Indah',
            'alamat' => 'Jl. Gajah Mada No. 12, Kaliwates, Jember',
            'no_hp' => '089876543210',
        ]);
        DB::statement('UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(113.7350, -8.1850), 4326) WHERE id = ?', [$toko2->id]);

        $this->command->info('✅ Data spasial TPU, Makam, Jalur, dan Penjual Bunga berhasil dibuat!');
    }
}
