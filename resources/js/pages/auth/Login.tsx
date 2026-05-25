import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthLayout from '../../layouts/AuthLayout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <AuthLayout>
            <Head title="Login — GoNgelayat" />

            <div className="login-card fade-in">
                {/* Logo */}
                <div className="login-logo" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a5 5 0 0 1 5 5v7H7V7a5 5 0 0 1 5-5z"/>
                        <line x1="7" y1="14" x2="17" y2="14"/>
                        <line x1="12" y1="14" x2="12" y2="22"/>
                    </svg>
                </div>

                <h1 className="login-title">GoNgelayat</h1>
                <p className="login-subtitle">Masuk ke panel manajemen kuburan</p>

                {/* Global error */}
                {errors.email && !data.email && (
                    <div className="alert-error" role="alert">{errors.email}</div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="login-email" className="form-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="nama@gongelayat.id"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && (
                            <span className="form-error">{errors.email}</span>
                        )}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                placeholder="••••••••"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                autoComplete="current-password"
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                id="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', color: '#9ca3af',
                                    padding: 0, display: 'flex',
                                }}
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <span className="form-error">{errors.password}</span>
                        )}
                    </div>

                    {/* Remember me */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <input
                            id="remember"
                            type="checkbox"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                            style={{ width: '14px', height: '14px', accentColor: '#0a0a0a', cursor: 'pointer' }}
                        />
                        <label htmlFor="remember" style={{ fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer' }}>
                            Ingat saya
                        </label>
                    </div>

                    <button
                        id="btn-login"
                        type="submit"
                        className="btn btn-primary"
                        disabled={processing}
                        style={{ width: '100%', padding: '0.7rem' }}
                    >
                        {processing ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                                Memproses...
                            </>
                        ) : 'Masuk'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '1.5rem', marginBottom: 0 }}>
                    Hanya untuk admin & superadmin
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AuthLayout>
    );
}
