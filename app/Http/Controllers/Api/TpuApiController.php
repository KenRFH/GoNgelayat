<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tpu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TpuApiController extends Controller
{
    /**
     * Store a newly created TPU with spatial polygon in PostGIS.
     *
     * POST /api/tpu
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:64',
            'alamat' => 'nullable|string|max:1000',
            'polygon' => 'required|array|min:3',
            'polygon.*.lat' => 'required|numeric|between:-90,90',
            'polygon.*.lng' => 'required|numeric|between:-180,180',
        ]);

        try {
            $polygon = $request->input('polygon');
            
            // Konversi ke format WKT (Well-Known Text) POLYGON
            // Format WKT PostGIS menggunakan format: Longitude Latitude
            $wktCoords = [];
            foreach ($polygon as $point) {
                $wktCoords[] = "{$point['lng']} {$point['lat']}";
            }
            
            // Tutup otomatis polygon: titik pertama sama dengan titik terakhir
            $firstPoint = $polygon[0];
            $wktCoords[] = "{$firstPoint['lng']} {$firstPoint['lat']}";
            
            $wktString = "POLYGON((" . implode(',', $wktCoords) . "))";

            // Simpan data TPU dan geometries dalam sebuah transaksi database
            $tpu = DB::transaction(function () use ($request, $wktString) {
                $tpu = Tpu::create([
                    'nama' => $request->nama,
                    'alamat' => $request->alamat,
                ]);

                // Update geometry menggunakan raw SQL binding yang aman dari SQL Injection
                DB::update(
                    "UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?",
                    [$wktString, $tpu->id]
                );

                return $tpu;
            });

            // Ambil kembali TPU beserta representasi GeoJSON-nya
            $savedTpu = Tpu::select('id', 'nama', 'alamat', 'created_at', 'updated_at')
                ->selectRaw('ST_AsGeoJSON(geom) as geom')
                ->findOrFail($tpu->id);

            return response()->json([
                'status' => 'success',
                'message' => 'TPU dan polygon area berhasil disimpan.',
                'data' => [
                    'id' => $savedTpu->id,
                    'nama' => $savedTpu->nama,
                    'alamat' => $savedTpu->alamat,
                    'geom' => json_decode($savedTpu->geom, true),
                    'created_at' => $savedTpu->created_at,
                    'updated_at' => $savedTpu->updated_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error storing spatial TPU: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan data TPU. Detail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing TPU with spatial polygon in PostGIS.
     *
     * PUT /api/tpu/{id}
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nama' => 'required|string|max:64',
            'alamat' => 'nullable|string|max:1000',
            'polygon' => 'required|array|min:3',
            'polygon.*.lat' => 'required|numeric|between:-90,90',
            'polygon.*.lng' => 'required|numeric|between:-180,180',
        ]);

        try {
            $tpu = Tpu::findOrFail($id);
            $polygon = $request->input('polygon');
            
            // Konversi ke format WKT (Well-Known Text) POLYGON
            $wktCoords = [];
            foreach ($polygon as $point) {
                $wktCoords[] = "{$point['lng']} {$point['lat']}";
            }
            
            // Tutup otomatis polygon
            $firstPoint = $polygon[0];
            $wktCoords[] = "{$firstPoint['lng']} {$firstPoint['lat']}";
            
            $wktString = "POLYGON((" . implode(',', $wktCoords) . "))";

            // Update data dalam transaksi database
            DB::transaction(function () use ($request, $tpu, $wktString) {
                $tpu->update([
                    'nama' => $request->nama,
                    'alamat' => $request->alamat,
                ]);

                // Update geometry menggunakan raw SQL binding yang aman dari SQL Injection
                DB::update(
                    "UPDATE tpu SET geom = ST_SetSRID(ST_GeomFromText(?), 4326) WHERE id = ?",
                    [$wktString, $tpu->id]
                );
            });

            // Ambil kembali TPU beserta representasi GeoJSON-nya
            $updatedTpu = Tpu::select('id', 'nama', 'alamat', 'created_at', 'updated_at')
                ->selectRaw('ST_AsGeoJSON(geom) as geom')
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'message' => 'TPU dan polygon area berhasil diperbarui.',
                'data' => [
                    'id' => $updatedTpu->id,
                    'nama' => $updatedTpu->nama,
                    'alamat' => $updatedTpu->alamat,
                    'geom' => json_decode($updatedTpu->geom, true),
                    'created_at' => $updatedTpu->created_at,
                    'updated_at' => $updatedTpu->updated_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error updating spatial TPU ID ' . $id . ': ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui data TPU. Detail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a TPU and return geometry as GeoJSON.
     *
     * GET /api/tpu/{id}
     */
    public function show($id)
    {
        try {
            $tpu = Tpu::select('id', 'nama', 'alamat', 'created_at', 'updated_at')
                ->selectRaw('ST_AsGeoJSON(geom) as geom')
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $tpu->id,
                    'nama' => $tpu->nama,
                    'alamat' => $tpu->alamat,
                    'geom' => json_decode($tpu->geom, true),
                    'created_at' => $tpu->created_at,
                    'updated_at' => $tpu->updated_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data TPU tidak ditemukan atau terjadi kesalahan server.'
            ], 404);
        }
    }
}
