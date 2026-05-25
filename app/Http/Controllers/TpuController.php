<?php

namespace App\Http\Controllers;

use App\Models\Blok;
use App\Models\BlokTpu;
use App\Models\Tpu;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TpuController extends Controller
{
    public function index()
    {
        $tpu = Tpu::withCount('blokTpu')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'nama', 'alamat', 'created_at']);

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
            'polygon'      => 'required|array|min:3',
            'polygon.*.lat' => 'required|numeric|between:-90,90',
            'polygon.*.lng' => 'required|numeric|between:-180,180',
            'blok'         => 'nullable|array',
            'blok.*.nama'  => 'nullable|string|max:64',
            'blok.*.nomor' => 'nullable|integer',
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
            ]);

            // Simpan geometry polygon PostGIS
            DB::update(
                "UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?",
                [$wktString, $tpu->id]
            );

            foreach ($request->input('blok', []) as $b) {
                $blok = Blok::create([
                    'nama'  => $b['nama']  ?? null,
                    'nomor' => $b['nomor'] ?? null,
                ]);

                BlokTpu::create([
                    'blok_id' => $blok->id,
                    'tpu_id'  => $tpu->id,
                ]);
            }

            $this->newTpuId = $tpu->id;
        });

        return redirect()->route('tpu.show', $this->newTpuId)
            ->with('success', 'TPU dan area batas berhasil ditambahkan.');
    }

    private ?int $newTpuId = null;

    /**
     * Detail TPU + daftar blok di dalamnya.
     */
    public function show(Tpu $tpu)
    {
        $tpuData = Tpu::select('id', 'nama', 'alamat', 'created_at')
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

        $blokList = BlokTpu::with('blok')
            ->where('tpu_id', $tpu->id)
            ->get()
            ->map(fn ($bt) => [
                'blok_tpu_id' => $bt->id,
                'blok_id'     => $bt->blok_id,
                'nama'        => optional($bt->blok)->nama,
                'nomor'       => optional($bt->blok)->nomor,
            ]);

        $makamList = \App\Models\Makam::select('makam.id', 'makam.nama_nisan')
            ->selectRaw('ST_Y(makam.geom) as lat, ST_X(makam.geom) as lng')
            ->join('blok_tpu', 'makam.blok_tpu_id', '=', 'blok_tpu.id')
            ->where('blok_tpu.tpu_id', $tpu->id)
            ->whereNotNull('makam.geom')
            ->get();

        return Inertia::render('tpu/Show', [
            'tpu'       => [
                'id'         => $tpuData->id,
                'nama'       => $tpuData->nama,
                'alamat'     => $tpuData->alamat,
                'polygon'    => $polygonCoords,
                'created_at' => $tpuData->created_at,
            ],
            'blok_list'  => $blokList,
            'makam_list' => $makamList,
            'auth'       => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function edit(Tpu $tpu)
    {
        $tpuData = Tpu::select('id', 'nama', 'alamat')
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
            ->join('blok_tpu', 'makam.blok_tpu_id', '=', 'blok_tpu.id')
            ->where('blok_tpu.tpu_id', $tpu->id)
            ->whereNotNull('makam.geom')
            ->get();

        return Inertia::render('tpu/Form', [
            'tpu'  => [
                'id'      => $tpuData->id,
                'nama'    => $tpuData->nama,
                'alamat'  => $tpuData->alamat,
                'polygon' => $polygonCoords,
            ],
            'makam_list' => $makamList,
            'auth'       => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function update(Request $request, Tpu $tpu)
    {
        $request->validate([
            'nama'         => 'required|string|max:64',
            'alamat'       => 'nullable|string|max:1000',
            'polygon'      => 'required|array|min:3',
            'polygon.*.lat' => 'required|numeric|between:-90,90',
            'polygon.*.lng' => 'required|numeric|between:-180,180',
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
            $tpu->update([
                'nama'   => $request->nama,
                'alamat' => $request->alamat,
            ]);

            DB::update(
                "UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?",
                [$wktString, $tpu->id]
            );
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

    // ── Blok nested routes ───────────────────────────────────────

    public function storeBlok(Request $request, Tpu $tpu)
    {
        $request->validate([
            'nama'  => 'nullable|string|max:64',
            'nomor' => 'nullable|integer',
        ]);

        DB::transaction(function () use ($request, $tpu) {
            $blok = Blok::create([
                'nama'  => $request->nama,
                'nomor' => $request->nomor,
            ]);

            BlokTpu::create([
                'blok_id' => $blok->id,
                'tpu_id'  => $tpu->id,
            ]);
        });

        return redirect()->route('tpu.show', $tpu->id)
            ->with('success', 'Blok berhasil ditambahkan.');
    }

    public function updateBlok(Request $request, Tpu $tpu, BlokTpu $blok)
    {
        abort_if($blok->tpu_id !== $tpu->id, 404);

        $request->validate([
            'nama'  => 'nullable|string|max:64',
            'nomor' => 'nullable|integer',
        ]);

        if ($blok->blok_id) {
            Blok::where('id', $blok->blok_id)->update([
                'nama'  => $request->nama,
                'nomor' => $request->nomor,
            ]);
        }

        return redirect()->route('tpu.show', $tpu->id)
            ->with('success', 'Blok berhasil diperbarui.');
    }

    public function destroyBlok(Tpu $tpu, BlokTpu $blok)
    {
        abort_if($blok->tpu_id !== $tpu->id, 404);

        DB::transaction(function () use ($blok) {
            $blokId = $blok->blok_id;
            $blok->delete();
            if ($blokId) {
                Blok::destroy($blokId);
            }
        });

        return redirect()->route('tpu.show', $tpu->id)
            ->with('success', 'Blok berhasil dihapus.');
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
