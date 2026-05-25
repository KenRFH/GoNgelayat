<?php

namespace Tests\Feature;

use App\Models\Makam;
use App\Models\Tpu;
use App\Models\Blok;
use App\Models\BlokTpu;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MakamSpatialApiTest extends TestCase
{
    use DatabaseTransactions;

    private $blokTpuId;

    protected function setUp(): void
    {
        parent::setUp();
        // Paksa koneksi pgsql (PostGIS) untuk pengujian spasial ini
        config(['database.default' => 'pgsql']);
        config(['database.connections.pgsql.database' => 'GoNgelayat']);

        // Persiapkan relasi TPU & Blok untuk membuat Makam
        $tpu = Tpu::create(['nama' => 'TPU Testing Proximity', 'alamat' => 'Jl. Testing']);
        $blok = Blok::create(['nama' => 'Blok Test Proximity', 'nomor' => 1]);
        $blokTpu = BlokTpu::create(['tpu_id' => $tpu->id, 'blok_id' => $blok->id]);
        $this->blokTpuId = $blokTpu->id;
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
            'blok_tpu_id' => $this->blokTpuId,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7151, -8.1685), 4326) WHERE id = ?', [$makamA->id]);

        // 3. Buat Makam B (Sedang - Jarak ~500m)
        $makamB = Makam::create([
            'nama_nisan' => 'Almarhum Jarak Sedang',
            'blok_tpu_id' => $this->blokTpuId,
        ]);
        DB::statement('UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(113.7190, -8.1681), 4326) WHERE id = ?', [$makamB->id]);

        // 4. Buat Makam C (Jauh - Jarak ~1,5 km)
        $makamC = Makam::create([
            'nama_nisan' => 'Almarhum Jarak Jauh',
            'blok_tpu_id' => $this->blokTpuId,
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
}
