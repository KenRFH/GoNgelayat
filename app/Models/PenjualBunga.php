<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenjualBunga extends Model
{
    protected $table = 'penjual_bunga';

    protected $fillable = [
        'nama_toko',
        'alamat',
        'no_hp',
    ];
}
