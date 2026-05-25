<?php

namespace App\Http\Controllers;

use App\Models\BlokTpu;
use App\Models\Makam;
use App\Models\Tpu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MakamController extends Controller
{
    public function index(Request $request)
    {
        $q          = trim($request->input('q', ''));
        $tglLahir   = $request->input('tgl_lahir', '');
        $tglWafat   = $request->input('tgl_wafat', '');

        $db = Makam::with('blokTpu.tpu');

        if ($q) {
            $db->where(function ($query) use ($q) {
                $query->where('nama_nisan', 'ilike', "%{$q}%")
                      ->orWhereHas('blokTpu.tpu', fn ($q2) => $q2->where('nama', 'ilike', "%{$q}%"));
            });
        }

        if ($tglLahir) {
            $db->whereDate('tanggal_lahir', $tglLahir);
        }

        if ($tglWafat) {
            $db->whereDate('tanggal_wafat', $tglWafat);
        }

        $makam = $db->orderBy('nama_nisan')
            ->get()
            ->map(fn ($m) => [
                'id'            => $m->id,
                'nama_nisan'    => $m->nama_nisan,
                'tanggal_lahir' => $m->tanggal_lahir?->format('Y-m-d'),
                'tanggal_wafat' => $m->tanggal_wafat?->format('Y-m-d'),
                'gambar'        => $m->gambar,
                'keterangan'    => $m->keterangan,
                'tpu_nama'      => optional(optional($m->blokTpu)->tpu)->nama,
                'blok_tpu_id'   => $m->blok_tpu_id,
                'created_at'    => $m->created_at?->format('Y-m-d'),
            ]);

        return Inertia::render('makam/Index', [
            'makam_list' => $makam,
            'filters'    => [
                'q'         => $q,
                'tgl_lahir' => $tglLahir,
                'tgl_wafat' => $tglWafat,
            ],
            'total_all'  => Makam::count(),
            'auth'       => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }


    public function create()
    {
        return Inertia::render('makam/Form', [
            'makam'     => null,
            'tpu_list'  => $this->getTpuList(),
            'blok_list' => $this->getBlokList(),
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function store(Request $request)
    {
        // Inertia forceFormData mengirim null sebagai string — normalkan dulu
        foreach (['blok_tpu_id', 'lat', 'lng'] as $field) {
            if ($request->input($field) === '' || $request->input($field) === 'null') {
                $request->merge([$field => null]);
            }
        }

        $validated = $request->validate([
            'nama_nisan'    => 'nullable|string|max:64',
            'blok_tpu_id'   => 'nullable|integer|exists:blok_tpu,id',
            'tanggal_lahir' => 'nullable|date',
            'tanggal_wafat' => 'nullable|date|after_or_equal:tanggal_lahir',
            'keterangan'    => 'nullable|string|max:1000',
            'gambar'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'lat'           => 'nullable|numeric|between:-90,90',
            'lng'           => 'nullable|numeric|between:-180,180',
        ]);

        $validated['user_id'] = Auth::id();

        if ($request->hasFile('gambar')) {
            $validated['gambar'] = $request->file('gambar')->store('makam', 'public');
        }

        $lat = $request->input('lat');
        $lng = $request->input('lng');
        unset($validated['lat'], $validated['lng']);

        $makam = Makam::create($validated);

        if ($lat !== null && $lng !== null) {
            DB::statement(
                'UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                [(float) $lng, (float) $lat, $makam->id]
            );
        }

        return redirect()->route('makam.index')->with('success', 'Data makam berhasil ditambahkan.');
    }

    public function edit(Makam $makam)
    {
        // Ambil koordinat dari PostGIS
        $geo = DB::table('makam')
            ->selectRaw('ST_Y(geom) as lat, ST_X(geom) as lng')
            ->where('id', $makam->id)
            ->whereNotNull('geom')
            ->first();

        return Inertia::render('makam/Form', [
            'makam'     => [
                'id'            => $makam->id,
                'nama_nisan'    => $makam->nama_nisan,
                'blok_tpu_id'   => $makam->blok_tpu_id,
                'tpu_id'        => optional($makam->blokTpu)->tpu_id,
                'tanggal_lahir' => $makam->tanggal_lahir?->format('Y-m-d'),
                'tanggal_wafat' => $makam->tanggal_wafat?->format('Y-m-d'),
                'keterangan'    => $makam->keterangan,
                'gambar'        => $makam->gambar,
                'lat'           => $geo ? (float) $geo->lat : null,
                'lng'           => $geo ? (float) $geo->lng : null,
            ],
            'tpu_list'  => $this->getTpuList(),
            'blok_list' => $this->getBlokList(),
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function update(Request $request, Makam $makam)
    {
        // Inertia forceFormData mengirim null sebagai string — normalkan dulu
        foreach (['blok_tpu_id', 'lat', 'lng'] as $field) {
            if ($request->input($field) === '' || $request->input($field) === 'null') {
                $request->merge([$field => null]);
            }
        }

        $validated = $request->validate([
            'nama_nisan'    => 'nullable|string|max:64',
            'blok_tpu_id'   => 'nullable|integer|exists:blok_tpu,id',
            'tanggal_lahir' => 'nullable|date',
            'tanggal_wafat' => 'nullable|date|after_or_equal:tanggal_lahir',
            'keterangan'    => 'nullable|string|max:1000',
            'gambar'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'lat'           => 'nullable|numeric|between:-90,90',
            'lng'           => 'nullable|numeric|between:-180,180',
        ]);

        if ($request->hasFile('gambar')) {
            if ($makam->gambar) Storage::disk('public')->delete($makam->gambar);
            $validated['gambar'] = $request->file('gambar')->store('makam', 'public');
        }

        $lat = $request->input('lat');
        $lng = $request->input('lng');
        unset($validated['lat'], $validated['lng']);

        $makam->update($validated);

        if ($lat !== null && $lng !== null) {
            DB::statement(
                'UPDATE makam SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                [(float) $lng, (float) $lat, $makam->id]
            );
        }

        return redirect()->route('makam.index')->with('success', 'Data makam berhasil diperbarui.');
    }

    public function destroy(Makam $makam)
    {
        if ($makam->gambar) {
            Storage::disk('public')->delete($makam->gambar);
        }

        $makam->delete();

        return redirect()->route('makam.index')->with('success', 'Data makam berhasil dihapus.');
    }

    // ── Helper ──────────────────────────────────────────────────

    private function getBlokList(): array
    {
        return BlokTpu::with('tpu')
            ->get()
            ->map(fn ($b) => [
                'id'       => $b->id,
                'tpu_id'   => $b->tpu_id,
                'label'    => optional($b->tpu)->nama
                    ? "Blok #{$b->id} — " . $b->tpu->nama
                    : "Blok #{$b->id}",
                'tpu_nama' => optional($b->tpu)->nama,
            ])
            ->toArray();
    }

    private function getTpuList(): array
    {
        return Tpu::select('id', 'nama', 'alamat')
            ->selectRaw('ST_AsGeoJSON(geom) as geom_json')
            ->orderBy('nama')
            ->get()
            ->map(fn ($t) => [
                'id'       => $t->id,
                'nama'     => $t->nama,
                'alamat'   => $t->alamat,
                'polygon'  => $t->geom_json ? json_decode($t->geom_json, true) : null,
            ])
            ->toArray();
    }
}
