<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Blok extends Model
{
    protected $table = 'blok';

    protected $fillable = ['nama', 'nomor'];

    public function blokTpu()
    {
        return $this->hasMany(BlokTpu::class, 'blok_id');
    }
}
