<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Makam;
use App\Models\PenjualBunga;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PenjualBungaApiController extends Controller
{
    /**
     * Get flower shops (penjual bunga) within a buffer zone (radius in meters) of a grave using ST_Buffer.
     *
     * GET /api/penjual-bunga/dekat-makam
     */
    public function getPenjualDekatMakam(Request $request)
    {
        $request->validate([
            'makam_id' => 'required|integer|exists:makam,id',
            'radius_meter' => 'nullable|numeric|min:1|max:5000', // max 5 km
        ]);

        try {
            $makamId = (int) $request->input('makam_id');
            $radiusMeter = (float) $request->input('radius_meter', 500); // default 500m

            // Find the grave first
            $makam = Makam::findOrFail($makamId);

            // ST_Buffer: ST_Buffer(geom::geography, radius) creates the buffer polygon on the earth's surface (meter scale).
            // ST_Within: We check if penjual_bunga.geom is within that buffer zone.
            // We also calculate the actual distance using ST_Distance.
            $penjual = PenjualBunga::select('id', 'nama_toko', 'alamat', 'no_hp')
                ->selectRaw('ST_Y(geom) as lat, ST_X(geom) as lng')
                ->selectRaw('
                    ST_Distance(
                        geom::geography,
                        (SELECT geom::geography FROM makam WHERE id = ?)
                    ) as jarak_meter
                ', [$makamId])
                ->whereNotNull('geom')
                ->whereRaw('
                    ST_Within(
                        geom,
                        ST_Buffer(
                            (SELECT geom::geography FROM makam WHERE id = ?),
                            ?
                        )::geometry
                    )
                ', [$makamId, $radiusMeter])
                ->orderBy('jarak_meter', 'asc')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'nama_toko' => $item->nama_toko,
                    'alamat' => $item->alamat,
                    'no_hp' => $item->no_hp,
                    'lat' => (float) $item->lat,
                    'lng' => (float) $item->lng,
                    'jarak_meter' => round((float) $item->jarak_meter, 2),
                ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil mengambil penjual bunga terdekat di sekitar makam.',
                'meta' => [
                    'makam_id' => $makamId,
                    'nama_nisan' => $makam->nama_nisan,
                    'buffer_radius_m' => $radiusMeter,
                    'total_found' => $penjual->count(),
                ],
                'data' => $penjual
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error querying ST_Buffer/ST_Within for flower shops: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server saat mencari penjual bunga dekat makam.'
            ], 500);
        }
    }
}
