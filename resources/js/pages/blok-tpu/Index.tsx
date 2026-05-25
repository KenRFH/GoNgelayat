import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

interface BlokItem {
    id: number;
    tpu_id: number | null;
    tpu_nama: string | null;
    user_id: number | null;
    user_nama: string | null;
    label: string;
}

interface Props {
    blok_list: BlokItem[];
}

function ConfirmModal({ item, onCancel, onConfirm }: {
    item: BlokItem; onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Hapus Blok TPU</h3>
                <p className="modal-desc">
                    Yakin ingin menghapus <strong>{item.label}</strong>?
                    Semua makam yang terhubung ke blok ini akan kehilangan referensinya.
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Batal</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm} id="btn-confirm-delete-blok">
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BlokTpuIndex({ blok_list }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<BlokItem | null>(null);

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/blok-tpu/${deleteTarget.id}`);
        setDeleteTarget(null);
    }

    // Group by TPU for better readability
    const grouped = blok_list.reduce<Record<string, BlokItem[]>>((acc, b) => {
        const key = b.tpu_nama ?? 'Tanpa TPU';
        if (!acc[key]) acc[key] = [];
        acc[key].push(b);
        return acc;
    }, {});

    return (
        <AdminLayout title="Kelola Blok TPU">
            <Head title="Kelola Blok TPU — GoNgelayat" />

            <div className="section-header fade-in">
                <div>
                    <h2 className="section-title">Daftar Blok TPU</h2>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        {blok_list.length} blok terdaftar
                    </p>
                </div>
                <Link href="/blok-tpu/create" className="btn btn-primary btn-sm" id="btn-tambah-blok">
                    + Tambah Blok
                </Link>
            </div>

            {blok_list.length === 0 ? (
                <div className="card fade-in stagger-1">
                    <div className="empty-state">
                        <p>
                            Belum ada blok TPU.{' '}
                            <Link href="/blok-tpu/create" style={{ color: '#0a0a0a', fontWeight: 500 }}>
                                Tambah sekarang
                            </Link>{' '}
                            atau pastikan sudah ada{' '}
                            <Link href="/tpu" style={{ color: '#0a0a0a', fontWeight: 500 }}>
                                data TPU
                            </Link>{' '}
                            terlebih dahulu.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {Object.entries(grouped).map(([tpuNama, bloks], gi) => (
                        <div key={tpuNama} className={`fade-in stagger-${gi + 1}`}>
                            {/* TPU Group header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                marginBottom: '0.5rem',
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="#6b7280" strokeWidth="2">
                                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                                    <line x1="9" y1="3" x2="9" y2="18"/>
                                    <line x1="15" y1="6" x2="15" y2="21"/>
                                </svg>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600,
                                    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {tpuNama}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                    ({bloks.length} blok)
                                </span>
                            </div>

                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '48px' }}>ID Blok</th>
                                            <th>TPU</th>
                                            <th>Admin Penanggung Jawab</th>
                                            <th style={{ textAlign: 'right' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bloks.map(b => (
                                            <tr key={b.id}>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '28px', height: '28px',
                                                        background: '#0a0a0a', color: '#fff',
                                                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                    }}>
                                                        {b.id}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>
                                                    {b.tpu_nama ?? <span style={{ color: '#9ca3af' }}>—</span>}
                                                </td>
                                                <td>
                                                    {b.user_nama ? (
                                                        <span style={{ fontSize: '0.85rem' }}>{b.user_nama}</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.82rem', color: '#9ca3af',
                                                            fontStyle: 'italic' }}>Belum ditugaskan</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                        <Link
                                                            href={`/blok-tpu/${b.id}/edit`}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => setDeleteTarget(b)}
                                                            id={`btn-delete-blok-${b.id}`}
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
