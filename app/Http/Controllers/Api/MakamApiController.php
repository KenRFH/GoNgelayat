<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Makam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MakamApiController extends Controller
{
    /**
     * Search closest graves (makam) based on user's GPS coordinates using ST_Distance.
     *
     * GET /api/makam/terdekat
     */
    public function getMakamTerdekat(Request $request)
    {
        $request->validate([
            'user_lat' => 'required|numeric|between:-90,90',
            'user_lng' => 'required|numeric|between:-180,180',
            'limit'    => 'nullable|integer|min:1|max:100',
        ]);

        try {
            $lat   = (float) $request->input('user_lat');
            $lng   = (float) $request->input('user_lng');
            $limit = (int) $request->input('limit', 10);

            // Query spasial PostGIS efisien menggunakan ST_Distance pada geografi (geography)
            // ST_MakePoint menerima sumbu X (Longitude) dahulu, kemudian Y (Latitude).
            // geom::geography mengonversi geometri koordinat datar ke geografi bola ellipsoid bumi presisi meter.
            $makam = Makam::with(['tpu'])
                ->select('id', 'tpu_id', 'nama_nisan', 'tanggal_lahir', 'tanggal_wafat', 'gambar', 'keterangan')
                ->selectRaw('ST_Y(geom) as lat, ST_X(geom) as lng')
                ->selectRaw('
                    ST_Distance(
                        geom::geography,
                        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
                    ) as jarak_meter
                ', [$lng, $lat])
                ->whereNotNull('geom')
                ->orderBy('jarak_meter', 'asc')
                ->paginate($limit);

            // Transformasi data untuk format jarak yang ramah pengguna
            $makamCollection = collect($makam->items())->map(function ($item) {
                $meters = (float) $item->jarak_meter;
                
                // Format jarak otomatis (meter / kilometer)
                $jarakTeks = $meters >= 1000
                    ? number_format($meters / 1000, 2, ',', '.') . ' km'
                    : number_format($meters, 0, ',', '.') . ' m';

                return [
                    'id'            => $item->id,
                    'nama_nisan'    => $item->nama_nisan,
                    'tanggal_lahir' => $item->tanggal_lahir?->format('Y-m-d'),
                    'tanggal_wafat' => $item->tanggal_wafat?->format('Y-m-d'),
                    'gambar'        => $item->gambar ? asset('storage/' . $item->gambar) : null,
                    'keterangan'    => $item->keterangan,
                    'tpu_nama'      => optional($item->tpu)->nama,
                    'lat'           => (float) $item->lat,
                    'lng'           => (float) $item->lng,
                    'jarak_meter'   => round($meters, 2),
                    'jarak_teks'    => $jarakTeks,
                ];
            });

            return response()->json([
                'status'  => 'success',
                'message' => 'Pencarian makam terdekat berhasil diselesaikan.',
                'meta'    => [
                    'user_coordinates' => [
                        'lat' => $lat,
                        'lng' => $lng,
                    ],
                    'pagination' => [
                        'total'        => $makam->total(),
                        'count'        => $makam->count(),
                        'per_page'     => $makam->perPage(),
                        'current_page' => $makam->currentPage(),
                        'total_pages'  => $makam->lastPage(),
                    ]
                ],
                'data' => $makamCollection,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error querying closest graves: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Terjadi kesalahan sistem saat menghitung jarak makam. Detail: ' . $e->getMessage(),
            ], 500);
        }
    }
}
