<?php

namespace App\Http\Controllers;

use App\Models\Makam;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicController extends Controller
{
    public function index(Request $request)
    {
        $query         = trim($request->input('q', ''));
        $tanggalLahir  = $request->input('tgl_lahir', '');
        $tanggalWafat  = $request->input('tgl_wafat', '');

        $results = collect();
        $hasFilter = strlen($query) >= 2 || $tanggalLahir || $tanggalWafat;

        if ($hasFilter) {
            $db = Makam::with(['tpu']);

            if (strlen($query) >= 2) {
                $db->where('nama_nisan', 'ilike', "%{$query}%");
            }
            if ($tanggalLahir) {
                $db->whereDate('tanggal_lahir', $tanggalLahir);
            }
            if ($tanggalWafat) {
                $db->whereDate('tanggal_wafat', $tanggalWafat);
            }

            // Ambil koordinat dari PostGIS
            $ids = $db->pluck('id');
            $geoRows = \DB::table('makam')
                ->select('id',
                    \DB::raw('ST_Y(geom) as lat'),
                    \DB::raw('ST_X(geom) as lng'))
                ->whereIn('id', $ids)
                ->whereNotNull('geom')
                ->get()
                ->keyBy('id');

            $results = $db->orderBy('nama_nisan')
                ->limit(50)
                ->get()
                ->map(function ($m) use ($geoRows) {
                    $geo = $geoRows->get($m->id);
                    return [
                        'id'            => $m->id,
                        'nama_nisan'    => $m->nama_nisan,
                        'tanggal_lahir' => $m->tanggal_lahir?->format('Y-m-d'),
                        'tanggal_wafat' => $m->tanggal_wafat?->format('Y-m-d'),
                        'keterangan'    => $m->keterangan,
                        'gambar'        => $m->gambar ? asset('storage/' . $m->gambar) : null,
                        'tpu_nama'      => optional($m->tpu)->nama,
                        'tpu_id'        => $m->tpu_id,
                        'lat'           => $geo ? (float) $geo->lat : null,
                        'lng'           => $geo ? (float) $geo->lng : null,
                    ];
                });
        }

        return Inertia::render('public/Home', [
            'query'         => $query,
            'tgl_lahir'     => $tanggalLahir,
            'tgl_wafat'     => $tanggalWafat,
            'results'       => $results,
            'total'         => $results->count(),
            'tpu_list_all'  => \App\Models\Tpu::orderBy('nama')->get(['id', 'nama']),
        ]);
    }
}
