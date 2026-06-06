<?php

namespace Tests\Feature;

use App\Models\Tpu;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TpuSpatialApiTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        // Paksa koneksi pgsql (PostGIS) untuk pengujian spasial ini setelah app container siap
        config(['database.default' => 'pgsql']);
        config(['database.connections.pgsql.database' => 'GoNgelayat']);
    }

    /**
     * Test storing a TPU with valid polygon coordinates.
     */
    public function test_can_store_tpu_with_valid_polygon_geometry(): void
    {
        $payload = [
            'nama' => 'TPU Sumbersari Indah',
            'alamat' => 'Jl. Kalimantan No. 37, Jember',
            'polygon' => [
                ['lat' => -8.1681, 'lng' => 113.7151],
                ['lat' => -8.1682, 'lng' => 113.7155],
                ['lat' => -8.1685, 'lng' => 113.7157],
            ]
        ];

        $response = $this->postJson(route('api.tpu.store'), $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'nama',
                    'alamat',
                    'geom' => [
                        'type',
                        'coordinates'
                    ],
                    'created_at',
                    'updated_at'
                ]
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.nama', 'TPU Sumbersari Indah');

        // Pastikan record tersimpan di database PostGIS
        $this->assertDatabaseHas('tpu', [
            'nama' => 'TPU Sumbersari Indah',
            'alamat' => 'Jl. Kalimantan No. 37, Jember',
        ]);

        $tpuId = $response->json('data.id');
        $tpu = Tpu::findOrFail($tpuId);
        $this->assertNotNull($tpu->geom);

        // Ambil data spasial dari database secara langsung untuk memverifikasi SRID & tipe koordinat
        $dbGeom = DB::selectOne("SELECT ST_AsText(geom) as wkt, ST_SRID(geom) as srid FROM tpu WHERE id = ?", [$tpu->id]);
        $this->assertEquals(4326, $dbGeom->srid);
        $this->assertStringContainsString('POLYGON', $dbGeom->wkt);
        
        // Memastikan polygon tertutup otomatis (titik terakhir = titik pertama)
        // 113.7151 -8.1681 -> titik pertama & penutup
        $this->assertStringContainsString('113.7151 -8.1681', $dbGeom->wkt);
    }

    /**
     * Test storing a TPU validation fails when vertices < 3.
     */
    public function test_cannot_store_tpu_with_insufficient_polygon_vertices(): void
    {
        $payload = [
            'nama' => 'TPU Invalid Vertices',
            'polygon' => [
                ['lat' => -8.1681, 'lng' => 113.7151],
                ['lat' => -8.1682, 'lng' => 113.7155],
            ]
        ];

        $response = $this->postJson(route('api.tpu.store'), $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['polygon']);
    }

    /**
     * Test getting a TPU geometry as GeoJSON.
     */
    public function test_can_get_tpu_geometry_as_geojson(): void
    {
        // Insert dummy TPU dengan raw query PostGIS
        $tpu = Tpu::create([
            'nama' => 'TPU GeoJSON Test',
            'alamat' => 'Jl. Test',
        ]);
        
        $wkt = "POLYGON((113.7151 -8.1681, 113.7155 -8.1682, 113.7157 -8.1685, 113.7151 -8.1681))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wkt, $tpu->id]);

        $response = $this->getJson(route('api.tpu.show', $tpu->id));

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $tpu->id,
                    'nama' => 'TPU GeoJSON Test',
                    'geom' => [
                        'type' => 'Polygon',
                        'coordinates' => [
                            [
                                [113.7151, -8.1681],
                                [113.7155, -8.1682],
                                [113.7157, -8.1685],
                                [113.7151, -8.1681]
                            ]
                        ]
                    ]
                ]
            ]);
    }

    /**
     * Test updating a TPU polygon.
     */
    public function test_can_update_tpu_geometry(): void
    {
        $tpu = Tpu::create([
            'nama' => 'TPU Sebelum Update',
            'alamat' => 'Jl. Lama',
        ]);
        
        $wktOld = "POLYGON((113.7151 -8.1681, 113.7155 -8.1682, 113.7157 -8.1685, 113.7151 -8.1681))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wktOld, $tpu->id]);

        $payload = [
            'nama' => 'TPU Sesudah Update',
            'alamat' => 'Jl. Baru',
            'polygon' => [
                ['lat' => -8.1901, 'lng' => 113.7201],
                ['lat' => -8.1902, 'lng' => 113.7205],
                ['lat' => -8.1905, 'lng' => 113.7207],
            ]
        ];

        $response = $this->putJson(route('api.tpu.update', $tpu->id), $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.nama', 'TPU Sesudah Update')
            ->assertJsonPath('data.alamat', 'Jl. Baru')
            ->assertJsonPath('data.geom.type', 'Polygon')
            ->assertJsonPath('data.geom.coordinates.0.0.0', 113.7201)
            ->assertJsonPath('data.geom.coordinates.0.0.1', -8.1901);

        $this->assertDatabaseHas('tpu', [
            'id' => $tpu->id,
            'nama' => 'TPU Sesudah Update',
            'alamat' => 'Jl. Baru',
        ]);
    }

    /**
     * Test searching closest TPUs within buffer radius (ST_DWithin).
     */
    public function test_can_search_closest_tpus_within_buffer_radius(): void
    {
        // 1. Buat TPU A (Dekat: jarak ~0-100 meter dari koordinat user)
        $tpuDekat = Tpu::create([
            'nama' => 'TPU Dekat',
            'alamat' => 'Jl. Dekat',
        ]);
        $wktDekat = "POLYGON((113.7150 -8.1680, 113.7152 -8.1680, 113.7152 -8.1682, 113.7150 -8.1682, 113.7150 -8.1680))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wktDekat, $tpuDekat->id]);

        // 2. Buat TPU B (Jauh: jarak ~20 km dari koordinat user)
        $tpuJauh = Tpu::create([
            'nama' => 'TPU Jauh',
            'alamat' => 'Jl. Jauh',
        ]);
        $wktJauh = "POLYGON((113.8000 -8.3500, 113.8010 -8.3500, 113.8010 -8.3510, 113.8000 -8.3510, 113.8000 -8.3500))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wktJauh, $tpuJauh->id]);

        // 3. Panggil API getTpuTerdekat dengan titik acuan dekat TPU Dekat
        // User di koordinat: -8.1681, 113.7151
        $response = $this->getJson(route('api.tpu.terdekat', [
            'user_lat' => -8.1681,
            'user_lng' => 113.7151,
            'radius_km' => 10.0 // Buffer radius 10 km
        ]));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $data = $response->json('data');
        $names = collect($data)->pluck('nama')->toArray();
        $this->assertContains('TPU Dekat', $names);
        $this->assertNotContains('TPU Jauh', $names);

        $tpuDekatRecord = collect($data)->firstWhere('nama', 'TPU Dekat');
        $this->assertNotNull($tpuDekatRecord);
        $this->assertLessThan(200, $tpuDekatRecord['jarak_meter']);
    }



    /**
     * Test finding graves located within TPU boundary using ST_Within.
     */
    public function test_can_get_graves_within_tpu_boundary(): void
    {
        // 1. Create a TPU with a polygon in Jakarta
        $tpu = Tpu::create([
            'nama' => 'TPU Within Test Jakarta',
            'alamat' => 'Jl. Within Jakarta',
        ]);
        $wkt = "POLYGON((106.8000 -6.2000, 106.8100 -6.2000, 106.8100 -6.2100, 106.8000 -6.2100, 106.8000 -6.2000))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wkt, $tpu->id]);

        // 2. Create Grave A (inside: -6.2050, 106.8050)
        $makamInside = \App\Models\Makam::create([
            'nama_nisan' => 'Makam Dalam Batas Jakarta',
            'tpu_id' => $tpu->id,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(106.8050, -6.2050), 4326) WHERE id = ?', [$makamInside->id]);

        // 3. Create Grave B (outside: -6.2200, 106.8200)
        $makamOutside = \App\Models\Makam::create([
            'nama_nisan' => 'Makam Luar Batas Jakarta',
            'tpu_id' => $tpu->id,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(106.8200, -6.2200), 4326) WHERE id = ?', [$makamOutside->id]);

        // 4. Call the API
        $response = $this->getJson(route('api.tpu.makam_dalam_batas', $tpu->id));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $data = $response->json('data');
        $names = collect($data)->pluck('nama_nisan')->toArray();

        $this->assertContains('Makam Dalam Batas Jakarta', $names);
        $this->assertNotContains('Makam Luar Batas Jakarta', $names);
    }

    /**
     * Test TPU detail includes area in m2 using ST_Area.
     */
    public function test_tpu_detail_includes_area_m2(): void
    {
        $tpu = Tpu::create([
            'nama' => 'TPU Area Test',
            'alamat' => 'Jl. Area',
        ]);
        // Roughly 100m x 100m polygon = ~10000 m2
        $wkt = "POLYGON((113.7150 -8.1680, 113.7160 -8.1680, 113.7160 -8.1690, 113.7150 -8.1690, 113.7150 -8.1680))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wkt, $tpu->id]);

        $response = $this->getJson(route('api.tpu.show', $tpu->id));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => ['id', 'nama', 'geom', 'luas_m2']
            ]);

        $luas = $response->json('data.luas_m2');
        $this->assertGreaterThan(5000, $luas);
        $this->assertLessThan(20000, $luas);
    }



    /**
     * Test storing a TPU with flower sellers.
     */
    public function test_can_store_tpu_with_flower_sellers(): void
    {
        $payload = [
            'nama' => 'TPU Sumbersari Indah',
            'alamat' => 'Jl. Kalimantan No. 37, Jember',
            'polygon' => [
                ['lat' => -8.1681, 'lng' => 113.7151],
                ['lat' => -8.1682, 'lng' => 113.7155],
                ['lat' => -8.1685, 'lng' => 113.7157],
            ],
            'penjual_bunga' => [
                [
                    'nama_toko' => 'Toko Bunga Makmur',
                    'alamat' => 'Depan TPU',
                    'no_hp' => '081234567890',
                    'lat' => -8.1683,
                    'lng' => 113.7153
                ]
            ]
        ];

        $response = $this->postJson(route('api.tpu.store'), $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        // Pastikan penjual bunga tersimpan
        $this->assertDatabaseHas('penjual_bunga', [
            'nama_toko' => 'Toko Bunga Makmur',
            'alamat' => 'Depan TPU',
            'no_hp' => '081234567890',
        ]);

        $seller = \App\Models\PenjualBunga::where('nama_toko', 'Toko Bunga Makmur')->first();
        $this->assertNotNull($seller);
        
        $dbGeom = DB::selectOne("SELECT ST_AsText(geom) as wkt FROM penjual_bunga WHERE id = ?", [$seller->id]);
        $this->assertStringContainsString('POINT(113.7153 -8.1683)', $dbGeom->wkt);
    }

    /**
     * Test updating/syncing flower sellers on a TPU.
     */
    public function test_can_update_tpu_with_flower_sellers(): void
    {
        // 1. Buat TPU
        $tpu = Tpu::create([
            'nama' => 'TPU Sync Test',
            'alamat' => 'Jl. Sync',
        ]);
        $wkt = "POLYGON((113.7150 -8.1680, 113.7160 -8.1680, 113.7160 -8.1690, 113.7150 -8.1690, 113.7150 -8.1680))";
        DB::statement("UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?", [$wkt, $tpu->id]);

        // 2. Buat penjual bunga A (di dalam TPU, akan di-update)
        $sellerA = \App\Models\PenjualBunga::create([
            'nama_toko' => 'Toko A',
            'alamat' => 'Alamat A',
        ]);
        DB::statement("UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(113.7152, -8.1682), 4326) WHERE id = ?", [$sellerA->id]);

        // Buat penjual bunga B (di dalam TPU, akan di-delete karena tidak ada di payload)
        $sellerB = \App\Models\PenjualBunga::create([
            'nama_toko' => 'Toko B',
            'alamat' => 'Alamat B',
        ]);
        DB::statement("UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(113.7155, -8.1685), 4326) WHERE id = ?", [$sellerB->id]);

        // Payload update: Toko A di-update, Toko B dihapus (tidak dimasukkan), Toko C ditambahkan (baru)
        $payload = [
            'nama' => 'TPU Sync Test Updated',
            'alamat' => 'Jl. Sync Baru',
            'polygon' => [
                ['lat' => -8.1680, 'lng' => 113.7150],
                ['lat' => -8.1680, 'lng' => 113.7160],
                ['lat' => -8.1690, 'lng' => 113.7160],
            ],
            'penjual_bunga' => [
                [
                    'id' => $sellerA->id,
                    'nama_toko' => 'Toko A Updated',
                    'alamat' => 'Alamat A Baru',
                    'no_hp' => '081111',
                    'lat' => -8.1683,
                    'lng' => 113.7153
                ],
                [
                    'nama_toko' => 'Toko C Baru',
                    'alamat' => 'Alamat C',
                    'no_hp' => '082222',
                    'lat' => -8.1686,
                    'lng' => 113.7156
                ]
            ]
        ];

        $response = $this->putJson(route('api.tpu.update', $tpu->id), $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Pastikan Toko A ter-update
        $this->assertDatabaseHas('penjual_bunga', [
            'id' => $sellerA->id,
            'nama_toko' => 'Toko A Updated',
            'alamat' => 'Alamat A Baru',
        ]);

        // Pastikan Toko B terhapus (karena berada di dalam oldGeom TPU dan tidak masuk input payload)
        $this->assertDatabaseMissing('penjual_bunga', [
            'id' => $sellerB->id,
        ]);

        // Pastikan Toko C tersimpan
        $this->assertDatabaseHas('penjual_bunga', [
            'nama_toko' => 'Toko C Baru',
            'alamat' => 'Alamat C',
        ]);
    }
}
