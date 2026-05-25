<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlokTpu extends Model
{
    protected $table = 'blok_tpu';

    public $timestamps = false;

    protected $fillable = [
        'blok_id',
        'user_id',
        'tpu_id',
    ];

    public function tpu()
    {
        return $this->belongsTo(Tpu::class, 'tpu_id');
    }

    public function blok()
    {
        return $this->belongsTo(Blok::class, 'blok_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
