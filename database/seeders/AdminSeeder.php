<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Superadmin — akses penuh ke semua fitur
        User::updateOrCreate(
            ['email' => 'superadmin@gongelayat.id'],
            [
                'name'     => 'Super Admin',
                'email'    => 'superadmin@gongelayat.id',
                'password' => Hash::make('superadmin123'),
                'role'     => 'superadmin',
            ]
        );

        // Admin — akses kelola makam & blok TPU
        User::updateOrCreate(
            ['email' => 'admin@gongelayat.id'],
            [
                'name'     => 'Admin TPU',
                'email'    => 'admin@gongelayat.id',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
            ]
        );

        $this->command->info('✅ Akun superadmin dan admin berhasil dibuat.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['superadmin', 'superadmin@gongelayat.id', 'superadmin123'],
                ['admin',      'admin@gongelayat.id',      'admin123'],
            ]
        );
    }
}
