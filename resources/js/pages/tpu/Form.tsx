import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';
import TpuPolygonMap from '../../components/TpuPolygonMap';

interface Coordinate {
    lat: number;
    lng: number;
}

interface TpuData {
    id?: number;
    nama: string;
    alamat: string;
    polygon?: Coordinate[];
}

interface BlokEntry {
    key: number;
    nama: string;
    nomor: string;
}

interface Grave {
    id: number;
    nama_nisan: string;
    lat: number | null;
    lng: number | null;
}

interface Props {
    tpu: TpuData | null;
    makam_list?: Grave[];
}

let blokKeyCounter = 0;

export default function TpuForm({ tpu, makam_list = [] }: Props) {
    const isEdit = !!tpu?.id;

    const { data, setData, put, processing, errors } = useForm({
        nama:    tpu?.nama    ?? '',
        alamat:  tpu?.alamat  ?? '',
        polygon: tpu?.polygon ?? [] as Coordinate[],
    });

    const [blokRows, setBlokRows] = useState<BlokEntry[]>([]);
    const [submitting, setSubmitting] = useState(false);

    function addBlokRow() {
        setBlokRows(prev => [...prev, { key: ++blokKeyCounter, nama: '', nomor: '' }]);
    }

    function removeBlokRow(key: number) {
        setBlokRows(prev => prev.filter(b => b.key !== key));
    }

    function updateBlokField(key: number, field: 'nama' | 'nomor', value: string) {
        setBlokRows(prev => prev.map(b => b.key === key ? { ...b, [field]: value } : b));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEdit) {
            // Inertia put otomatis mengirimkan seluruh field di useForm (nama, alamat, polygon)
            put(`/tpu/${tpu!.id}`);
        } else {
            const payload = {
                nama:    data.nama,
                alamat:  data.alamat,
                polygon: data.polygon,
                blok:    blokRows.map(b => ({
                    nama:  b.nama  || null,
                    nomor: b.nomor ? Number(b.nomor) : null,
                })),
            };
            setSubmitting(true);
            router.post('/tpu', payload as any, {
                onFinish: () => setSubmitting(false),
            });
        }
    }

    return (
        <AdminLayout title={isEdit ? 'Edit TPU' : 'Tambah TPU'}>
            <Head title={`${isEdit ? 'Edit' : 'Tambah'} TPU — GoNgelayat`} />

            <div style={{ maxWidth: '640px' }}>
                <div className="section-header fade-in">
                    <h2 className="section-title">
                        {isEdit ? `Edit TPU: ${tpu!.nama}` : 'Tambah TPU Baru'}
                    </h2>
                    <Link href="/tpu" className="btn btn-secondary btn-sm">← Kembali</Link>
                </div>

                <form onSubmit={handleSubmit} noValidate>

                    {/* ── Info TPU ── */}
                    <div className="card fade-in stagger-1" style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem',
                            paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                            Informasi TPU
                        </div>

                        <div className="form-group">
                            <label htmlFor="tpu-nama" className="form-label">
                                Nama TPU <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                id="tpu-nama"
                                type="text"
                                className={`form-input ${errors.nama ? 'error' : ''}`}
                                value={data.nama}
                                onChange={e => setData('nama', e.target.value)}
                                placeholder="cth. TPU Umum Karet"
                                maxLength={64}
                            />
                            {errors.nama && <span className="form-error">{errors.nama}</span>}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label htmlFor="tpu-alamat" className="form-label">Alamat</label>
                            <textarea
                                id="tpu-alamat"
                                className={`form-input ${errors.alamat ? 'error' : ''}`}
                                value={data.alamat}
                                onChange={e => setData('alamat', e.target.value)}
                                placeholder="Alamat lengkap TPU..."
                                rows={3}
                                maxLength={1000}
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />
                            {errors.alamat && <span className="form-error">{errors.alamat}</span>}
                        </div>
                    </div>

                    {/* ── Area TPU (Geometri Spasial) ── */}
                    <div className="card fade-in stagger-2" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '0.875rem', paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Area Batas TPU <span style={{ color: '#dc2626' }}>*</span></div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                                    Gambar area TPU dengan polygon tool di kanan atas peta. Minimal 3 simpul.
                                </div>
                            </div>
                            {data.polygon.length > 0 && (
                                <button type="button"
                                    onClick={() => setData('polygon', [])}
                                    style={{ background: 'none', border: '1px solid #e5e7eb',
                                        borderRadius: '6px', padding: '0.25rem 0.5rem',
                                        fontSize: '0.72rem', color: '#6b7280', cursor: 'pointer' }}>
                                    Hapus Area
                                </button>
                            )}
                        </div>

                        {errors.polygon && <div className="alert-error" style={{ marginBottom: '0.75rem' }}>{errors.polygon}</div>}

                        <TpuPolygonMap
                            initialPolygon={data.polygon}
                            onPolygonChange={(polygonCoords) => setData('polygon', polygonCoords)}
                            graves={makam_list}
                        />
                    </div>

                    {/* ── Blok (hanya saat create) ── */}
                    {!isEdit && (
                        <div className="card fade-in stagger-2" style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: blokRows.length > 0 ? '1rem' : 0,
                                paddingBottom: blokRows.length > 0 ? '0.625rem' : 0,
                                borderBottom: blokRows.length > 0 ? '1px solid #f0f0f0' : 'none',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Blok dalam TPU ini</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                                        Opsional — bisa ditambahkan setelah TPU dibuat
                                    </div>
                                </div>
                                <button type="button" className="btn btn-secondary btn-sm"
                                    onClick={addBlokRow} id="btn-tambah-blok-form">
                                    + Tambah Blok
                                </button>
                            </div>

                            {blokRows.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '1.25rem',
                                    border: '2px dashed #e5e7eb', borderRadius: '0.625rem',
                                    fontSize: '0.82rem', color: '#9ca3af',
                                }}>
                                    Belum ada blok. Klik <strong>+ Tambah Blok</strong> untuk menambahkan.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {blokRows.map((b, i) => (
                                        <div key={b.key} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                                            padding: '0.5rem 0.75rem',
                                            background: '#f9f9f9', borderRadius: '0.5rem',
                                            border: '1px solid #f0f0f0',
                                        }}>
                                            {/* Nomor urut */}
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px', height: '24px', flexShrink: 0,
                                                background: '#0a0a0a', color: '#fff',
                                                borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                                            }}>
                                                {i + 1}
                                            </span>

                                            {/* Nama blok */}
                                            <input
                                                id={`blok-${b.key}-nama`}
                                                type="text"
                                                className="form-input"
                                                value={b.nama}
                                                onChange={e => updateBlokField(b.key, 'nama', e.target.value)}
                                                placeholder="Nama blok (cth. Blok A)"
                                                maxLength={64}
                                                style={{ flex: 1, fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                            />

                                            {/* Nomor blok */}
                                            <input
                                                id={`blok-${b.key}-nomor`}
                                                type="number"
                                                className="form-input"
                                                value={b.nomor}
                                                onChange={e => updateBlokField(b.key, 'nomor', e.target.value)}
                                                placeholder="No."
                                                min={1}
                                                style={{ width: '70px', fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                            />

                                            {/* Hapus */}
                                            <button
                                                type="button"
                                                onClick={() => removeBlokRow(b.key)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: '0.25rem', color: '#9ca3af', flexShrink: 0 }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                                                aria-label="Hapus blok"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right', marginTop: '0.1rem' }}>
                                        {blokRows.length} blok akan dibuat
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="fade-in stagger-3" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button id="btn-simpan-tpu" type="submit" className="btn btn-primary"
                            disabled={processing || submitting}>
                            {(processing || submitting) ? (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2"
                                        style={{ animation: 'spin 0.8s linear infinite' }}>
                                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : isEdit
                                ? 'Perbarui TPU'
                                : `Simpan TPU${blokRows.length > 0 ? ` + ${blokRows.length} Blok` : ''}`
                            }
                        </button>
                        <Link href="/tpu" className="btn btn-secondary">Batal</Link>
                    </div>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AdminLayout>
    );
}
