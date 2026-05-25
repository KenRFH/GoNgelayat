import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

interface TpuItem {
    id: number;
    nama: string;
    alamat: string | null;
    blok_tpu_count: number;
    created_at: string;
}

interface Props {
    tpu_list: TpuItem[];
}

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function ConfirmModal({ item, onCancel, onConfirm }: {
    item: TpuItem; onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Hapus TPU</h3>
                <p className="modal-desc">
                    Yakin ingin menghapus <strong>{item.nama}</strong>?
                    {item.blok_tpu_count > 0 && (
                        <span style={{ display: 'block', marginTop: '0.4rem', color: '#dc2626', fontSize: '0.8rem' }}>
                            ⚠ TPU ini memiliki {item.blok_tpu_count} blok yang akan ikut terhapus.
                        </span>
                    )}
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Batal</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm} id="btn-confirm-delete-tpu">
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TpuIndex({ tpu_list }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<TpuItem | null>(null);

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/tpu/${deleteTarget.id}`);
        setDeleteTarget(null);
    }

    return (
        <AdminLayout title="Kelola TPU">
            <Head title="Kelola TPU — GoNgelayat" />

            <div className="section-header fade-in">
                <div>
                    <h2 className="section-title">Daftar TPU</h2>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        Klik nama TPU untuk mengelola blok di dalamnya
                    </p>
                </div>
                <Link href="/tpu/create" className="btn btn-primary btn-sm" id="btn-tambah-tpu">
                    + Tambah TPU
                </Link>
            </div>

            <div className="table-wrapper fade-in stagger-1">
                {tpu_list.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            Belum ada data TPU.{' '}
                            <Link href="/tpu/create" style={{ color: '#0a0a0a', fontWeight: 500 }}>
                                Tambah sekarang
                            </Link>.
                        </p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nama TPU</th>
                                <th>Alamat</th>
                                <th style={{ textAlign: 'center' }}>Blok</th>
                                <th>Ditambahkan</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tpu_list.map((tpu, i) => (
                                <tr key={tpu.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '0.8rem', width: '40px' }}>
                                        {i + 1}
                                    </td>
                                    <td>
                                        <Link
                                            href={`/tpu/${tpu.id}`}
                                            style={{
                                                fontWeight: 600, color: '#0a0a0a',
                                                textDecoration: 'none', display: 'flex',
                                                alignItems: 'center', gap: '0.4rem',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                        >
                                            {tpu.nama}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                stroke="#9ca3af" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12"/>
                                                <polyline points="12 5 19 12 12 19"/>
                                            </svg>
                                        </Link>
                                    </td>
                                    <td style={{ color: '#6b7280', maxWidth: '240px' }}>
                                        <span style={{ display: 'block', overflow: 'hidden',
                                            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {tpu.alamat || '—'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '28px', height: '24px',
                                            padding: '0 0.5rem',
                                            background: tpu.blok_tpu_count > 0 ? '#0a0a0a' : '#f5f5f5',
                                            color: tpu.blok_tpu_count > 0 ? '#fff' : '#9ca3af',
                                            borderRadius: '99px',
                                            fontSize: '0.75rem', fontWeight: 600,
                                        }}>
                                            {tpu.blok_tpu_count}
                                        </span>
                                    </td>
                                    <td style={{ color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                        {formatDate(tpu.created_at)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/tpu/${tpu.id}`} className="btn btn-secondary btn-sm">
                                                Kelola Blok
                                            </Link>
                                            <Link href={`/tpu/${tpu.id}/edit`} className="btn btn-secondary btn-sm">
                                                Edit
                                            </Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setDeleteTarget(tpu)}
                                                id={`btn-delete-tpu-${tpu.id}`}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {deleteTarget && (
                <ConfirmModal
                    item={deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </AdminLayout>
    );
}
