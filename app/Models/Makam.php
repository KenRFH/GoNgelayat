<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Makam extends Model
{
    protected $table = 'makam';

    protected $fillable = [
        'tpu_id',
        'user_id',
        'nama_nisan',
        'tanggal_lahir',
        'tanggal_wafat',
        'gambar',
        'keterangan',
        'geom',
    ];
    protected $casts = [
        'tanggal_lahir' => 'date',
        'tanggal_wafat' => 'date',
    ];

    public function tpu()
    {
        return $this->belongsTo(Tpu::class, 'tpu_id');
    }
}
