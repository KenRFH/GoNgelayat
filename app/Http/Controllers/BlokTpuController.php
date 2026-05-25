<?php

namespace App\Http\Controllers;

use App\Models\BlokTpu;
use App\Models\Tpu;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BlokTpuController extends Controller
{
    public function index()
    {
        $blok = BlokTpu::with(['tpu', 'user'])
            ->get()
            ->map(fn ($b) => [
                'id'       => $b->id,
                'tpu_id'   => $b->tpu_id,
                'tpu_nama' => optional($b->tpu)->nama,
                'user_id'  => $b->user_id,
                'user_nama'=> optional($b->user)->name,
                'label'    => optional($b->tpu)->nama
                    ? "Blok #{$b->id} — " . $b->tpu->nama
                    : "Blok #{$b->id}",
            ]);

        return Inertia::render('blok-tpu/Index', [
            'blok_list' => $blok,
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function create()
    {
        return Inertia::render('blok-tpu/Form', [
            'blok'      => null,
            'tpu_list'  => $this->getTpuList(),
            'user_list' => $this->getUserList(),
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tpu_id'  => 'required|integer|exists:tpu,id',
            'user_id' => 'nullable|integer|exists:user,id',
        ]);

        BlokTpu::create($validated);

        return redirect()->route('blok-tpu.index')
            ->with('success', 'Blok TPU berhasil ditambahkan.');
    }

    public function edit(BlokTpu $blokTpu)
    {
        return Inertia::render('blok-tpu/Form', [
            'blok'      => [
                'id'      => $blokTpu->id,
                'tpu_id'  => $blokTpu->tpu_id,
                'user_id' => $blokTpu->user_id,
            ],
            'tpu_list'  => $this->getTpuList(),
            'user_list' => $this->getUserList(),
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function update(Request $request, BlokTpu $blokTpu)
    {
        $validated = $request->validate([
            'tpu_id'  => 'required|integer|exists:tpu,id',
            'user_id' => 'nullable|integer|exists:user,id',
        ]);

        $blokTpu->update($validated);

        return redirect()->route('blok-tpu.index')
            ->with('success', 'Blok TPU berhasil diperbarui.');
    }

    public function destroy(BlokTpu $blokTpu)
    {
        $blokTpu->delete();

        return redirect()->route('blok-tpu.index')
            ->with('success', 'Blok TPU berhasil dihapus.');
    }

    // ── Helpers ─────────────────────────────────────────────────

    private function getTpuList(): array
    {
        return Tpu::orderBy('nama')
            ->get(['id', 'nama', 'alamat'])
            ->toArray();
    }

    private function getUserList(): array
    {
        return User::whereIn('role', ['admin', 'superadmin'])
            ->orderBy('name')
            ->get(['id', 'name', 'role'])
            ->toArray();
    }
}
