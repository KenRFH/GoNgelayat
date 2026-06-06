<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tpu extends Model
{
    protected $table = 'tpu';

    protected $fillable = [
        'nama',
        'alamat',
        'sisa_lahan_m2',
        'geom',
    ];

    public function makam()
    {
        return $this->hasMany(Makam::class, 'tpu_id');
    }
}
