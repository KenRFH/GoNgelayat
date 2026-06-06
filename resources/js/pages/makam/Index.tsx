import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

// ── Types ──────────────────────────────────────────────────────
interface MakamItem {
    id: number;
    nama_nisan: string | null;
    tanggal_lahir: string | null;
    tanggal_wafat: string | null;
    gambar: string | null;
    keterangan: string | null;
    tpu_nama: string | null;
    tpu_id: number | null;
    created_at: string | null;
}

interface Filters {
    q: string;
    tgl_lahir: string;
    tgl_wafat: string;
}

interface Props {
    makam_list: MakamItem[];
    filters: Filters;
    total_all: number;
    auth: { user: { role: string } };
}

// ── Helpers ────────────────────────────────────────────────────
function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function calcAge(lahir: string | null, wafat: string | null): string | null {
    if (!lahir || !wafat) return null;
    const diff = new Date(wafat).getFullYear() - new Date(lahir).getFullYear();
    return `${diff} thn`;
}

// ── Confirm delete modal ───────────────────────────────────────
function ConfirmModal({ item, onCancel, onConfirm }: {
    item: MakamItem; onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Hapus Data Makam</h3>
                <p className="modal-desc">
                    Yakin ingin menghapus makam atas nama{' '}
                    <strong>{item.nama_nisan || '(Tanpa Nama)'}</strong>?
                    Tindakan ini tidak bisa dibatalkan.
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Batal</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm} id="btn-confirm-delete-makam">
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────
export default function MakamIndex({ makam_list, filters, total_all }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<MakamItem | null>(null);

    // Local filter state (mirrored from server)
    const [q, setQ]               = useState(filters.q);
    const [tglLahir, setTglLahir] = useState(filters.tgl_lahir);
    const [tglWafat, setTglWafat] = useState(filters.tgl_wafat);

    const activeFilters = (filters.q ? 1 : 0) + (filters.tgl_lahir ? 1 : 0) + (filters.tgl_wafat ? 1 : 0);
    const isFiltered = activeFilters > 0;

    function applyFilters() {
        const params: Record<string, string> = {};
        if (q.trim()) params.q = q.trim();
        if (tglLahir) params.tgl_lahir = tglLahir;
        if (tglWafat) params.tgl_wafat = tglWafat;
        router.get('/makam', params, { preserveState: true, preserveScroll: true });
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') applyFilters();
    }

    function clearFilters() {
        setQ('');
        setTglLahir('');
        setTglWafat('');
        router.get('/makam', {}, { preserveState: false });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/makam/${deleteTarget.id}`);
        setDeleteTarget(null);
    }

    return (
        <AdminLayout title="Kelola Makam">
            <Head title="Kelola Makam — GoNgelayat" />

            {/* Header */}
            <div className="section-header fade-in">
                <div>
                    <h2 className="section-title">Data Makam</h2>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        {isFiltered
                            ? `${makam_list.length} hasil dari ${total_all} total makam`
                            : `${total_all} total makam terdaftar`}
                    </p>
                </div>
                <Link href="/makam/create" className="btn btn-primary btn-sm" id="btn-tambah-makam">
                    + Tambah Makam
                </Link>
            </div>

            {/* ── Filter bar ── */}
            <div className="fade-in stagger-1" style={{ marginBottom: '1rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 160px auto',
                    gap: '0.5rem',
                    alignItems: 'flex-end',
                    background: '#f9f9f9',
                    border: '1px solid #f0f0f0',
                    borderRadius: '0.75rem',
                    padding: '0.875rem 1rem',
                }}>
                    {/* Nama Nisan */}
                    <div>
                        <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
                            Nama Nisan / TPU
                        </label>
                        <div style={{ position: 'relative' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="#9ca3af" strokeWidth="2"
                                style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }}>
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                id="filter-q"
                                type="text"
                                className="form-input"
                                placeholder="Cari nama nisan atau TPU..."
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>

                    {/* Tanggal Lahir */}
                    <div>
                        <label htmlFor="filter-tgl-lahir" style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
                            Tanggal Lahir
                        </label>
                        <input
                            id="filter-tgl-lahir"
                            type="date"
                            className="form-input"
                            value={tglLahir}
                            onChange={e => setTglLahir(e.target.value)}
                            style={{ fontSize: '0.82rem' }}
                        />
                    </div>

                    {/* Tanggal Wafat */}
                    <div>
                        <label htmlFor="filter-tgl-wafat" style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
                            Tanggal Meninggal
                        </label>
                        <input
                            id="filter-tgl-wafat"
                            type="date"
                            className="form-input"
                            value={tglWafat}
                            onChange={e => setTglWafat(e.target.value)}
                            style={{ fontSize: '0.82rem' }}
                        />
                    </div>

                    {/* Tombol aksi */}
                    <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '1.35rem' }}>
                        <button
                            id="btn-apply-filter"
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={applyFilters}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Cari
                        </button>
                        {(q || tglLahir || tglWafat) && (
                            <button
                                id="btn-clear-filter"
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={clearFilters}
                                title="Reset filter"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Active filter tags */}
                {isFiltered && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {filters.q && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.15rem 0.6rem',
                                background: '#0a0a0a', color: '#fff',
                                borderRadius: '99px', fontSize: '0.72rem',
                            }}>
                                Nama: <strong>{filters.q}</strong>
                            </span>
                        )}
                        {filters.tgl_lahir && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.15rem 0.6rem',
                                background: '#0a0a0a', color: '#fff',
                                borderRadius: '99px', fontSize: '0.72rem',
                            }}>
                                Lahir: <strong>{formatDate(filters.tgl_lahir)}</strong>
                            </span>
                        )}
                        {filters.tgl_wafat && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.15rem 0.6rem',
                                background: '#0a0a0a', color: '#fff',
                                borderRadius: '99px', fontSize: '0.72rem',
                            }}>
                                Meninggal: <strong>{formatDate(filters.tgl_wafat)}</strong>
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            style={{
                                background: 'none', border: 'none',
                                fontSize: '0.72rem', color: '#6b7280',
                                cursor: 'pointer', padding: '0.15rem 0.3rem',
                                textDecoration: 'underline',
                            }}
                        >
                            Hapus semua filter
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="table-wrapper fade-in stagger-2">
                {makam_list.length === 0 ? (
                    <div className="empty-state">
                        {total_all === 0 ? (
                            <p>Belum ada data makam.{' '}
                                <Link href="/makam/create" style={{ color: '#0a0a0a', fontWeight: 500 }}>
                                    Tambah sekarang
                                </Link>.
                            </p>
                        ) : (
                            <div>
                                <p style={{ marginBottom: '0.75rem' }}>
                                    Tidak ada makam yang cocok dengan filter yang dipilih.
                                </p>
                                <button onClick={clearFilters} className="btn btn-secondary btn-sm">
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Foto</th>
                                <th>Nama Nisan</th>
                                <th>Tgl Lahir</th>
                                <th>Tgl Wafat</th>
                                <th>Umur</th>
                                <th>TPU</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {makam_list.map((m, i) => (
                                <tr key={m.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '0.8rem', width: '36px' }}>
                                        {i + 1}
                                    </td>
                                    <td style={{ width: '48px' }}>
                                        {m.gambar ? (
                                            <img
                                                src={`/storage/${m.gambar}`}
                                                alt={m.nama_nisan ?? ''}
                                                style={{
                                                    width: '36px', height: '36px',
                                                    objectFit: 'cover', borderRadius: '6px',
                                                    border: '1px solid #e5e7eb',
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '36px', height: '36px',
                                                background: '#f5f5f5', borderRadius: '6px',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', color: '#d1d5db',
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                                    <polyline points="21 15 16 10 5 21"/>
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 500 }}>
                                            {m.nama_nisan || <span style={{ color: '#9ca3af' }}>(Tanpa Nama)</span>}
                                        </span>
                                        {m.keterangan && (
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1px',
                                                maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {m.keterangan}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                                        {formatDate(m.tanggal_lahir)}
                                    </td>
                                    <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                                        {formatDate(m.tanggal_wafat)}
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {calcAge(m.tanggal_lahir, m.tanggal_wafat) ?? '—'}
                                    </td>
                                    <td style={{ fontSize: '0.83rem', color: '#6b7280' }}>
                                        {m.tpu_nama ?? <span style={{ color: '#d1d5db' }}>—</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/makam/${m.id}/edit`} className="btn btn-secondary btn-sm">
                                                Edit
                                            </Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setDeleteTarget(m)}
                                                id={`btn-delete-makam-${m.id}`}
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
