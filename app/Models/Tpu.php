<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tpu extends Model
{
    protected $table = 'tpu';

    protected $fillable = [
        'nama',
        'alamat',
        'geom',
    ];

    public function blokTpu()
    {
        return $this->hasMany(BlokTpu::class, 'tpu_id');
    }
}
