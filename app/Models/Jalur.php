<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jalur extends Model
{
    protected $table = 'jalur';

    protected $fillable = [
        'tpu_id',
        'nama',
    ];

    public function tpu()
    {
        return $this->belongsTo(Tpu::class, 'tpu_id');
    }
}
