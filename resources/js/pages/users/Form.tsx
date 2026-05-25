import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

interface UserData {
    id?: number;
    name: string;
    email: string;
    role: string;
}

interface Props {
    user_data: UserData | null;
}

export default function UsersForm({ user_data }: Props) {
    const isEdit = !!user_data?.id;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        name:     user_data?.name  ?? '',
        email:    user_data?.email ?? '',
        password: '',
        role:     user_data?.role  ?? 'admin',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/users/${user_data!.id}`);
        } else {
            post('/users');
        }
    }

    return (
        <AdminLayout title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}>
            <Head title={`${isEdit ? 'Edit' : 'Tambah'} Pengguna — GoNgelayat`} />

            <div style={{ maxWidth: '520px' }}>
                <div className="section-header fade-in">
                    <h2 className="section-title">{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
                    <Link href="/users" className="btn btn-secondary btn-sm">← Kembali</Link>
                </div>

                <div className="card fade-in stagger-1">
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Nama */}
                        <div className="form-group">
                            <label htmlFor="user-name" className="form-label">Nama Lengkap <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                id="user-name"
                                type="text"
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="cth. Budi Santoso"
                                maxLength={100}
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label htmlFor="user-email" className="form-label">Email <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                id="user-email"
                                type="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="budi@gongelayat.id"
                            />
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label htmlFor="user-password" className="form-label">
                                Password {isEdit && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(kosongkan jika tidak diubah)</span>}
                                {!isEdit && <span style={{ color: '#dc2626' }}>*</span>}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="user-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder={isEdit ? '••••••••' : 'Min. 8 karakter'}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    id="toggle-user-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '0.75rem', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex',
                                    }}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword
                                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    }
                                </button>
                            </div>
                            {errors.password && <span className="form-error">{errors.password}</span>}
                        </div>

                        {/* Role */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="user-role" className="form-label">Role <span style={{ color: '#dc2626' }}>*</span></label>
                            <select
                                id="user-role"
                                className={`form-input ${errors.role ? 'error' : ''}`}
                                value={data.role}
                                onChange={e => setData('role', e.target.value)}
                            >
                                <option value="admin">Admin</option>
                                <option value="superadmin">Superadmin</option>
                            </select>
                            {errors.role && <span className="form-error">{errors.role}</span>}
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                                {data.role === 'superadmin'
                                    ? 'Superadmin memiliki akses penuh ke semua fitur.'
                                    : 'Admin dapat mengelola makam dan blok TPU.'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                id="btn-simpan-user"
                                type="submit"
                                className="btn btn-primary"
                                disabled={processing}
                            >
                                {processing ? 'Menyimpan...' : isEdit ? 'Perbarui Pengguna' : 'Tambah Pengguna'}
                            </button>
                            <Link href="/users" className="btn btn-secondary">Batal</Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
