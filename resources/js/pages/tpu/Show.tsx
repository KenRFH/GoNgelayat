import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';
import TpuPolygonMap from '../../components/TpuPolygonMap';

interface Coordinate {
    lat: number;
    lng: number;
}

// ── Types ──────────────────────────────────────────────────────
interface TpuData {
    id: number;
    nama: string;
    alamat: string | null;
    polygon?: Coordinate[];
    created_at: string;
}

interface BlokItem {
    blok_tpu_id: number;
    blok_id: number | null;
    nama: string | null;
    nomor: number | null;
}

interface Grave {
    id: number;
    nama_nisan: string;
    lat: number | null;
    lng: number | null;
}

interface Props {
    tpu: TpuData;
    blok_list: BlokItem[];
    makam_list?: Grave[];
}

// ── Confirm delete modal ───────────────────────────────────────
function ConfirmModal({ label, onCancel, onConfirm }: {
    label: string; onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Hapus Blok</h3>
                <p className="modal-desc">
                    Yakin ingin menghapus <strong>{label}</strong>?
                    Makam yang terhubung ke blok ini akan kehilangan referensinya.
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

// ── Inline edit row ────────────────────────────────────────────
function BlokRow({ blok, tpuId, onDelete }: {
    blok: BlokItem; tpuId: number; onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing } = useForm({
        nama:  blok.nama  ?? '',
        nomor: blok.nomor ?? ('' as any),
    });

    function handleSave() {
        put(`/tpu/${tpuId}/blok/${blok.blok_tpu_id}`, {
            onSuccess: () => setEditing(false),
        });
    }

    const blokLabel = blok.nama
        ? `${blok.nama}${blok.nomor ? ` (No. ${blok.nomor})` : ''}`
        : blok.nomor
        ? `Nomor ${blok.nomor}`
        : `Blok #${blok.blok_tpu_id}`;

    return (
        <tr>
            {/* ID */}
            <td style={{ width: '48px' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px',
                    background: '#0a0a0a', color: '#fff',
                    borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                }}>
                    {blok.blok_tpu_id}
                </span>
            </td>

            {/* Nama Blok */}
            <td>
                {editing ? (
                    <input
                        type="text"
                        className="form-input"
                        value={data.nama}
                        onChange={e => setData('nama', e.target.value)}
                        placeholder="Nama blok"
                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                    />
                ) : (
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {blok.nama || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>}
                    </span>
                )}
            </td>

            {/* Nomor */}
            <td style={{ width: '80px' }}>
                {editing ? (
                    <input
                        type="number"
                        className="form-input"
                        value={data.nomor}
                        onChange={e => setData('nomor', e.target.value)}
                        placeholder="No."
                        min={1}
                        style={{ width: '70px', fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                    />
                ) : (
                    <span style={{ fontSize: '0.85rem', color: '#374151' }}>
                        {blok.nomor ?? <span style={{ color: '#9ca3af' }}>—</span>}
                    </span>
                )}
            </td>

            {/* Aksi */}
            <td>
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    {editing ? (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={handleSave}
                                disabled={processing} id={`btn-save-blok-${blok.blok_tpu_id}`}>
                                {processing ? '...' : 'Simpan'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                                Batal
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}
                                id={`btn-edit-blok-${blok.blok_tpu_id}`}>
                                Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={onDelete}
                                id={`btn-delete-blok-${blok.blok_tpu_id}`}>
                                Hapus
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ── Add Blok Form ──────────────────────────────────────────────
function AddBlokForm({ tpuId }: { tpuId: number }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        nama:  '',
        nomor: '' as any,
    });

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        post(`/tpu/${tpuId}/blok`, {
            onSuccess: () => { reset(); setOpen(false); },
        });
    }

    if (!open) {
        return (
            <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)} id="btn-tambah-blok">
                + Tambah Blok
            </button>
        );
    }

    return (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                <label htmlFor="new-blok-nama" className="form-label" style={{ fontSize: '0.75rem' }}>
                    Nama Blok
                </label>
                <input
                    id="new-blok-nama"
                    type="text"
                    className="form-input"
                    value={data.nama}
                    onChange={e => setData('nama', e.target.value)}
                    placeholder="cth. Blok A"
                    maxLength={64}
                    style={{ fontSize: '0.82rem' }}
                />
            </div>
            <div className="form-group" style={{ margin: 0, width: '90px' }}>
                <label htmlFor="new-blok-nomor" className="form-label" style={{ fontSize: '0.75rem' }}>
                    Nomor
                </label>
                <input
                    id="new-blok-nomor"
                    type="number"
                    className="form-input"
                    value={data.nomor}
                    onChange={e => setData('nomor', e.target.value)}
                    placeholder="1"
                    min={1}
                    style={{ fontSize: '0.82rem' }}
                />
            </div>
            <button id="btn-simpan-blok-baru" type="submit"
                className="btn btn-primary btn-sm" disabled={processing}>
                {processing ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => { reset(); setOpen(false); }}>
                Batal
            </button>
        </form>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TpuShow({ tpu, blok_list, makam_list = [] }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<BlokItem | null>(null);

    function handleDeleteBlok() {
        if (!deleteTarget) return;
        router.delete(`/tpu/${tpu.id}/blok/${deleteTarget.blok_tpu_id}`);
        setDeleteTarget(null);
    }

    return (
        <AdminLayout title={tpu.nama}>
            <Head title={`${tpu.nama} — GoNgelayat`} />

            {/* Breadcrumb */}
            <div className="fade-in" style={{ marginBottom: '1.25rem', display: 'flex',
                alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#6b7280' }}>
                <Link href="/tpu" style={{ color: '#6b7280', textDecoration: 'none' }}>Kelola TPU</Link>
                <span>/</span>
                <span style={{ color: '#0a0a0a', fontWeight: 500 }}>{tpu.nama}</span>
            </div>

            {/* TPU info card */}
            <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                            <div style={{ width: '36px', height: '36px', background: '#0a0a0a',
                                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                                </svg>
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{tpu.nama}</h2>
                        </div>
                        {tpu.alamat && (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', marginLeft: '2.625rem' }}>
                                {tpu.alamat}
                            </p>
                        )}
                    </div>
                    <Link href={`/tpu/${tpu.id}/edit`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                        Edit TPU
                    </Link>
                </div>

                {/* Stat */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{blok_list.length}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase',
                        letterSpacing: '0.07em', marginTop: '0.2rem' }}>Total Blok</div>
                </div>
            </div>

            {/* Peta Area TPU (Geometri Spasial) */}
            <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.875rem',
                    paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                    Batas Geografis Wilayah TPU
                </div>
                <TpuPolygonMap
                    readOnly={true}
                    initialPolygon={tpu.polygon}
                    graves={makam_list}
                />
            </div>

            {/* Blok management */}
            <div className="fade-in stagger-1">
                <div className="section-header" style={{ marginBottom: '0.875rem' }}>
                    <h3 className="section-title">Daftar Blok</h3>
                    <AddBlokForm tpuId={tpu.id} />
                </div>

                <div className="table-wrapper">
                    {blok_list.length === 0 ? (
                        <div className="empty-state">
                            <p>Belum ada blok. Klik <strong>+ Tambah Blok</strong> untuk memulai.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '48px' }}>ID</th>
                                    <th>Nama Blok</th>
                                    <th style={{ width: '80px' }}>Nomor</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blok_list.map(blok => (
                                    <BlokRow
                                        key={blok.blok_tpu_id}
                                        blok={blok}
                                        tpuId={tpu.id}
                                        onDelete={() => setDeleteTarget(blok)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {deleteTarget && (
                <ConfirmModal
                    label={deleteTarget.nama
                        ? `${deleteTarget.nama}${deleteTarget.nomor ? ` No.${deleteTarget.nomor}` : ''}`
                        : `Blok #${deleteTarget.blok_tpu_id}`}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteBlok}
                />
            )}
        </AdminLayout>
    );
}
