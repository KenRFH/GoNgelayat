<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::whereIn('role', ['admin', 'superadmin'])
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return Inertia::render('users/Index', [
            'users' => $users,
            'auth'  => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function create()
    {
        return Inertia::render('users/Form', [
            'user_data' => null,
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:user,email',
            'password' => 'required|string|min:8',
            'role'     => ['required', Rule::in(['admin', 'superadmin'])],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);

        return redirect()->route('users.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function edit(User $user)
    {
        return Inertia::render('users/Form', [
            'user_data' => $user->only('id', 'name', 'email', 'role'),
            'auth'      => ['user' => Auth::user()->only('name', 'email', 'role')],
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => ['required', 'email', Rule::unique('user', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role'     => ['required', Rule::in(['admin', 'superadmin'])],
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('users.index')->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        // Tidak boleh hapus akun sendiri
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'Anda tidak bisa menghapus akun sendiri.']);
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'Pengguna berhasil dihapus.');
    }
}
