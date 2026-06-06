<?php

namespace App\Http\Controllers;

use App\Models\Tpu;
use App\Models\User;
use App\Models\PenjualBunga;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TpuController extends Controller
{
    public function index()
    {
        $tpu = Tpu::withCount('makam')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'nama', 'alamat', 'sisa_lahan_m2', 'created_at']);

        return Inertia::render('tpu/Index', [
            'tpu_list' => $tpu,
            'auth'     => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function create()
    {
        return Inertia::render('tpu/Form', [
            'tpu'        => null,
            'admin_list' => $this->getAdminList(),
            'auth'       => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama'         => 'required|string|max:64',
            'alamat'       => 'nullable|string|max:1000',
            'sisa_lahan_m2'=> 'nullable|numeric|min:0',
            'polygon'      => 'required|array|min:3',
            'polygon.*.lat' => 'required|numeric|between:-90,90',
            'polygon.*.lng' => 'required|numeric|between:-180,180',
            'penjual_bunga' => 'nullable|array',
            'penjual_bunga.*.nama_toko' => 'required|string|max:100',
            'penjual_bunga.*.alamat'    => 'nullable|string|max:1000',
            'penjual_bunga.*.no_hp'     => 'nullable|string|max:20',
            'penjual_bunga.*.lat'       => 'required|numeric|between:-90,90',
            'penjual_bunga.*.lng'       => 'required|numeric|between:-180,180',
        ]);

        $polygon = $request->input('polygon');
        $wktCoords = [];
        foreach ($polygon as $point) {
            $wktCoords[] = "{$point['lng']} {$point['lat']}";
        }
        // Tutup otomatis polygon: titik pertama sama dengan titik terakhir
        $firstPoint = $polygon[0];
        $wktCoords[] = "{$firstPoint['lng']} {$firstPoint['lat']}";
        
        $wktString = "POLYGON((" . implode(',', $wktCoords) . "))";

        DB::transaction(function () use ($request, $wktString) {
            $tpu = Tpu::create([
                'nama'   => $request->nama,
                'alamat' => $request->alamat,
                'sisa_lahan_m2' => $request->sisa_lahan_m2,
            ]);

            // Simpan geometry polygon PostGIS
            DB::update(
                "UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?",
                [$wktString, $tpu->id]
            );

            foreach ($request->input('penjual_bunga', []) as $pb) {
                $penjual = PenjualBunga::create([
                    'nama_toko' => $pb['nama_toko'],
                    'alamat'    => $pb['alamat'] ?? null,
                    'no_hp'     => $pb['no_hp'] ?? null,
                ]);

                DB::update(
                    "UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?",
                    [$pb['lng'], $pb['lat'], $penjual->id]
                );
            }

            $this->newTpuId = $tpu->id;
        });

        return redirect()->route('tpu.show', $this->newTpuId)
            ->with('success', 'TPU dan area batas berhasil ditambahkan.');
    }

    private ?int $newTpuId = null;

    /**
     * Detail TPU + daftar makam di dalamnya.
     */
    public function show(Tpu $tpu)
    {
        $tpuData = Tpu::select('id', 'nama', 'alamat', 'sisa_lahan_m2', 'created_at')
            ->selectRaw('ST_AsGeoJSON(geom) as geom_json')
            ->findOrFail($tpu->id);

        $geom = json_decode($tpuData->geom_json, true);
        $polygonCoords = [];
        if ($geom && isset($geom['coordinates'][0])) {
            foreach ($geom['coordinates'][0] as $point) {
                $polygonCoords[] = [
                    'lng' => $point[0],
                    'lat' => $point[1]
                ];
            }
            // Buang titik penutup duplikat agar Leaflet tidak double vertex
            if (count($polygonCoords) > 1 && 
                $polygonCoords[0]['lat'] === $polygonCoords[count($polygonCoords) - 1]['lat'] && 
                $polygonCoords[0]['lng'] === $polygonCoords[count($polygonCoords) - 1]['lng']) {
                array_pop($polygonCoords);
            }
        }

        $makamList = \App\Models\Makam::select('makam.id', 'makam.nama_nisan')
            ->selectRaw('ST_Y(makam.geom) as lat, ST_X(makam.geom) as lng')
            ->where('makam.tpu_id', $tpu->id)
            ->whereNotNull('makam.geom')
            ->get();

        $penjualList = \App\Models\PenjualBunga::select('id', 'nama_toko', 'alamat', 'no_hp')
            ->selectRaw('ST_Y(geom) as lat, ST_X(geom) as lng')
            ->whereRaw('ST_Within(geom, (SELECT geom FROM tpu WHERE id = ?))', [$tpu->id])
            ->whereNotNull('geom')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'nama_toko' => $item->nama_toko,
                'alamat' => $item->alamat,
                'no_hp' => $item->no_hp,
                'lat' => (float) $item->lat,
                'lng' => (float) $item->lng,
            ]);

        return Inertia::render('tpu/Show', [
            'tpu'       => [
                'id'         => $tpuData->id,
                'nama'       => $tpuData->nama,
                'alamat'     => $tpuData->alamat,
                'sisa_lahan_m2' => $tpuData->sisa_lahan_m2,
                'polygon'    => $polygonCoords,
                'created_at' => $tpuData->created_at,
            ],
            'makam_list'    => $makamList,
            'penjual_list'  => $penjualList,
            'auth'          => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function edit(Tpu $tpu)
    {
        $tpuData = Tpu::select('id', 'nama', 'alamat', 'sisa_lahan_m2')
            ->selectRaw('ST_AsGeoJSON(geom) as geom_json')
            ->findOrFail($tpu->id);

        $geom = json_decode($tpuData->geom_json, true);
        $polygonCoords = [];
        if ($geom && isset($geom['coordinates'][0])) {
            foreach ($geom['coordinates'][0] as $point) {
                $polygonCoords[] = [
                    'lng' => $point[0],
                    'lat' => $point[1]
                ];
            }
            if (count($polygonCoords) > 1 && 
                $polygonCoords[0]['lat'] === $polygonCoords[count($polygonCoords) - 1]['lat'] && 
                $polygonCoords[0]['lng'] === $polygonCoords[count($polygonCoords) - 1]['lng']) {
                array_pop($polygonCoords);
            }
        }

        $makamList = \App\Models\Makam::select('makam.id', 'makam.nama_nisan')
            ->selectRaw('ST_Y(makam.geom) as lat, ST_X(makam.geom) as lng')
            ->where('makam.tpu_id', $tpu->id)
            ->whereNotNull('makam.geom')
            ->get();

        $penjualList = \App\Models\PenjualBunga::select('id', 'nama_toko', 'alamat', 'no_hp')
            ->selectRaw('ST_Y(geom) as lat, ST_X(geom) as lng')
            ->whereRaw('ST_Within(geom, (SELECT geom FROM tpu WHERE id = ?))', [$tpu->id])
            ->whereNotNull('geom')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'nama_toko' => $item->nama_toko,
                'alamat' => $item->alamat,
                'no_hp' => $item->no_hp,
                'lat' => (float) $item->lat,
                'lng' => (float) $item->lng,
            ]);

        return Inertia::render('tpu/Form', [
            'tpu'  => [
                'id'      => $tpuData->id,
                'nama'    => $tpuData->nama,
                'alamat'  => $tpuData->alamat,
                'sisa_lahan_m2' => $tpuData->sisa_lahan_m2,
                'polygon' => $polygonCoords,
            ],
            'makam_list'    => $makamList,
            'penjual_list'  => $penjualList,
            'auth'          => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function update(Request $request, Tpu $tpu)
    {
        $request->validate([
            'nama'         => 'required|string|max:64',
            'alamat'       => 'nullable|string|max:1000',
            'sisa_lahan_m2'=> 'nullable|numeric|min:0',
            'polygon'      => 'required|array|min:3',
            'polygon.*.lat' => 'required|numeric|between:-90,90',
            'polygon.*.lng' => 'required|numeric|between:-180,180',
            'penjual_bunga' => 'nullable|array',
            'penjual_bunga.*.id'        => 'nullable|integer|exists:penjual_bunga,id',
            'penjual_bunga.*.nama_toko' => 'required|string|max:100',
            'penjual_bunga.*.alamat'    => 'nullable|string|max:1000',
            'penjual_bunga.*.no_hp'     => 'nullable|string|max:20',
            'penjual_bunga.*.lat'       => 'required|numeric|between:-90,90',
            'penjual_bunga.*.lng'       => 'required|numeric|between:-180,180',
        ]);

        $polygon = $request->input('polygon');
        $wktCoords = [];
        foreach ($polygon as $point) {
            $wktCoords[] = "{$point['lng']} {$point['lat']}";
        }
        // Tutup otomatis polygon
        $firstPoint = $polygon[0];
        $wktCoords[] = "{$firstPoint['lng']} {$firstPoint['lat']}";
        
        $wktString = "POLYGON((" . implode(',', $wktCoords) . "))";

        DB::transaction(function () use ($request, $tpu, $wktString) {
            // Ambil geom lama sebelum di-update untuk sinkronisasi penjual bunga
            $oldGeom = DB::table('tpu')->where('id', $tpu->id)->value('geom');

            $tpu->update([
                'nama'   => $request->nama,
                'alamat' => $request->alamat,
                'sisa_lahan_m2' => $request->sisa_lahan_m2,
            ]);

            DB::update(
                "UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?",
                [$wktString, $tpu->id]
            );

            // Sync Penjual Bunga
            $inputSellers = $request->input('penjual_bunga', []);
            $inputIds = collect($inputSellers)->pluck('id')->filter()->toArray();

            // Hapus penjual bunga lama yang secara spasial ada di dalam oldGeom TPU tetapi ID-nya tidak ada dalam payload update
            if ($oldGeom) {
                PenjualBunga::whereRaw('ST_Within(geom, ?)', [$oldGeom])
                    ->whereNotIn('id', $inputIds)
                    ->delete();
            }

            // Update/Create penjual bunga dari payload
            foreach ($inputSellers as $pb) {
                if (!empty($pb['id'])) {
                    $seller = PenjualBunga::find($pb['id']);
                    if ($seller) {
                        $seller->update([
                            'nama_toko' => $pb['nama_toko'],
                            'alamat'    => $pb['alamat'] ?? null,
                            'no_hp'     => $pb['no_hp'] ?? null,
                        ]);
                        DB::update(
                            "UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?",
                            [$pb['lng'], $pb['lat'], $seller->id]
                        );
                    }
                } else {
                    $seller = PenjualBunga::create([
                        'nama_toko' => $pb['nama_toko'],
                        'alamat'    => $pb['alamat'] ?? null,
                        'no_hp'     => $pb['no_hp'] ?? null,
                    ]);
                    DB::update(
                        "UPDATE penjual_bunga SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?",
                        [$pb['lng'], $pb['lat'], $seller->id]
                    );
                }
            }
        });

        return redirect()->route('tpu.show', $tpu->id)
            ->with('success', 'TPU dan area batas berhasil diperbarui.');
    }

    public function destroy(Tpu $tpu)
    {
        $tpu->delete();

        return redirect()->route('tpu.index')
            ->with('success', 'TPU berhasil dihapus.');
    }

    // ── Helpers ─────────────────────────────────────────────────

    private function getAdminList(): array
    {
        return User::whereIn('role', ['admin', 'superadmin'])
            ->orderBy('name')
            ->get(['id', 'name', 'role'])
            ->toArray();
    }
}
