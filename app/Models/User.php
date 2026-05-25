<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Gunakan tabel 'user' bukan 'users' (konvensi proyek ini).
     */
    protected $table = 'user';

    /**
     * Kolom yang bisa diisi massal.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'blok_tpu_id',
    ];

    /**
     * Kolom yang disembunyikan saat serialisasi.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Cast tipe data kolom.
     */
    protected function casts(): array
    {
        return [
            'password'         => 'hashed',
            'created_at'       => 'datetime',
            'updated_at'       => 'datetime',
        ];
    }

    /**
     * Cek apakah user adalah superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Cek apakah user adalah admin atau superadmin.
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }
}
