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
    sisa_lahan_m2?: number | string | null;
    polygon?: Coordinate[];
}

interface Grave {
    id: number;
    nama_nisan: string;
    lat: number | null;
    lng: number | null;
}

interface FlowerSeller {
    id?: number;
    nama_toko: string;
    alamat?: string | null;
    no_hp?: string | null;
    lat: number | null;
    lng: number | null;
    key?: number;
}

interface Props {
    tpu: TpuData | null;
    makam_list?: Grave[];
    penjual_list?: FlowerSeller[];
}

let sellerKeyCounter = 0;

export default function TpuForm({ tpu, makam_list = [], penjual_list = [] }: Props) {
    const isEdit = !!tpu?.id;

    const initialSellers = (penjual_list ?? []).map(p => ({
        ...p,
        key: p.id ? p.id : ++sellerKeyCounter
    }));

    const { data, setData, put, processing, errors } = useForm({
        nama: tpu?.nama ?? '',
        alamat: tpu?.alamat ?? '',
        sisa_lahan_m2: tpu?.sisa_lahan_m2 ?? '',
        polygon: tpu?.polygon ?? [] as Coordinate[],
        penjual_bunga: initialSellers as FlowerSeller[],
    });

    const [submitting, setSubmitting] = useState(false);
    const [pinningSellerIndex, setPinningSellerIndex] = useState<number | null>(null);

    function addFlowerSeller() {
        const newSeller: FlowerSeller = {
            key: ++sellerKeyCounter,
            nama_toko: '',
            alamat: '',
            no_hp: '',
            lat: null,
            lng: null,
        };
        setData('penjual_bunga', [...data.penjual_bunga, newSeller]);
    }

    function removeFlowerSeller(index: number) {
        if (pinningSellerIndex === index) {
            setPinningSellerIndex(null);
        }
        const updated = data.penjual_bunga.filter((_, idx) => idx !== index);
        setData('penjual_bunga', updated);
    }

    function updateSellerField(index: number, field: keyof FlowerSeller, value: any) {
        const updated = data.penjual_bunga.map((pb, idx) => 
            idx === index ? { ...pb, [field]: value } : pb
        );
        setData('penjual_bunga', updated);
    }

    function handleMapClick(lat: number, lng: number) {
        if (pinningSellerIndex !== null) {
            const updated = data.penjual_bunga.map((pb, idx) => 
                idx === pinningSellerIndex ? { ...pb, lat, lng } : pb
            );
            setData('penjual_bunga', updated);
            setPinningSellerIndex(null);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Bersihkan data penjual bunga: filter yang koordinatnya lengkap
        const validSellers = data.penjual_bunga.filter(pb => pb.lat !== null && pb.lng !== null);

        if (isEdit) {
            // Kita pass data penjual_bunga yang valid saja ke payload update
            const payload = {
                nama:          data.nama,
                alamat:        data.alamat,
                sisa_lahan_m2: data.sisa_lahan_m2,
                polygon:       data.polygon,
                penjual_bunga: validSellers,
            };
            setSubmitting(true);
            router.put(`/tpu/${tpu!.id}`, payload as any, {
                onFinish: () => setSubmitting(false),
            });
        } else {
            const payload = {
                nama:          data.nama,
                alamat:        data.alamat,
                sisa_lahan_m2: data.sisa_lahan_m2,
                polygon:       data.polygon,
                penjual_bunga: validSellers,
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

            <div style={{ maxWidth: '100%' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div>
                                <label className="form-label">
                                    Nama TPU <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.nama ? 'border-red-500' : ''}`}
                                    value={data.nama}
                                    onChange={e => setData('nama', e.target.value)}
                                    placeholder="Contoh: TPU Jeruk Purut"
                                />
                                {errors.nama && <span className="form-error">{errors.nama}</span>}
                            </div>
                            <div>
                                <label className="form-label">
                                    Sisa Lahan (m²)
                                </label>
                                <input
                                    type="number"
                                    className={`form-input ${errors.sisa_lahan_m2 ? 'border-red-500' : ''}`}
                                    value={data.sisa_lahan_m2 || ''}
                                    onChange={e => setData('sisa_lahan_m2', e.target.value)}
                                    placeholder="Contoh: 1500"
                                    min="0"
                                    step="any"
                                />
                                {errors.sisa_lahan_m2 && <span className="form-error">{errors.sisa_lahan_m2}</span>}
                            </div>
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

                        {pinningSellerIndex !== null && (
                            <div style={{
                                marginBottom: '0.75rem',
                                padding: '0.625rem 0.875rem',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '0.5rem',
                                color: '#1e40af',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 500
                            }}>
                                <span>
                                    Mode Pin: Klik pada peta di bawah untuk meletakkan lokasi toko <strong>{data.penjual_bunga[pinningSellerIndex]?.nama_toko || `Penjual Bunga #${pinningSellerIndex + 1}`}</strong>.
                                </span>
                            </div>
                        )}

                        <TpuPolygonMap
                            initialPolygon={data.polygon}
                            onPolygonChange={(polygonCoords) => setData('polygon', polygonCoords)}
                            graves={makam_list}
                            flowerSellers={data.penjual_bunga}
                            onFlowerSellersChange={(updated) => setData('penjual_bunga', updated)}
                            onMapClick={handleMapClick}
                        />
                    </div>

                    {/* ── Penjual Bunga di Sekitar TPU ── */}
                    <div className="card fade-in stagger-2" style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: data.penjual_bunga.length > 0 ? '1rem' : 0,
                            paddingBottom: data.penjual_bunga.length > 0 ? '0.625rem' : 0,
                            borderBottom: data.penjual_bunga.length > 0 ? '1px solid #f0f0f0' : 'none',
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Penjual Bunga Sekitar TPU</div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                                    Letakkan pin toko bunga di dekat TPU pada peta.
                                </div>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm"
                                onClick={addFlowerSeller} id="btn-tambah-penjual-form">
                                + Tambah Penjual
                            </button>
                        </div>

                        {data.penjual_bunga.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '1.25rem',
                                border: '2px dashed #e5e7eb', borderRadius: '0.625rem',
                                fontSize: '0.82rem', color: '#9ca3af',
                            }}>
                                Belum ada penjual bunga. Klik <strong>+ Tambah Penjual</strong> untuk menambahkan.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {data.penjual_bunga.map((pb, i) => (
                                    <div key={pb.key} style={{
                                        display: 'flex', flexDirection: 'column', gap: '0.625rem',
                                        padding: '0.75rem 1rem',
                                        background: '#f9f9f9', borderRadius: '0.5rem',
                                        border: '1px solid #f0f0f0',
                                        position: 'relative'
                                    }}>
                                        {/* Header Baris */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px', height: '24px',
                                                background: '#0a0a0a', color: '#fff',
                                                borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                                            }}>
                                                {i + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFlowerSeller(i)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: '0.25rem', color: '#9ca3af' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                                                aria-label="Hapus penjual bunga"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Form fields */}
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '150px' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={pb.nama_toko}
                                                    onChange={e => updateSellerField(i, 'nama_toko', e.target.value)}
                                                    placeholder="Nama Toko Bunga"
                                                    maxLength={100}
                                                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                                />
                                                {errors[`penjual_bunga.${i}.nama_toko` as any] && (
                                                    <span className="form-error" style={{ display: 'block', marginTop: '0.25rem' }}>
                                                        {errors[`penjual_bunga.${i}.nama_toko` as any]}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ width: '130px' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={pb.no_hp ?? ''}
                                                    onChange={e => updateSellerField(i, 'no_hp', e.target.value)}
                                                    placeholder="No. HP"
                                                    maxLength={20}
                                                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={pb.alamat ?? ''}
                                                onChange={e => updateSellerField(i, 'alamat', e.target.value)}
                                                placeholder="Alamat Toko Bunga"
                                                maxLength={1000}
                                                style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                            />
                                        </div>

                                        {/* Koordinat */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                            <div style={{ fontSize: '0.72rem', color: pb.lat && pb.lng ? '#16a34a' : '#ef4444', fontWeight: 500 }}>
                                                {pb.lat && pb.lng 
                                                    ? `Lat: ${pb.lat.toFixed(6)}, Lng: ${pb.lng.toFixed(6)}` 
                                                    : ' Lokasi belum ditentukan di peta'
                                                }
                                            </div>
                                            <button
                                                type="button"
                                                className={`btn ${pinningSellerIndex === i ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                                onClick={() => setPinningSellerIndex(pinningSellerIndex === i ? null : i)}
                                                style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                {pinningSellerIndex === i ? 'Menunggu Klik...' : 'Pilih di Peta'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                                : 'Simpan TPU'
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
