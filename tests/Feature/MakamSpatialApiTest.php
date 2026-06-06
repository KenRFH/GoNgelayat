<?php

namespace Tests\Feature;

use App\Models\Makam;
use App\Models\Tpu;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MakamSpatialApiTest extends TestCase
{
    use DatabaseTransactions;

    private $tpuId;

    protected function setUp(): void
    {
        parent::setUp();
        // Paksa koneksi pgsql (PostGIS) untuk pengujian spasial ini
        config(['database.default' => 'pgsql']);
        config(['database.connections.pgsql.database' => 'GoNgelayat']);

        // Persiapkan relasi TPU untuk membuat Makam
        $tpu = Tpu::create(['nama' => 'TPU Testing Proximity', 'alamat' => 'Jl. Testing']);
        $this->tpuId = $tpu->id;
    }

    /**
     * Test search closest grave successfully returns distances sorted ascending.
     */
    public function test_can_search_closest_graves_sorted_by_distance(): void
    {
        // 1. Koordinat GPS User: Jember Sumbersari (-8.1681, 113.7151)
        $userLat = -8.1681;
        $userLng = 113.7151;

        // 2. Buat Makam A (Sangat Dekat - Jarak ~40m)
        $makamA = Makam::create([
            'nama_nisan' => 'Almarhum Sangat Dekat',
            'tpu_id' => $this->tpuId,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7151, -8.1685), 4326) WHERE id = ?', [$makamA->id]);

        // 3. Buat Makam B (Sedang - Jarak ~500m)
        $makamB = Makam::create([
            'nama_nisan' => 'Almarhum Jarak Sedang',
            'tpu_id' => $this->tpuId,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7190, -8.1681), 4326) WHERE id = ?', [$makamB->id]);

        // 4. Buat Makam C (Jauh - Jarak ~1,5 km)
        $makamC = Makam::create([
            'nama_nisan' => 'Almarhum Jarak Jauh',
            'tpu_id' => $this->tpuId,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7285, -8.1681), 4326) WHERE id = ?', [$makamC->id]);

        // Kirim request ke endpoint API makam terdekat
        $response = $this->getJson(route('api.makam.terdekat', [
            'user_lat' => $userLat,
            'user_lng' => $userLng,
        ]));

        // Asersi Respon
        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'meta' => [
                    'user_coordinates' => ['lat', 'lng'],
                    'pagination' => ['total', 'count', 'per_page', 'current_page', 'total_pages']
                ],
                'data' => [
                    '*' => [
                        'id',
                        'nama_nisan',
                        'lat',
                        'lng',
                        'jarak_meter',
                        'jarak_teks',
                    ]
                ]
            ])
            ->assertJsonPath('status', 'success');

        $data = $response->json('data');

        // Pastikan jumlah data minimal terisi 3 makam yang kita tambahkan
        $this->assertGreaterThanOrEqual(3, count($data));

        // Asersi Pengurutan Jarak (Ascending): Makam A -> Makam B -> Makam C
        // Temukan index makam-makam yang kita buat di dalam array respon
        $idxA = collect($data)->search(fn($item) => $item['id'] === $makamA->id);
        $idxB = collect($data)->search(fn($item) => $item['id'] === $makamB->id);
        $idxC = collect($data)->search(fn($item) => $item['id'] === $makamC->id);

        $this->assertNotFalse($idxA);
        $this->assertNotFalse($idxB);
        $this->assertNotFalse($idxC);

        // Makam A harus lebih dekat daripada Makam B, dan Makam B lebih dekat daripada Makam C
        $this->assertLessThan($idxB, $idxA);
        $this->assertLessThan($idxC, $idxB);

        // Asersi auto-formatting jarak teks
        // Makam A (~40m) harus dalam format meter "m"
        $this->assertStringContainsString('m', $data[$idxA]['jarak_teks']);
        $this->assertStringNotContainsString('km', $data[$idxA]['jarak_teks']);

        // Makam C (~1,5km = ~1500m) harus dalam format kilometer "km"
        $this->assertStringContainsString('km', $data[$idxC]['jarak_teks']);
    }

    /**
     * Test latitude and longitude validation boundaries.
     */
    public function test_closest_graves_validation_boundaries(): void
    {
        // 1. Latitude invalid (> 90)
        $response = $this->getJson(route('api.makam.terdekat', [
            'user_lat' => 95.0,
            'user_lng' => 113.7151,
        ]));
        $response->assertStatus(422)->assertJsonValidationErrors(['user_lat']);

        // 2. Longitude invalid (< -180)
        $response = $this->getJson(route('api.makam.terdekat', [
            'user_lat' => -8.1681,
            'user_lng' => -185.0,
        ]));
        $response->assertStatus(422)->assertJsonValidationErrors(['user_lng']);
    }

    /**
     * Test getting flower shops (penjual bunga) within grave buffer zone.
     */
    public function test_can_get_flower_shops_within_makam_buffer(): void
    {
        // 1. Create a grave
        $makam = Makam::create([
            'nama_nisan' => 'Almarhum Buffer Test',
            'tpu_id' => $this->tpuId,
        ]);
        // Grave location: -8.1681, 113.7151
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7151, -8.1681), 4326) WHERE id = ?', [$makam->id]);

        // 2. Create flower shop A (close: ~100 meters away at -8.1681, 113.7160)
        $tokoDekat = \App\Models\PenjualBunga::create([
            'nama_toko' => 'Toko Bunga Dekat',
            'alamat' => 'Jl. Dekat Makam',
            'no_hp' => '08123456789',
        ]);
        DB::statement('UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(113.7160, -8.1681), 4326) WHERE id = ?', [$tokoDekat->id]);

        // 3. Create flower shop B (far: ~2 km away at -8.1800, 113.7300)
        $tokoJauh = \App\Models\PenjualBunga::create([
            'nama_toko' => 'Toko Bunga Jauh',
            'alamat' => 'Jl. Jauh Makam',
            'no_hp' => '08987654321',
        ]);
        DB::statement('UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(113.7300, -8.1800), 4326) WHERE id = ?', [$tokoJauh->id]);

        // 4. Call the API with a 500 meters buffer radius
        $response = $this->getJson(route('api.penjual_bunga.dekat_makam', [
            'makam_id' => $makam->id,
            'radius_meter' => 500,
        ]));

        // 5. Assertions
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'meta' => ['makam_id', 'nama_nisan', 'buffer_radius_m', 'total_found'],
                'data' => [
                    '*' => ['id', 'nama_toko', 'alamat', 'no_hp', 'lat', 'lng', 'jarak_meter']
                ]
            ]);

        $data = $response->json('data');
        $names = collect($data)->pluck('nama_toko')->toArray();

        $this->assertContains('Toko Bunga Dekat', $names);
        $this->assertNotContains('Toko Bunga Jauh', $names);
    }
}
