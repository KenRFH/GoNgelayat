<?php

namespace App\Http\Controllers;

use App\Models\BlokTpu;
use App\Models\Makam;
use App\Models\Tpu;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'superadmin') {
            $stats = [
                'total_tpu'   => Tpu::count(),
                'total_blok'  => BlokTpu::count(),
                'total_admin' => User::where('role', 'admin')->count(),
                'total_makam' => Makam::count(), 
            ];

            $recent = Tpu::withCount('blokTpu')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'nama', 'alamat', 'created_at'])
                ->map(fn ($t) => [
                    'id'             => $t->id,
                    'nama'           => $t->nama,
                    'alamat'         => $t->alamat,
                    'blok_tpu_count' => $t->blok_tpu_count,
                    'created_at'     => $t->created_at?->format('Y-m-d'),
                ]);

            return Inertia::render('dashboard/Index', [
                'stats'   => $stats,
                'recent'  => $recent,
                'mode'    => 'superadmin',
                'auth'    => ['user' => $user->only('name', 'email', 'role')],
            ]);
        }

        // Admin: fokus ke makam
        $stats = [
            'total_makam'  => Makam::count(),
            'total_blok'   => BlokTpu::count(),
            'total_tpu'    => Tpu::count(),
        ];

        $recent = Makam::with('blokTpu.tpu')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($m) => [
                'id'            => $m->id,
                'nama_nisan'    => $m->nama_nisan,
                'tpu_nama'      => optional(optional($m->blokTpu)->tpu)->nama,
                'tanggal_wafat' => $m->tanggal_wafat?->format('Y-m-d'),
                'created_at'    => $m->created_at?->format('Y-m-d'),
            ]);

        return Inertia::render('dashboard/Index', [
            'stats'  => $stats,
            'recent' => $recent,
            'mode'   => 'admin',
            'auth'   => ['user' => $user->only('name', 'email', 'role')],
        ]);
    }
}
