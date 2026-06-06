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
    sisa_lahan_m2?: number | string | null;
    polygon?: Coordinate[];
    created_at: string;
    makam_count?: number; // for modal delete
}

interface Grave {
    id: number;
    nama_nisan: string;
    lat: number | null;
    lng: number | null;
}

interface FlowerSeller {
    id: number;
    nama_toko: string;
    alamat?: string | null;
    no_hp?: string | null;
    lat: number | null;
    lng: number | null;
}

interface Props {
    tpu: TpuData;
    makam_list?: Grave[];
    penjual_list?: FlowerSeller[];
}

// ── Modal Hapus ────────────────────────────────────────────────
function ConfirmModal({ tpu, makamCount, onCancel, onConfirm }: {
    tpu: TpuData; makamCount: number; onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Hapus TPU</h3>
                <p className="modal-desc">
                    Yakin ingin menghapus <strong>{tpu.nama}</strong>?
                    {makamCount > 0 && (
                        <span style={{ display: 'block', marginTop: '0.4rem', color: '#dc2626', fontSize: '0.8rem' }}>
                            ⚠ TPU ini memiliki {makamCount} makam yang akan ikut terhapus.
                        </span>
                    )}
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Batal</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm} id="btn-confirm-delete-tpu-show">
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TpuShow({ tpu, makam_list = [], penjual_list = [] }: Props) {
    const [showDelete, setShowDelete] = useState(false);

    function handleDelete() {
        router.delete(`/tpu/${tpu.id}`);
        setShowDelete(false);
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
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <Link href={`/tpu/${tpu.id}/edit`} className="btn btn-secondary btn-sm">
                            Edit TPU
                        </Link>
                        <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Stat */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '3rem' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{makam_list.length}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase',
                            letterSpacing: '0.07em', marginTop: '0.2rem' }}>Total Makam</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                            {tpu.sisa_lahan_m2 ? `${tpu.sisa_lahan_m2} m²` : '—'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase',
                            letterSpacing: '0.07em', marginTop: '0.2rem' }}>Sisa Lahan</div>
                    </div>
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
                    flowerSellers={penjual_list}
                />
            </div>

            {/* Penjual Bunga list */}
            <div className="fade-in stagger-2" style={{ marginTop: '2rem' }}>
                <div className="section-header" style={{ marginBottom: '0.875rem' }}>
                    <h3 className="section-title">Penjual Bunga Sekitar</h3>
                </div>

                <div className="table-wrapper">
                    {penjual_list.length === 0 ? (
                        <div className="empty-state">
                            <p>Belum ada penjual bunga yang terdaftar di sekitar TPU ini.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '48px' }}>No.</th>
                                    <th>Nama Toko</th>
                                    <th>Alamat</th>
                                    <th>No. HP</th>
                                    <th style={{ textAlign: 'right' }}>Koordinat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {penjual_list.map((pb, index) => (
                                    <tr key={pb.id}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: '28px', height: '28px',
                                                background: '#10b981', color: '#fff',
                                                borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                                            }}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>🌸 {pb.nama_toko}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>{pb.alamat || '—'}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>{pb.no_hp || '—'}</span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '0.82rem', fontFamily: 'monospace', color: '#6b7280' }}>
                                            {pb.lat?.toFixed(5) ?? ''}, {pb.lng?.toFixed(5) ?? ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showDelete && (
                <ConfirmModal
                    tpu={tpu}
                    makamCount={makam_list.length}
                    onCancel={() => setShowDelete(false)}
                    onConfirm={handleDelete}
                />
            )}
        </AdminLayout>
    );
}
