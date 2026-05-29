import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

// ── Types ──────────────────────────────────────────────────────
interface Coordinate {
    lat: number;
    lng: number;
}

interface TpuItem  {
    id: number;
    nama: string;
    alamat: string | null;
    polygon?: {
        type: string;
        coordinates: number[][][];
    } | null;
}
interface BlokItem { id: number; label: string; tpu_id: number; tpu_nama: string | null; }

interface MakamData {
    id?: number;
    nama_nisan: string;
    blok_tpu_id: number | null;
    tpu_id?: number | null;
    tanggal_lahir: string;
    tanggal_wafat: string;
    keterangan: string;
    gambar: string | null;
    lat: number | null;
    lng: number | null;
}

interface Props { makam: MakamData | null; tpu_list: TpuItem[]; blok_list: BlokItem[]; }

// Default center: Indonesia
const DEFAULT_CENTER: [number, number] = [-6.2, 106.816]; // Jakarta

// ── Location Picker Map ─────────────────────────────────────────
function LocationPicker({
    lat, lng, onChange, tpuPolygon = [],
}: {
    lat: number | null; lng: number | null;
    onChange: (lat: number, lng: number) => void;
    tpuPolygon?: Coordinate[];
}) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const polygonLayerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Dynamic import agar tidak SSR crash
        import('leaflet').then(L => {
            // Fix default icon path
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const center: [number, number] = lat && lng ? [lat, lng] : DEFAULT_CENTER;
            const map = L.map(mapRef.current!, { zoomControl: true }).setView(center, lat && lng ? 18 : 12);
            leafletMap.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            // Render TPU polygon awal jika ada
            if (tpuPolygon && tpuPolygon.length > 0) {
                const latlngs = tpuPolygon.map((p) => [p.lat, p.lng] as [number, number]);
                const polygonLayer = L.polygon(latlngs, {
                    color: '#0a0a0a',
                    weight: 3,
                    fillColor: '#0a0a0a',
                    fillOpacity: 0.15,
                }).addTo(map);
                polygonLayerRef.current = polygonLayer;

                // Jika belum ada titik makam, fokuskan peta langsung pada batas TPU
                if (!lat || !lng) {
                    map.fitBounds(polygonLayer.getBounds(), { padding: [40, 40] });
                }
            }

            // Pasang marker jika sudah ada koordinat
            if (lat && lng) {
                const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                markerRef.current = marker;
                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    onChange(pos.lat, pos.lng);
                });
            }

            // Klik peta = set/pindah marker
            map.on('click', (e: any) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng]);
                } else {
                    const m = L.marker([clickLat, clickLng], { draggable: true }).addTo(map);
                    markerRef.current = m;
                    m.on('dragend', () => {
                        const pos = m.getLatLng();
                        onChange(pos.lat, pos.lng);
                    });
                }
                onChange(clickLat, clickLng);
            });

            // Pastikan peta ter-render sempurna
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        });

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
            markerRef.current = null;
            polygonLayerRef.current = null;
        };
    }, []);

    // Pindahkan marker jika lat/lng berubah dari luar (misal: reset)
    useEffect(() => {
        if (!leafletMap.current) return;
        import('leaflet').then(L => {
            if (lat && lng) {
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    const m = L.marker([lat, lng], { draggable: true }).addTo(leafletMap.current);
                    markerRef.current = m;
                    m.on('dragend', () => {
                        const pos = m.getLatLng();
                        onChange(pos.lat, pos.lng);
                    });
                }
                leafletMap.current.setView([lat, lng], 18);
            } else if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        });
    }, [lat, lng]);

    // Sinkronisasi render area polygon batas TPU ketika user mengganti pilihan TPU di dropdown
    useEffect(() => {
        if (!leafletMap.current) return;

        import('leaflet').then(L => {
            const map = leafletMap.current;

            // Hapus polygon sebelumnya jika ada
            if (polygonLayerRef.current) {
                map.removeLayer(polygonLayerRef.current);
                polygonLayerRef.current = null;
            }

            // Gambar polygon TPU baru jika datanya ada
            if (tpuPolygon && tpuPolygon.length > 0) {
                const latlngs = tpuPolygon.map((p) => [p.lat, p.lng] as [number, number]);
                const polygonLayer = L.polygon(latlngs, {
                    color: '#0a0a0a',
                    weight: 3,
                    fillColor: '#0a0a0a',
                    fillOpacity: 0.15,
                }).addTo(map);
                polygonLayerRef.current = polygonLayer;

                // Geser dan fokuskan peta pada batas area TPU terpilih secara presisi
                map.fitBounds(polygonLayer.getBounds(), { padding: [40, 40] });
            }

            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        });
    }, [tpuPolygon]);

    return (
        <div style={{ position: 'relative' }}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <div
                ref={mapRef}
                style={{ width: '100%', height: '320px', borderRadius: '0.625rem',
                    border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 1 }}
            />
            <div style={{
                position: 'absolute', bottom: '0.5rem', left: '0.5rem', zIndex: 1000,
                background: 'rgba(255,255,255,0.92)', borderRadius: '6px',
                padding: '0.3rem 0.6rem', fontSize: '0.72rem', color: '#374151',
                border: '1px solid #e5e7eb',
                backdropFilter: 'blur(4px)',
            }}>
                {lat && lng
                    ? `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                    : '🖱 Klik peta untuk menandai lokasi makam'}
            </div>
        </div>
    );
}

// ── Component ──────────────────────────────────────────────────
export default function MakamForm({ makam, tpu_list, blok_list }: Props) {
    const isEdit = !!makam?.id;
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(
        makam?.gambar ? `/storage/${makam.gambar}` : null
    );

    // State untuk TPU yang dipilih (step 1)
    const [selectedTpuId, setSelectedTpuId] = useState<number | null>(
        makam?.tpu_id ?? null
    );

    const selectedTpu = selectedTpuId
        ? tpu_list.find(t => t.id === selectedTpuId)
        : null;

    const tpuPolygonCoords = React.useMemo(() => {
        if (!selectedTpu || !selectedTpu.polygon || !selectedTpu.polygon.coordinates || !selectedTpu.polygon.coordinates[0]) {
            return [];
        }
        const coords = selectedTpu.polygon.coordinates[0].map(pt => ({
            lat: pt[1],
            lng: pt[0]
        }));
        if (coords.length > 1 && 
            coords[0].lat === coords[coords.length - 1].lat && 
            coords[0].lng === coords[coords.length - 1].lng) {
            coords.pop();
        }
        return coords;
    }, [selectedTpu]);

    // Blok yang difilter berdasarkan TPU terpilih
    const filteredBlok = selectedTpuId
        ? blok_list.filter(b => b.tpu_id === selectedTpuId)
        : [];

    const { data, setData, post, processing, errors } = useForm<{
        nama_nisan: string;
        blok_tpu_id: number | null;
        tanggal_lahir: string;
        tanggal_wafat: string;
        keterangan: string;
        gambar: File | null;
        lat: number | null;
        lng: number | null;
        _method: string;
    }>({
        nama_nisan:    makam?.nama_nisan    ?? '',
        blok_tpu_id:   makam?.blok_tpu_id  ?? null,
        tanggal_lahir: makam?.tanggal_lahir ?? '',
        tanggal_wafat: makam?.tanggal_wafat ?? '',
        keterangan:    makam?.keterangan    ?? '',
        gambar:        null,
        lat:           makam?.lat           ?? null,
        lng:           makam?.lng           ?? null,
        _method:       isEdit ? 'PUT' : 'POST',
    });

    // Saat TPU berubah, reset pilihan blok
    function handleTpuChange(tpuId: number | null) {
        setSelectedTpuId(tpuId);
        setData('blok_tpu_id', null);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('gambar', file);
        if (file) setPreview(URL.createObjectURL(file));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const url = isEdit ? `/makam/${makam!.id}` : '/makam';
        post(url, { forceFormData: true });
    }

    return (
        <AdminLayout title={isEdit ? 'Edit Makam' : 'Tambah Makam'}>
            <Head title={`${isEdit ? 'Edit' : 'Tambah'} Makam — GoNgelayat`} />

            <div style={{ maxWidth: '680px' }}>
                <div className="section-header fade-in">
                    <h2 className="section-title">
                        {isEdit ? 'Edit Data Makam' : 'Tambah Data Makam Baru'}
                    </h2>
                    <Link href="/makam" className="btn btn-secondary btn-sm">← Kembali</Link>
                </div>

                <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>

                    {/* ── Identitas ── */}
                    <div className="card fade-in stagger-1" style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem',
                            paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                            Identitas
                        </div>

                        <div className="form-group">
                            <label htmlFor="makam-nama" className="form-label">Nama Nisan</label>
                            <input id="makam-nama" type="text"
                                className={`form-input ${errors.nama_nisan ? 'error' : ''}`}
                                value={data.nama_nisan}
                                onChange={e => setData('nama_nisan', e.target.value)}
                                placeholder="cth. Bapak Ahmad bin Hasan"
                                maxLength={64} />
                            {errors.nama_nisan && <span className="form-error">{errors.nama_nisan}</span>}
                        </div>

                        {/* ── Step 1: Pilih TPU ── */}
                        <div className="form-group">
                            <label htmlFor="makam-tpu" className="form-label">
                                TPU
                                <span style={{ color: '#ef4444', marginLeft: '0.15rem' }}>*</span>
                            </label>
                            {tpu_list.length === 0 ? (
                                <div style={{ fontSize: '0.82rem', color: '#ef4444', padding: '0.6rem',
                                    background: '#fee2e2', borderRadius: '0.5rem' }}>
                                    Belum ada data TPU. Superadmin perlu menambahkan TPU terlebih dahulu.
                                </div>
                            ) : (
                                <select id="makam-tpu"
                                    className="form-input"
                                    value={selectedTpuId ?? ''}
                                    onChange={e => handleTpuChange(e.target.value ? Number(e.target.value) : null)}>
                                    <option value="">— Pilih TPU —</option>
                                    {tpu_list.map(t => (
                                        <option key={t.id} value={t.id}>{t.nama}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* ── Step 2: Pilih Blok (muncul setelah TPU dipilih) ── */}
                        <div className="form-group" style={{
                            overflow: 'hidden',
                            maxHeight: selectedTpuId ? '120px' : '0px',
                            opacity: selectedTpuId ? 1 : 0,
                            transition: 'max-height 0.3s ease, opacity 0.25s ease',
                            marginBottom: selectedTpuId ? undefined : 0,
                        }}>
                            <label htmlFor="makam-blok" className="form-label">Blok TPU</label>
                            {filteredBlok.length === 0 ? (
                                <div style={{ fontSize: '0.82rem', color: '#f59e0b', padding: '0.6rem',
                                    background: '#fef3c7', borderRadius: '0.5rem' }}>
                                    TPU ini belum memiliki blok. Tambahkan blok terlebih dahulu.
                                </div>
                            ) : (
                                <select id="makam-blok"
                                    className={`form-input ${errors.blok_tpu_id ? 'error' : ''}`}
                                    value={data.blok_tpu_id ?? ''}
                                    onChange={e => setData('blok_tpu_id', e.target.value ? Number(e.target.value) : null)}>
                                    <option value="">— Pilih Blok —</option>
                                    {filteredBlok.map(b => (
                                        <option key={b.id} value={b.id}>{b.label}</option>
                                    ))}
                                </select>
                            )}
                            {errors.blok_tpu_id && <span className="form-error">{errors.blok_tpu_id}</span>}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label htmlFor="makam-keterangan" className="form-label">Keterangan</label>
                            <textarea id="makam-keterangan"
                                className={`form-input ${errors.keterangan ? 'error' : ''}`}
                                value={data.keterangan}
                                onChange={e => setData('keterangan', e.target.value)}
                                placeholder="Catatan tambahan..."
                                rows={3} maxLength={1000}
                                style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                            {errors.keterangan && <span className="form-error">{errors.keterangan}</span>}
                        </div>
                    </div>

                    {/* ── Tanggal ── */}
                    <div className="card fade-in stagger-2" style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem',
                            paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                            Tanggal
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="makam-lahir" className="form-label">Tanggal Lahir</label>
                                <input id="makam-lahir" type="date"
                                    className={`form-input ${errors.tanggal_lahir ? 'error' : ''}`}
                                    value={data.tanggal_lahir}
                                    onChange={e => setData('tanggal_lahir', e.target.value)} />
                                {errors.tanggal_lahir && <span className="form-error">{errors.tanggal_lahir}</span>}
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="makam-wafat" className="form-label">Tanggal Wafat</label>
                                <input id="makam-wafat" type="date"
                                    className={`form-input ${errors.tanggal_wafat ? 'error' : ''}`}
                                    value={data.tanggal_wafat}
                                    onChange={e => setData('tanggal_wafat', e.target.value)}
                                    min={data.tanggal_lahir || undefined} />
                                {errors.tanggal_wafat && <span className="form-error">{errors.tanggal_wafat}</span>}
                            </div>
                        </div>
                        {data.tanggal_lahir && data.tanggal_wafat && (
                            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                                background: '#f5f5f5', borderRadius: '0.5rem',
                                fontSize: '0.8rem', color: '#374151' }}>
                                Umur:{' '}
                                <strong>
                                    {new Date(data.tanggal_wafat).getFullYear() -
                                     new Date(data.tanggal_lahir).getFullYear()} tahun
                                </strong>
                            </div>
                        )}
                    </div>

                    {/* ── Titik Lokasi di Peta ── */}
                    <div className="card fade-in stagger-3" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '0.875rem', paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Lokasi Makam (Opsional)</div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                                    Klik peta atau seret marker untuk menandai posisi tepat makam
                                </div>
                            </div>
                            {(data.lat || data.lng) && (
                                <button type="button"
                                    onClick={() => { setData('lat', null); setData('lng', null); }}
                                    style={{ background: 'none', border: '1px solid #e5e7eb',
                                        borderRadius: '6px', padding: '0.25rem 0.5rem',
                                        fontSize: '0.72rem', color: '#6b7280', cursor: 'pointer' }}>
                                    Hapus Titik
                                </button>
                            )}
                        </div>

                        <LocationPicker
                            lat={data.lat}
                            lng={data.lng}
                            onChange={(lat, lng) => { setData('lat', lat); setData('lng', lng); }}
                            tpuPolygon={tpuPolygonCoords}
                        />

                        {/* Input manual koordinat */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.625rem' }}>
                            <div>
                                <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>
                                    Latitude
                                </label>
                                <input type="number" step="any"
                                    className="form-input"
                                    value={data.lat ?? ''}
                                    onChange={e => setData('lat', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="-6.200000"
                                    style={{ fontSize: '0.82rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>
                                    Longitude
                                </label>
                                <input type="number" step="any"
                                    className="form-input"
                                    value={data.lng ?? ''}
                                    onChange={e => setData('lng', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="106.816000"
                                    style={{ fontSize: '0.82rem' }} />
                            </div>
                        </div>
                    </div>

                    {/* ── Foto ── */}
                    <div className="card fade-in stagger-4" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem',
                            paddingBottom: '0.625rem', borderBottom: '1px solid #f0f0f0' }}>
                            Foto Nisan
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div onClick={() => fileRef.current?.click()}
                                style={{ width: '100px', height: '100px', flexShrink: 0,
                                    border: '2px dashed #e5e7eb', borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden',
                                    background: preview ? 'transparent' : '#fafafa' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0a0a0a')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                                {preview ? (
                                    <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <input ref={fileRef} id="makam-gambar" type="file"
                                    accept="image/jpg,image/jpeg,image/png,image/webp"
                                    style={{ display: 'none' }} onChange={handleFileChange} />
                                <button type="button" className="btn btn-secondary btn-sm"
                                    onClick={() => fileRef.current?.click()} id="btn-pilih-foto">
                                    {preview ? 'Ganti Foto' : 'Pilih Foto'}
                                </button>
                                {preview && (
                                    <button type="button" className="btn btn-danger btn-sm"
                                        style={{ marginLeft: '0.4rem' }}
                                        onClick={() => { setPreview(null); setData('gambar', null); if (fileRef.current) fileRef.current.value = ''; }}>
                                        Hapus
                                    </button>
                                )}
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.5rem 0 0' }}>
                                    JPG, PNG, atau WebP. Maks 2 MB.
                                </p>
                                {errors.gambar && <span className="form-error">{errors.gambar}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="fade-in stagger-5" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button id="btn-simpan-makam" type="submit" className="btn btn-primary" disabled={processing}>
                            {processing ? (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2"
                                        style={{ animation: 'spin 0.8s linear infinite' }}>
                                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : isEdit ? 'Perbarui Data' : 'Simpan Data'}
                        </button>
                        <Link href="/makam" className="btn btn-secondary">Batal</Link>
                    </div>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AdminLayout>
    );
}
