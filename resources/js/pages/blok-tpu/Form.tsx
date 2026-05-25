import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

interface TpuItem {
    id: number;
    nama: string;
    alamat: string | null;
}

interface UserItem {
    id: number;
    name: string;
    role: string;
}

interface BlokData {
    id?: number;
    tpu_id: number | null;
    user_id: number | null;
}

interface Props {
    blok: BlokData | null;
    tpu_list: TpuItem[];
    user_list: UserItem[];
}

export default function BlokTpuForm({ blok, tpu_list, user_list }: Props) {
    const isEdit = !!blok?.id;

    const { data, setData, post, put, processing, errors } = useForm({
        tpu_id:  blok?.tpu_id  ?? ('' as any),
        user_id: blok?.user_id ?? ('' as any),
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/blok-tpu/${blok!.id}`);
        } else {
            post('/blok-tpu');
        }
    }

    return (
        <AdminLayout title={isEdit ? 'Edit Blok TPU' : 'Tambah Blok TPU'}>
            <Head title={`${isEdit ? 'Edit' : 'Tambah'} Blok TPU — GoNgelayat`} />

            <div style={{ maxWidth: '520px' }}>
                <div className="section-header fade-in">
                    <h2 className="section-title">
                        {isEdit ? `Edit Blok #${blok!.id}` : 'Tambah Blok TPU Baru'}
                    </h2>
                    <Link href="/blok-tpu" className="btn btn-secondary btn-sm">← Kembali</Link>
                </div>

                {/* Info box */}
                <div className="fade-in stagger-1" style={{
                    padding: '0.75rem 1rem', background: '#f5f5f5',
                    border: '1px solid #e5e7eb', borderRadius: '0.625rem',
                    marginBottom: '1rem', fontSize: '0.8rem', color: '#374151',
                    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280"
                        strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>
                        Blok TPU adalah pembagian area dalam sebuah TPU. Satu TPU dapat memiliki
                        banyak blok, dan setiap blok dapat ditugaskan ke seorang admin.
                    </span>
                </div>

                <div className="card fade-in stagger-2">
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Pilih TPU */}
                        <div className="form-group">
                            <label htmlFor="blok-tpu-id" className="form-label">
                                TPU <span style={{ color: '#dc2626' }}>*</span>
                            </label>

                            {tpu_list.length === 0 ? (
                                <div style={{
                                    padding: '0.75rem', background: '#fee2e2',
                                    border: '1px solid #fecaca', borderRadius: '0.5rem',
                                    fontSize: '0.82rem', color: '#991b1b',
                                }}>
                                    Belum ada data TPU.{' '}
                                    <Link href="/tpu/create" style={{ color: '#7f1d1d', fontWeight: 600 }}>
                                        Tambah TPU dulu
                                    </Link>.
                                </div>
                            ) : (
                                <select
                                    id="blok-tpu-id"
                                    className={`form-input ${errors.tpu_id ? 'error' : ''}`}
                                    value={data.tpu_id ?? ''}
                                    onChange={e => setData('tpu_id', e.target.value ? Number(e.target.value) : '')}
                                >
                                    <option value="">— Pilih TPU —</option>
                                    {tpu_list.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.nama}{t.alamat ? ` — ${t.alamat.slice(0, 40)}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {errors.tpu_id && <span className="form-error">{errors.tpu_id}</span>}
                        </div>

                        {/* Pilih Admin Penanggung Jawab */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="blok-user-id" className="form-label">
                                Admin Penanggung Jawab
                                <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '0.25rem' }}>
                                    (opsional)
                                </span>
                            </label>

                            <select
                                id="blok-user-id"
                                className={`form-input ${errors.user_id ? 'error' : ''}`}
                                value={data.user_id ?? ''}
                                onChange={e => setData('user_id', e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">— Tidak ditugaskan —</option>
                                {user_list.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>

                            {errors.user_id && <span className="form-error">{errors.user_id}</span>}
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                                Admin yang ditugaskan akan bertanggung jawab atas blok ini.
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                id="btn-simpan-blok"
                                type="submit"
                                className="btn btn-primary"
                                disabled={processing || tpu_list.length === 0}
                            >
                                {processing ? 'Menyimpan...' : isEdit ? 'Perbarui Blok' : 'Simpan Blok'}
                            </button>
                            <Link href="/blok-tpu" className="btn btn-secondary">Batal</Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
