import React, { useState, useRef, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';

// ── Types ──────────────────────────────────────────────────────
interface MakamResult {
    id: number;
    nama_nisan: string | null;
    tanggal_lahir: string | null;
    tanggal_wafat: string | null;
    keterangan: string | null;
    gambar: string | null;
    tpu_nama: string | null;
    tpu_id?: number | null;
    lat: number | null;
    lng: number | null;
    jarak_teks?: string;
    polygon_geojson?: any;
}

interface Props {
    query: string;
    tgl_lahir: string;
    tgl_wafat: string;
    results: MakamResult[];
    total: number;
    tpu_list_all?: Array<{ id: number; nama: string }>;
}

// ── Helpers ────────────────────────────────────────────────────
function getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const pathname = window.location.pathname;
    const publicIndex = pathname.indexOf('/public');
    const basePath = publicIndex !== -1 
        ? pathname.substring(0, publicIndex + 7) + '/' 
        : '/';
    return basePath + cleanEndpoint;
}
function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

function calcAge(lahir: string | null, wafat: string | null): string | null {
    if (!lahir || !wafat) return null;
    const diff = new Date(wafat).getFullYear() - new Date(lahir).getFullYear();
    return `${diff} tahun`;
}

// ── Icons ──────────────────────────────────────────────────────
const IconSearch = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const IconCalendar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const IconPin = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
    </svg>
);

const IconFilter = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
);

const IconGrave = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 1 6 6v8H6V9a6 6 0 0 1 6-6z"/>
        <line x1="6" y1="17" x2="18" y2="17"/>
        <line x1="9" y1="21" x2="15" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <line x1="10" y1="9" x2="14" y2="9"/>
        <line x1="12" y1="7" x2="12" y2="11"/>
    </svg>
);

const IconArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
    </svg>
);

// ── Result Card ────────────────────────────────────────────────
function MakamCard({ m, index, isSelected = false, onClick }: { m: MakamResult; index: number; isSelected?: boolean; onClick?: () => void }) {
    const age = calcAge(m.tanggal_lahir, m.tanggal_wafat);

    return (
        <div 
            className={`makam-card ${isSelected ? 'makam-card--selected' : ''}`} 
            style={{ 
                animationDelay: `${index * 0.06}s`,
                borderColor: isSelected ? '#2563eb' : undefined,
                background: isSelected ? 'rgba(37, 99, 235, 0.03)' : undefined,
                cursor: onClick ? 'pointer' : undefined
            }}
            onClick={onClick}
        >
            <div className="makam-card-left">
                <div className="makam-avatar" style={{ background: isSelected ? 'rgba(37, 99, 235, 0.1)' : undefined, color: isSelected ? '#2563eb' : undefined }}>
                    <IconGrave size={22} />
                </div>
            </div>

            <div className="makam-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <h3 className="makam-name" style={{ margin: 0, color: isSelected ? '#2563eb' : undefined }}>{m.nama_nisan || '(Tanpa Nama)'}</h3>
                    {m.jarak_teks && (
                        <span className="makam-distance-badge" style={{ background: isSelected ? 'rgba(37, 99, 235, 0.15)' : undefined }}>
                            {m.jarak_teks}
                        </span>
                    )}
                </div>

                <div className="makam-meta">
                    {(m.tanggal_lahir || m.tanggal_wafat) && (
                        <span className="makam-meta-item">
                            <IconCalendar />
                            {m.tanggal_lahir ? formatDate(m.tanggal_lahir) : '?'}
                            &nbsp;–&nbsp;
                            {m.tanggal_wafat ? formatDate(m.tanggal_wafat) : '?'}
                            {age && <span className="makam-age">{age}</span>}
                        </span>
                    )}

                    {m.tpu_nama && (
                        <span className="makam-meta-item">
                            <IconPin />
                            {m.tpu_nama}
                        </span>
                    )}
                </div>

                {m.keterangan && (
                    <p className="makam-keterangan">{m.keterangan}</p>
                )}
                {isSelected && m.gambar && (
                    <div className="makam-gambar-wrapper" style={{ marginTop: '0.8rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <img src={m.gambar} alt={`Foto Makam ${m.nama_nisan || ''}`} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', maxHeight: '250px' }} />
                    </div>
                )}
            </div>

            <div className="makam-card-arrow" style={{ color: isSelected ? '#2563eb' : undefined, transform: isSelected ? 'translateX(4px)' : undefined }}>
                <IconArrow />
            </div>
        </div>
    );
}

// ── Map View ───────────────────────────────────────────────────
// ── Map View ───────────────────────────────────────────────────
interface MapViewProps {
    results: MakamResult[];
    userCoords: { lat: number; lng: number } | null;
    selectedTpuId?: number | null;
    spatialMode?: boolean;
    tpuGeom?: any;
    makamInside?: any[];
    flowerShops?: any[];
    bufferGrave?: { lat: number; lng: number } | null;
}

function MapView({
    results,
    userCoords,
    selectedTpuId,
    spatialMode = false,
    tpuGeom = null,
    makamInside = [],
    flowerShops = [],
    bufferGrave = null
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        let center: [number, number] = [-8.1866, 113.7214]; // Sumbersari

        if (userCoords) {
            center = [userCoords.lat, userCoords.lng];
        } else if (bufferGrave) {
            center = [bufferGrave.lat, bufferGrave.lng];
        } else if (results.length > 0 && results[0].lat && results[0].lng) {
            center = [results[0].lat!, results[0].lng!];
        }

        import('leaflet').then(L => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const areaBounds = L.latLngBounds(
                [-8.2174, 113.6836], // SouthWest (Kranjingan max selatan, Kranjingan min barat)
                [-8.1348, 113.7599]  // NorthEast (Antirogo min utara, Antirogo max timur)
            );

            const map = L.map(mapRef.current!, { 
                zoomControl: true,
                maxBounds: areaBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 13,
            }).setView(center, spatialMode ? 17 : 12);
            leafletMap.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            // Tampilkan Batas Kecamatan Sumbersari
            fetch(getApiUrl('/data/sumbersari.geojson'))
                .then(res => res.json())
                .then(data => {
                    L.geoJSON(data, {
                        style: {
                            color: '#3b82f6',
                            weight: 2.5,
                            opacity: 0.8,
                            fillOpacity: 0.03,
                            dashArray: '5, 5'
                        },
                        interactive: false
                    }).addTo(map);
                }).catch(e => console.warn('Boundary error:', e));

            const drawStraightLineFallback = (leafletL: any, user: { lat: number; lng: number }, target: { lat: number; lng: number; jarak_teks?: string }) => {
                if ((map as any)._routeLine) {
                    (map as any)._routeLine.remove();
                }

                const fallbackLine = leafletL.polyline(
                    [[user.lat, user.lng], [target.lat, target.lng]],
                    {
                        color: '#ef4444',
                        weight: 3.5,
                        dashArray: '8, 12',
                        lineCap: 'round',
                        lineJoin: 'round',
                        className: 'animated-polyline'
                    }
                ).addTo(map);

                fallbackLine.bindPopup(`
                    <div style="font-family: inherit; font-size: 0.8rem; padding: 4px; text-align: center; min-width: 140px;">
                        <div style="font-weight: 700; color: #ef4444; margin-bottom: 2px;">🧭 Rute Udara (Garis Lurus)</div>
                        ${target.jarak_teks ? `<div>Jarak: <strong>${target.jarak_teks}</strong></div>` : ''}
                        <div style="font-size:0.7rem;color:#9ca3af;margin-top:2px">OSRM Routing API Offline</div>
                    </div>
                `);

                (map as any)._routeLine = fallbackLine;
                map.fitBounds(fallbackLine.getBounds(), { padding: [80, 80] });
                
                setTimeout(() => {
                    fallbackLine.openPopup();
                }, 400);
            };

            const drawRoute = (startLat: number, startLng: number, endLat: number, endLng: number) => {
                const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
                
                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                            const route = data.routes[0];
                            const roadCoords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
                            const roadDistance = route.distance;
                            const roadDuration = route.duration;
                            
                            const distanceText = roadDistance >= 1000 
                                ? (roadDistance / 1000).toFixed(2) + ' km'
                                : Math.round(roadDistance) + ' m';
                            const durationText = Math.round(roadDuration / 60) + ' menit';
                            
                            if ((map as any)._routeLine) {
                                (map as any)._routeLine.remove();
                            }

                            const routingLine = L.polyline(roadCoords, {
                                color: '#2563eb',
                                weight: 4,
                                dashArray: '8, 12',
                                lineCap: 'round',
                                lineJoin: 'round',
                                className: 'animated-polyline'
                            }).addTo(map);

                            routingLine.bindPopup(`
                                <div style="font-family: inherit; font-size: 0.8rem; padding: 4px; text-align: center; min-width: 160px;">
                                    <div style="font-weight: 700; color: #2563eb; margin-bottom: 4px;">🧭 Navigasi Rute Jalan</div>
                                    <div style="margin-bottom: 2px;">Jarak Tempuh: <strong>${distanceText}</strong></div>
                                    <div>Waktu Berkendara: <strong>${durationText}</strong></div>
                                </div>
                            `);

                            (map as any)._routeLine = routingLine;
                            const routeBounds = routingLine.getBounds();
                            map.fitBounds(routeBounds, { padding: [60, 60], animate: true, duration: 1.2 });
                            
                            setTimeout(() => {
                                routingLine.openPopup();
                            }, 400);
                        } else {
                            drawStraightLineFallback(L, { lat: startLat, lng: startLng }, { lat: endLat, lng: endLng });
                        }
                    })
                    .catch(() => {
                        drawStraightLineFallback(L, { lat: startLat, lng: startLng }, { lat: endLat, lng: endLng });
                    });
            };

            const bounds: [number, number][] = [];

            if (!spatialMode) {
                const withCoords = results.filter(m => m.lat && m.lng);
                if (userCoords) {
                    const userIcon = L.divIcon({
                        className: 'user-location-marker',
                        html: `<div class="user-pulse"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                        popupAnchor: [0, -10]
                    });

                    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
                        .addTo(map)
                        .bindPopup('<div style="font-weight:700;font-size:0.85rem;font-family:inherit;text-align:center">Lokasi Anda Sekarang</div>');

                    bounds.push([userCoords.lat, userCoords.lng]);
                }

                withCoords.forEach(m => {
                    const lat = m.lat!;
                    const lng = m.lng!;
                    bounds.push([lat, lng]);

                    const popup = `
                        <div style="min-width:180px;font-family:inherit">
                            <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;color:#0a0a0a">
                                ${m.nama_nisan || '(Tanpa Nama)'}
                            </div>
                            ${m.tpu_nama ? `<div style="font-size:0.78rem;color:#6b7280">${m.tpu_nama}</div>` : ''}
                            ${m.tanggal_lahir || m.tanggal_wafat
                                ? `<div style="font-size:0.78rem;color:#6b7280;margin-top:2px">
                                    📅 ${m.tanggal_lahir ?? '?'} – ${m.tanggal_wafat ?? '?'}
                                   </div>`
                                : ''}
                            ${m.jarak_teks ? `<div style="font-size:0.78rem;color:#2563eb;font-weight:600;margin-top:5px;background:rgba(59,130,246,0.08);padding:3px 6px;border-radius:4px;border:1px solid rgba(59,130,246,0.12)">${m.jarak_teks} dari lokasi Anda</div>` : ''}
                        </div>`;

                    if (m.polygon_geojson) {
                        const polyLayer = L.geoJSON(m.polygon_geojson, {
                            style: {
                                color: '#2563eb',
                                weight: 2.5,
                                fillColor: '#3b82f6',
                                fillOpacity: 0.15
                            }
                        }).addTo(map);

                        polyLayer.bindPopup(popup, { maxWidth: 240 });

                        polyLayer.on('click', () => {
                            if (userCoords) {
                                const centroid = polyLayer.getBounds().getCenter();
                                drawRoute(userCoords.lat, userCoords.lng, centroid.lat, centroid.lng);
                            }
                        });

                        const polyBounds = polyLayer.getBounds();
                        bounds.push([polyBounds.getSouthWest().lat, polyBounds.getSouthWest().lng]);
                        bounds.push([polyBounds.getNorthEast().lat, polyBounds.getNorthEast().lng]);
                    } else {
                        const mMarker = L.marker([lat, lng])
                            .addTo(map)
                            .bindPopup(popup, { maxWidth: 240 });

                        mMarker.on('click', () => {
                            if (userCoords) {
                                drawRoute(userCoords.lat, userCoords.lng, lat, lng);
                            }
                        });
                    }
                });

                if (bounds.length > 1) {
                    map.fitBounds(bounds, { padding: [40, 40] });
                }
            } else {
                if (tpuGeom) {
                    const polyLayer = L.geoJSON(tpuGeom, {
                        style: {
                            color: '#2563eb',
                            weight: 3,
                            fillColor: '#3b82f6',
                            fillOpacity: 0.08
                        }
                    }).addTo(map);
                    polyLayer.bindPopup('🏢 <strong>Batas TPU (POLYGON) - Kalkulasi Luas ST_Area</strong><br/><span style="color:#2563eb;font-size:0.75rem;font-weight:600">💡 Klik area ini untuk menggambar rute navigasi dari lokasi Anda</span>');
                    
                    polyLayer.on('click', () => {
                        if (userCoords) {
                            const centroid = polyLayer.getBounds().getCenter();
                            drawRoute(userCoords.lat, userCoords.lng, centroid.lat, centroid.lng);
                        } else {
                            navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                    const centroid = polyLayer.getBounds().getCenter();
                                    drawRoute(pos.coords.latitude, pos.coords.longitude, centroid.lat, centroid.lng);
                                },
                                () => {
                                    alert('Silakan aktifkan GPS atau izinkan lokasi untuk menggambar rute navigasi.');
                                }
                            );
                        }
                    });

                    map.fitBounds(polyLayer.getBounds(), { padding: [40, 40] });
                }



                makamInside.forEach(m => {
                    if (m.lat && m.lng) {
                        const marker = L.marker([m.lat, m.lng]).addTo(map);
                        marker.bindPopup(`🪦 <strong>${m.nama_nisan || 'Tanpa Nama'}</strong><br/><span style="color:#2563eb;font-size:0.75rem">Silakan klik tombol "Cari Kios Bunga" di daftar samping untuk membuat buffer</span>`);
                    }
                });

                if (bufferGrave) {
                    L.circle([bufferGrave.lat, bufferGrave.lng], {
                        radius: 500,
                        color: '#10b981',
                        fillColor: '#10b981',
                        fillOpacity: 0.12,
                        weight: 2,
                        dashArray: '6, 8'
                    }).addTo(map);
                    map.setView([bufferGrave.lat, bufferGrave.lng], 16);
                }

                flowerShops.forEach(f => {
                    if (f.lat && f.lng) {
                        const flowerIcon = L.divIcon({
                            className: 'custom-flower-marker',
                            html: `<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🌸</div>`,
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        });
                        L.marker([f.lat, f.lng], { icon: flowerIcon })
                            .addTo(map)
                            .bindPopup(`🏪 <strong>${f.nama_toko}</strong><br/>Alamat: ${f.alamat}<br/>Jarak: <strong>${f.jarak_meter} m</strong> dari makam (ST_Distance)`)
                            .openPopup();
                    }
                });
            }
        });

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
        };
    }, [results, userCoords, selectedTpuId, spatialMode, tpuGeom, makamInside, flowerShops, bufferGrave]);

    const withCoords = results.filter(m => m.lat && m.lng);

    return (
        <div style={{ height: '100%' }}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <div ref={mapRef} style={{
                width: '100%', height: 'calc(100vh - 110px)', minHeight: '600px',
                borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden',
            }} />
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function PublicHome({ query, tgl_lahir, tgl_wafat, results, total, tpu_list_all = [] }: Props) {
    const [searchVal, setSearchVal]   = useState(query);
    const [filterLahir, setFilterLahir] = useState(tgl_lahir);
    const [filterWafat, setFilterWafat] = useState(tgl_wafat);
    const [showFilter, setShowFilter] = useState(!!(tgl_lahir || tgl_wafat));
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // States for custom GPS proximity search
    const [resultsList, setResultsList] = useState<MakamResult[]>(results);
    const [resultsTotal, setResultsTotal] = useState<number>(total);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedTpuId, setSelectedTpuId] = useState<number | null>(null);

    // ── States for Spatial Exploration Dashboard ──
    const [activeMode, setActiveMode] = useState<'search' | 'spatial'>('search');
    const [selectedExplorationTpuId, setSelectedExplorationTpuId] = useState<number | string>('');
    const [tpuDetails, setTpuDetails] = useState<any>(null);
    const [makamListInside, setMakamListInside] = useState<any[]>([]);
    const [flowerShopsNear, setFlowerShopsNear] = useState<any[]>([]);
    const [activeGraveForBuffer, setActiveGraveForBuffer] = useState<{ lat: number; lng: number; id: number; name: string } | null>(null);
    const [isFetchingSpatial, setIsFetchingSpatial] = useState(false);

    const hasFilter = query.trim().length >= 2 || tgl_lahir || tgl_wafat || userCoords !== null;
    const hasAnyInput = searchVal.trim().length >= 1 || filterLahir || filterWafat;
    const activeFilterCount = (tgl_lahir ? 1 : 0) + (tgl_wafat ? 1 : 0);

    // Sync standard search props to internal state
    useEffect(() => {
        setResultsList(results);
        setResultsTotal(total);
        setUserCoords(null);
        setLocationError(null);
        setSelectedTpuId(null);
        setTpuDetails(null);
        setMakamListInside([]);
        setFlowerShopsNear([]);
        setActiveGraveForBuffer(null);
    }, [results, total]);

    useEffect(() => {
        if (!hasFilter) {
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, []);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!hasAnyInput) return;
        setIsSearching(true);
        const params: Record<string, string> = {};
        if (searchVal.trim()) params.q = searchVal.trim();
        if (filterLahir) params.tgl_lahir = filterLahir;
        if (filterWafat) params.tgl_wafat = filterWafat;
        router.get(getApiUrl(''), params, {
            preserveState: true,
            onFinish: () => setIsSearching(false),
        });
    }

    function handleClear() {
        setSearchVal('');
        setFilterLahir('');
        setFilterWafat('');
        setShowFilter(false);
        setUserCoords(null);
        setLocationError(null);
        setSelectedTpuId(null);
        setTpuDetails(null);
        setMakamListInside([]);
        setFlowerShopsNear([]);
        setActiveGraveForBuffer(null);
        router.get(getApiUrl(''), {}, { preserveState: false });
        setTimeout(() => inputRef.current?.focus(), 100);
    }

    function handleSelectTpu(m: MakamResult) {
        setSelectedTpuId(prev => {
            const next = prev === m.id ? null : m.id;
            if (next) {
                if (m.polygon_geojson) {
                    handleTpuExplorationChange(next);
                } else {
                    setTpuDetails(null);
                    setMakamListInside([]);
                    setFlowerShopsNear([]);
                    setActiveGraveForBuffer(null);
                }
            } else {
                setTpuDetails(null);
                setMakamListInside([]);
                setFlowerShopsNear([]);
                setActiveGraveForBuffer(null);
            }
            return next;
        });
    }

    // Trigger high accuracy GPS check and search closest graves via spatial API
    function handleFindNearest() {
        setIsLocating(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError('Geolokasi tidak didukung oleh browser Anda.');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setUserCoords({ lat, lng });

                try {
                    const response = await fetch(getApiUrl(`/api/tpu/terdekat?user_lat=${lat}&user_lng=${lng}&radius_km=10`));
                    const data = await response.json();

                    if (data.status === 'success') {
                        const mapped: MakamResult[] = data.data.map((item: any) => ({
                            id: item.id,
                            nama_nisan: item.nama,
                            tanggal_lahir: null,
                            tanggal_wafat: null,
                            keterangan: item.alamat,
                            gambar: null,
                            tpu_nama: 'Batas Area TPU Spasial (Polygon)',
                            tpu_id: item.id,
                            lat: item.lat,
                            lng: item.lng,
                            jarak_teks: item.jarak_teks,
                            polygon_geojson: item.geom
                        }));
                        setResultsList(mapped);
                        setResultsTotal(data.meta.total_found);
                        setViewMode('map'); // Switch to map view to visually locate them!
                    } else {
                        setLocationError(data.message || 'Gagal mencari TPU terdekat.');
                    }
                } catch (err: any) {
                    setLocationError('Gagal menghubungi server untuk pencarian spasial.');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('Akses lokasi ditolak. Silakan izinkan akses GPS di peramban Anda.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('Posisi koordinat tidak dapat dideteksi.');
                        break;
                    case error.TIMEOUT:
                        setLocationError('Waktu tunggu penentuan lokasi habis.');
                        break;
                    default:
                        setLocationError('Gagal mendeteksi lokasi GPS.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // ── Spatial Mode Handlers ──
    async function handleTpuExplorationChange(tpuId: string | number) {
        setSelectedExplorationTpuId(tpuId);
        setTpuDetails(null);
        setMakamListInside([]);
        setFlowerShopsNear([]);
        setActiveGraveForBuffer(null);

        if (!tpuId) return;

        setIsFetchingSpatial(true);
        try {
            // 1. Fetch TPU details (ST_Area)
            const resTpu = await fetch(getApiUrl(`/api/tpu/${tpuId}`));
            const dataTpu = await resTpu.json();
            if (dataTpu.status === 'success') {
                setTpuDetails(dataTpu.data);
            }

            // 2. Fetch Makam Inside (ST_Within)
            const resMakam = await fetch(getApiUrl(`/api/tpu/${tpuId}/makam-dalam-batas`));
            const dataMakam = await resMakam.json();
            if (dataMakam.status === 'success') {
                setMakamListInside(dataMakam.data);
            }

        } catch (err) {
            console.error('Error fetching spatial data:', err);
        } finally {
            setIsFetchingSpatial(false);
        }
    }

    async function handleFindFlowerShops(makam: any) {
        setActiveGraveForBuffer({ lat: makam.lat, lng: makam.lng, id: makam.id, name: makam.nama_nisan });
        setFlowerShopsNear([]);

        try {
            // Fetch flower shops within 500m buffer zone (ST_Buffer + ST_Within)
            const res = await fetch(getApiUrl(`/api/penjual-bunga/dekat-makam?makam_id=${makam.id}&radius_meter=500`));
            const data = await res.json();
            if (data.status === 'success') {
                setFlowerShopsNear(data.data);
            }
        } catch (err) {
            console.error('Error fetching flower shops:', err);
            console.error('Error checking ST_Contains:', err);
        }
    }

    return (
        <>
            <Head>
                <title>GoNgelayat — Cari Makam & GIS</title>
                <meta name="description" content="Layanan pencarian makam digital dan eksplorasi spasial GIS." />
            </Head>

            <div className="public-page">
                {/* ── Topbar ── */}
                <header className="pub-topbar">
                    <Link href={getApiUrl('/')} className="pub-brand">
                        <div className="pub-brand-icon"><IconGrave size={16} /></div>
                        <span>GoNgelayat</span>
                    </Link>
                    <Link href={getApiUrl('/login')} className="pub-login-btn">Masuk Admin</Link>
                </header>


                {activeMode === 'search' && (
                    <>
                        {/* ── Hero ── */}
                        <section className={`pub-hero ${hasFilter ? 'pub-hero--compact' : ''}`}>
                            <div className="pub-hero-inner">
                                {!hasFilter && (
                                    <div className="pub-hero-text fade-in">
                                        <h1 className="pub-headline">
                                            Temukan<br />
                                            <span className="pub-headline-accent">Makam</span>
                                        </h1>
                                        <p className="pub-desc">
                                            Cari informasi makam berdasarkan nama nisan, tanggal lahir, atau lokasi terdekat.
                                            Layanan ini tersedia untuk umum tanpa perlu masuk akun.
                                        </p>
                                    </div>
                                )}

                                {/* Search form */}
                                <form onSubmit={handleSearch}
                                    className={`pub-search-form fade-in ${hasFilter ? 'pub-search-form--top' : ''}`}
                                    role="search">

                                    {hasFilter && (
                                        <Link href={getApiUrl('/')} className="pub-back-link" onClick={(e) => { e.preventDefault(); handleClear(); }}>← Beranda</Link>
                                    )}

                                    {/* Search box utama */}
                                    <div className="pub-search-box">
                                        <div className="pub-search-icon">
                                            {isSearching ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2"
                                                    style={{ animation: 'spin 0.8s linear infinite' }}>
                                                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                                </svg>
                                            ) : <IconSearch size={18} />}
                                        </div>

                                        <input
                                            ref={inputRef}
                                            id="search-makam"
                                            type="search"
                                            className="pub-search-input"
                                            value={searchVal}
                                            onChange={e => setSearchVal(e.target.value)}
                                            placeholder="Ketik nama nisan..."
                                            autoComplete="off"
                                            aria-label="Cari makam berdasarkan nama nisan"
                                        />

                                        {/* Tombol filter */}
                                        <button
                                            type="button"
                                            className={`pub-filter-toggle ${showFilter ? 'active' : ''}`}
                                            onClick={() => setShowFilter(v => !v)}
                                            title="Filter tanggal"
                                            aria-label="Tampilkan filter tanggal"
                                        >
                                            <IconFilter />
                                            {activeFilterCount > 0 && (
                                                <span className="pub-filter-badge">{activeFilterCount}</span>
                                            )}
                                        </button>

                                        {(searchVal || filterLahir || filterWafat || userCoords) && (
                                            <button type="button" className="pub-search-clear"
                                                onClick={handleClear} aria-label="Hapus pencarian">
                                                ×
                                            </button>
                                        )}

                                        <button id="btn-cari" type="submit" className="pub-search-btn"
                                            disabled={isSearching || !hasAnyInput} aria-label="Cari">
                                            Cari
                                        </button>
                                    </div>

                            {/* Tombol Pencarian Lokasi Terdekat Spasial */}
                            <div className="pub-geo-actions">
                                <button
                                    type="button"
                                    onClick={handleFindNearest}
                                    disabled={isLocating}
                                    className={`pub-geo-btn ${isLocating ? 'loading' : ''}`}
                                    aria-label="Cari makam terdekat berdasarkan lokasi GPS Anda"
                                >
                                    {isLocating ? (
                                        <>
                                            <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.4rem', animation: 'spin 1s linear infinite' }}>
                                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                            </svg>
                                            Mendeteksi GPS Anda...
                                        </>
                                    ) : (
                                        <>
                                            Cari TPU Terdekat dari Saya (GPS - Buffering 10 km)
                                        </>
                                    )}
                                </button>
                            </div>

                            {locationError && (
                                <div className="pub-geo-error fade-in">
                                    ⚠️ {locationError}
                                </div>
                            )}

                            {/* Filter panel tanggal */}
                            {showFilter && (
                                <div className="pub-filter-panel fade-in">
                                    <div className="pub-filter-row">
                                        <div className="pub-filter-field">
                                            <label htmlFor="filter-tgl-lahir" className="pub-filter-label">
                                                <IconCalendar /> Tanggal Lahir
                                            </label>
                                            <input
                                                id="filter-tgl-lahir"
                                                type="date"
                                                className="pub-filter-input"
                                                value={filterLahir}
                                                onChange={e => setFilterLahir(e.target.value)}
                                            />
                                        </div>
                                        <div className="pub-filter-sep">—</div>
                                        <div className="pub-filter-field">
                                            <label htmlFor="filter-tgl-wafat" className="pub-filter-label">
                                                <IconCalendar /> Tanggal Meninggal
                                            </label>
                                            <input
                                                id="filter-tgl-wafat"
                                                type="date"
                                                className="pub-filter-input"
                                                value={filterWafat}
                                                onChange={e => setFilterWafat(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <p className="pub-filter-hint">
                                        Filter tanggal bisa digunakan sendiri atau dikombinasikan dengan nama nisan.
                                    </p>
                                </div>
                            )}

                            {!hasFilter && !showFilter && (
                                <p className="pub-search-hint">
                                    Masukkan nama nisan, filter tanggal, atau cari TPU terdekat dengan GPS (Buffering)
                                </p>
                            )}
                        </form>
                    </div>
                </section>

                {/* ── Results ── */}
                {hasFilter && (
                    <section className="pub-results">
                        <div className="pub-results-inner">
                            <div className="pub-results-header fade-in">
                                {/* Filter tags */}
                                {(query || tgl_lahir || tgl_wafat || userCoords) && (
                                    <div className="pub-filter-tags">
                                        {query && <span className="pub-filter-tag">Nama: <strong>{query}</strong></span>}
                                        {tgl_lahir && <span className="pub-filter-tag">Lahir: <strong>{formatDate(tgl_lahir)}</strong></span>}
                                        {tgl_wafat && <span className="pub-filter-tag">Meninggal: <strong>{formatDate(tgl_wafat)}</strong></span>}
                                        {userCoords && (
                                            <span className="pub-filter-tag" style={{ background: '#2563eb', color: '#ffffff' }}>
                                                GPS: <strong>{userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}</strong>
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {resultsTotal === 0 ? (
                                        <p className="pub-results-count">Tidak ada hasil ditemukan</p>
                                    ) : (
                                        <p className="pub-results-count">
                                            Ditemukan <strong>{resultsTotal}</strong> {userCoords ? 'TPU terdekat' : 'makam'}
                                            {userCoords && <span style={{ color: '#2563eb', fontWeight: 600 }}> (diurutkan berdasarkan terdekat dalam radius buffer 10 km)</span>}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {resultsTotal === 0 && (
                                <div className="pub-empty fade-in stagger-1">
                                    <div className="pub-empty-icon"><IconGrave size={36} /></div>
                                    <h3>Makam tidak ditemukan</h3>
                                    <p>Coba gunakan tombol GPS atau periksa kembali filter Anda.</p>
                                    <button onClick={handleClear} className="pub-try-again">
                                        Coba Pencarian Lain
                                    </button>
                                </div>
                            )}

                            {resultsTotal > 0 && (
                                <div className="pub-results-grid">
                                    <div className="fade-in pub-map-wrapper">
                                        <MapView 
                                            results={resultsList} 
                                            userCoords={userCoords} 
                                            selectedTpuId={selectedTpuId} 
                                            spatialMode={selectedTpuId !== null && resultsList.find(r => r.id === selectedTpuId)?.polygon_geojson !== undefined}
                                            tpuGeom={tpuDetails ? tpuDetails.geom : null}
                                            makamInside={makamListInside}
                                            flowerShops={flowerShopsNear}
                                            bufferGrave={activeGraveForBuffer}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Loading postgis queries */}
                                    {selectedTpuId !== null && isFetchingSpatial && (
                                        <div className="spatial-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', background: '#fff' }}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }}>
                                                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                            </svg>
                                            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Memproses kueri spasial PostGIS...</p>
                                        </div>
                                    )}

                                    {/* Spatial details panel (merged directly as selected card detail) */}
                                    {selectedTpuId !== null && !isFetchingSpatial && tpuDetails && (
                                        <div className="fade-in spatial-container" style={{ marginTop: '0.25rem' }}>
                                            {/* Kolom 1: Detail TPU, Luas, & Jalur */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {/* ST_Area */}
                                                <div className="spatial-card" style={{ marginBottom: 0 }}>
                                                    <h3>
                                                        <span>🏢 Detail TPU & Kalkulasi Luas</span>
                                                        <span className="spatial-badge">ST_Area</span>
                                                    </h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <div><strong>Nama TPU:</strong> {tpuDetails.nama}</div>
                                                        <div><strong>Alamat:</strong> {tpuDetails.alamat || '—'}</div>
                                                        <div><strong>Sisa Lahan:</strong> {tpuDetails.sisa_lahan_m2 ? `${tpuDetails.sisa_lahan_m2} m²` : '—'}</div>
                                                        <div style={{
                                                            background: 'rgba(37, 99, 235, 0.05)',
                                                            border: '1px solid rgba(37, 99, 235, 0.1)',
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            marginTop: '0.25rem'
                                                        }}>
                                                            <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Luas Area Geografis:</div>
                                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb', margin: '0.1rem 0' }}>
                                                                {tpuDetails.luas_m2 ? tpuDetails.luas_m2.toLocaleString('id-ID') : '—'} m²
                                                            </div>
                                                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                                                Query: <code>ST_Area(geom::geography)</code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Kolom 2: Makam (Within), Contains, & Flower Shops (Buffer) */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {/* ST_Within */}
                                                <div className="spatial-card" style={{ marginBottom: 0 }}>
                                                    <h3>
                                                        <span>🪦 Makam di Dalam Batas TPU</span>
                                                        <span className="spatial-badge">ST_Within</span>
                                                    </h3>
                                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
                                                        Menampilkan data makam yang lokasinya (Point) berada di dalam polygon batas TPU.
                                                    </p>
                                                    {makamListInside.length === 0 ? (
                                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                                                            Tidak ada makam di dalam batas TPU ini.
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                                            {makamListInside.map(m => (
                                                                <div key={m.id} style={{
                                                                    padding: '0.6rem 0.75rem',
                                                                    border: `1px solid ${activeGraveForBuffer?.id === m.id ? '#2563eb' : '#e5e7eb'}`,
                                                                    background: activeGraveForBuffer?.id === m.id ? 'rgba(37, 99, 235, 0.02)' : '#fff',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.8rem'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                                        <div>
                                                                            <div style={{ fontWeight: 600, color: '#0a0a0a' }}>🪦 {m.nama_nisan || 'Tanpa Nama'}</div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleFindFlowerShops(m)}
                                                                            style={{
                                                                                background: activeGraveForBuffer?.id === m.id ? '#eff6ff' : '#f8fafc',
                                                                                border: `1px solid ${activeGraveForBuffer?.id === m.id ? '#bfdbfe' : '#e2e8f0'}`,
                                                                                color: activeGraveForBuffer?.id === m.id ? '#1d4ed8' : '#475569',
                                                                                padding: '0.35rem 0.6rem',
                                                                                fontSize: '0.7rem',
                                                                                borderRadius: '4px',
                                                                                fontWeight: 600,
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.15s'
                                                                            }}
                                                                        >
                                                                            🌸 Cari Kios Bunga
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ST_Buffer + ST_Within + ST_Distance */}
                                                {activeGraveForBuffer && (
                                                    <div className="spatial-card" style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.01)', marginBottom: 0 }}>
                                                        <h3 style={{ color: '#065f46', borderBottomColor: '#a7f3d0' }}>
                                                            <span>🌸 Kios Bunga Terdekat (Radius 500m)</span>
                                                            <span className="spatial-badge" style={{ background: '#d1fae5', color: '#059669', borderColor: '#a7f3d0' }}>Buffer & Dist</span>
                                                        </h3>
                                                        <p style={{ fontSize: '0.75rem', color: '#065f46', margin: '0 0 0.75rem 0' }}>
                                                            Mencari penjual bunga dalam lingkaran buffer 500m dari makam <strong>{activeGraveForBuffer.name}</strong>.
                                                        </p>
                                                        {flowerShopsNear.length === 0 ? (
                                                            <div style={{ fontSize: '0.8rem', color: '#059669', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>
                                                                Tidak ada penjual bunga dalam radius 500 meter.
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                {flowerShopsNear.map(f => (
                                                                    <div key={f.id} style={{
                                                                        padding: '0.6rem 0.75rem',
                                                                        border: '1px solid #a7f3d0',
                                                                        background: '#ffffff',
                                                                        borderRadius: '8px',
                                                                        fontSize: '0.8rem',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center'
                                                                    }}>
                                                                        <div>
                                                                            <div style={{ fontWeight: 600, color: '#065f46' }}>🏪 {f.nama_toko}</div>
                                                                            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem' }}>{f.alamat}</div>
                                                                        </div>
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <div style={{ fontWeight: 700, color: '#10b981' }}>{Math.round(f.jarak_meter)} m</div>
                                                                            <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>ST_Distance</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            📋 Daftar Hasil Detail {userCoords && <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 400 }}>(Klik kartu untuk menggambar rute navigasi)</span>}
                                        </h4>
                                    </div>
                                    <div className="pub-result-list">
                                        {resultsList.map((m, i) => (
                                            <MakamCard 
                                                key={m.id} 
                                                m={m} 
                                                index={i} 
                                                isSelected={selectedTpuId === m.id}
                                                onClick={() => handleSelectTpu(m)}
                                            />
                                        ))}
                                    </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </>
        )}

                {/* ── Footer ── */}
                <footer className="pub-footer">
                    <p>© {new Date().getFullYear()} GoNgelayat &mdash; Sistem Informasi Pemakaman</p>
                </footer>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .public-page {
                    min-height: 100vh;
                    display: flex; flex-direction: column;
                    background: #ffffff;
                    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
                }

                .pub-topbar {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 1.5rem; height: 56px;
                    background: rgba(255,255,255,0.92);
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .pub-results-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    margin-top: 1rem;
                    align-items: start;
                }
                .pub-map-wrapper { position: relative; }
                
                @media (min-width: 992px) {
                    .pub-results-grid {
                        grid-template-columns: 1.4fr 1fr;
                        gap: 2rem;
                    }
                    .pub-map-wrapper {
                        position: sticky;
                        top: 76px;
                    }
                }

                .pub-brand {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-weight: 700; font-size: 0.95rem;
                    color: #0a0a0a; text-decoration: none; letter-spacing: -0.02em;
                }
                .pub-brand-icon {
                    width: 30px; height: 30px; background: #0a0a0a;
                    border-radius: 8px; display: flex; align-items: center;
                    justify-content: center; color: white;
                }
                .pub-login-btn {
                    display: inline-flex; align-items: center;
                    padding: 0.4rem 0.9rem;
                    border: 1px solid #e5e7eb; border-radius: 6px;
                    font-size: 0.8rem; font-weight: 500;
                    color: #374151; text-decoration: none; transition: all 0.15s;
                }
                .pub-login-btn:hover { background: #0a0a0a; color: #fff; border-color: #0a0a0a; }

                /* Hero */
                .pub-hero {
                    padding-top: 56px;
                    min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                    background: #ffffff;
                    transition: min-height 0.4s ease, padding 0.4s ease;
                    position: relative; overflow: hidden;
                }
                .pub-hero::before {
                    content: '';
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
                    background-size: 40px 40px; pointer-events: none;
                }
                .pub-hero--compact { min-height: auto; padding: 5rem 1.5rem 2rem; }
                .pub-hero-inner {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 640px;
                    margin: 0 auto; padding: 2rem 1.5rem;
                    display: flex; flex-direction: column; align-items: center; gap: 2rem;
                }
                .pub-hero-text { text-align: center; animation: fadeUp 0.5s ease both; }
                .pub-eyebrow {
                    display: inline-block;
                    font-size: 0.72rem; font-weight: 600;
                    letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280;
                    margin-bottom: 1rem; padding: 0.3rem 0.75rem;
                    border: 1px solid #e5e7eb; border-radius: 999px;
                }
                .pub-headline {
                    font-size: clamp(2.8rem, 7vw, 4.5rem);
                    font-weight: 800; letter-spacing: -0.04em;
                    line-height: 1.05; color: #0a0a0a; margin: 0 0 1rem;
                }
                .pub-headline-accent { position: relative; display: inline-block; }
                .pub-headline-accent::after {
                    content: '';
                    position: absolute; left: 0; bottom: 2px; right: 0; height: 6px;
                    background: #0a0a0a; border-radius: 2px; opacity: 0.12;
                }
                .pub-desc { font-size: 1rem; color: #6b7280; line-height: 1.7; max-width: 480px; margin: 0 auto; }

                /* Search form */
                .pub-search-form {
                    width: 100%;
                    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
                    animation: fadeUp 0.5s ease 0.15s both;
                }
                .pub-back-link {
                    align-self: flex-start; font-size: 0.82rem; color: #6b7280;
                    text-decoration: none; transition: color 0.15s;
                }
                .pub-back-link:hover { color: #0a0a0a; }

                .pub-search-box {
                    display: flex; align-items: center; width: 100%;
                    background: #ffffff;
                    border: 2px solid #0a0a0a; border-radius: 14px; overflow: hidden;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
                    transition: box-shadow 0.2s;
                }
                .pub-search-box:focus-within {
                    box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
                }
                .pub-search-icon { padding: 0 0.5rem 0 1rem; color: #9ca3af; flex-shrink: 0; display: flex; align-items: center; }
                .pub-search-input {
                    flex: 1; padding: 1rem 0.5rem;
                    font-size: 1rem; font-family: inherit;
                    border: none; outline: none; background: transparent;
                    color: #0a0a0a; -webkit-appearance: none;
                }
                .pub-search-input::placeholder { color: #9ca3af; }
                .pub-search-input::-webkit-search-cancel-button { display: none; }

                /* Filter toggle button */
                .pub-filter-toggle {
                    position: relative;
                    display: flex; align-items: center; justify-content: center;
                    width: 36px; height: 36px; flex-shrink: 0;
                    background: none; border: none;
                    color: #9ca3af; cursor: pointer;
                    border-radius: 6px; margin: 0 0.25rem;
                    transition: background 0.15s, color 0.15s;
                }
                .pub-filter-toggle:hover,
                .pub-filter-toggle.active { background: #f5f5f5; color: #0a0a0a; }
                .pub-filter-badge {
                    position: absolute; top: 2px; right: 2px;
                    width: 14px; height: 14px;
                    background: #0a0a0a; color: #fff;
                    border-radius: 99px; font-size: 0.6rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }

                .pub-search-clear {
                    background: none; border: none;
                    padding: 0 0.5rem; font-size: 1.2rem; color: #9ca3af;
                    cursor: pointer; line-height: 1; transition: color 0.15s; flex-shrink: 0;
                }
                .pub-search-clear:hover { color: #0a0a0a; }

                .pub-search-btn {
                    background: #0a0a0a; color: #fff;
                    border: none; outline: none;
                    padding: 1rem 1.5rem;
                    font-size: 0.9rem; font-weight: 600; font-family: inherit;
                    cursor: pointer; transition: background 0.15s, opacity 0.15s;
                    flex-shrink: 0; letter-spacing: -0.01em;
                }
                .pub-search-btn:hover:not(:disabled) { background: #1f2937; }
                .pub-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .pub-search-hint { font-size: 0.78rem; color: #9ca3af; margin: 0; }

                /* Filter panel */
                .pub-filter-panel {
                    width: 100%;
                    background: #f9f9f9;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 1rem 1.25rem;
                    animation: fadeUp 0.2s ease both;
                }
                .pub-filter-row {
                    display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap;
                }
                .pub-filter-field { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 160px; }
                .pub-filter-label {
                    display: flex; align-items: center; gap: 0.3rem;
                    font-size: 0.75rem; font-weight: 500; color: #6b7280;
                }
                .pub-filter-input {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #e5e7eb; border-radius: 8px;
                    font-size: 0.85rem; font-family: inherit;
                    background: #fff; color: #0a0a0a;
                    outline: none; transition: border-color 0.15s;
                }
                .pub-filter-input:focus { border-color: #0a0a0a; }
                .pub-filter-sep { color: #d1d5db; font-size: 0.9rem; padding-bottom: 0.5rem; align-self: flex-end; }
                .pub-filter-hint {
                    font-size: 0.72rem; color: #9ca3af;
                    margin: 0.625rem 0 0; line-height: 1.5;
                }

                /* Results */
                .pub-results {
                    flex: 1; background: #f9f9f9;
                    border-top: 1px solid #f0f0f0;
                    padding: 2rem 1.5rem 4rem;
                }
                .pub-results-inner { max-width: 1400px; margin: 0 auto; }
                .pub-results-header { margin-bottom: 1.25rem; animation: fadeUp 0.3s ease both; }

                /* Filter tags */
                .pub-filter-tags {
                    display: flex; flex-wrap: wrap; gap: 0.4rem;
                    margin-bottom: 0.625rem;
                }
                .pub-filter-tag {
                    display: inline-flex; align-items: center;
                    padding: 0.2rem 0.6rem;
                    background: #0a0a0a; color: #fff;
                    border-radius: 99px; font-size: 0.72rem;
                }
                .pub-filter-tag strong { font-weight: 600; margin-left: 0.2rem; }

                .pub-results-count { font-size: 0.875rem; color: #6b7280; margin: 0; }
                .pub-limit-note { color: #9ca3af; font-size: 0.8rem; }

                /* Result cards */
                .pub-result-list { display: flex; flex-direction: column; gap: 0.625rem; }
                .makam-card {
                    display: flex; align-items: flex-start; gap: 1rem;
                    background: #ffffff; border: 1px solid #e5e7eb;
                    border-radius: 12px; padding: 1.1rem 1.25rem;
                    cursor: default;
                    transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
                    animation: fadeUp 0.35s ease both;
                }
                .makam-card:hover {
                    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
                    border-color: #d1d5db; transform: translateY(-2px);
                }
                .makam-card-left { flex-shrink: 0; }
                .makam-avatar {
                    width: 42px; height: 42px; background: #f5f5f5;
                    border-radius: 10px; display: flex; align-items: center;
                    justify-content: center; color: #374151;
                }
                .makam-card-body { flex: 1; min-width: 0; }
                .makam-name {
                    font-size: 0.975rem; font-weight: 600; color: #0a0a0a;
                    margin: 0 0 0.4rem;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .makam-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; }
                .makam-meta-item {
                    display: flex; align-items: center; gap: 0.3rem;
                    font-size: 0.8rem; color: #6b7280;
                }
                .makam-age {
                    display: inline-block; margin-left: 0.35rem;
                    padding: 0.1rem 0.45rem; background: #f3f4f6;
                    border-radius: 99px; font-size: 0.72rem; color: #374151;
                }
                .makam-keterangan {
                    margin: 0.5rem 0 0; font-size: 0.8rem; color: #9ca3af;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .makam-card-arrow {
                    flex-shrink: 0; color: #d1d5db;
                    display: flex; align-items: center;
                    transition: color 0.15s, transform 0.15s;
                }
                .makam-card:hover .makam-card-arrow { color: #0a0a0a; transform: translateX(2px); }

                /* Empty state */
                .pub-empty { text-align: center; padding: 4rem 1rem; }
                .pub-empty-icon {
                    width: 72px; height: 72px; background: #f5f5f5;
                    border-radius: 16px; display: flex; align-items: center;
                    justify-content: center; margin: 0 auto 1.25rem; color: #9ca3af;
                }
                .pub-empty h3 { font-size: 1rem; font-weight: 600; color: #0a0a0a; margin: 0 0 0.4rem; }
                .pub-empty p { font-size: 0.875rem; color: #6b7280; margin: 0 0 1.5rem; }
                .pub-try-again {
                    display: inline-flex; padding: 0.55rem 1.25rem;
                    background: #0a0a0a; color: #fff;
                    border: none; border-radius: 8px;
                    font-size: 0.85rem; font-weight: 500;
                    font-family: inherit; cursor: pointer; transition: background 0.15s;
                }
                .pub-try-again:hover { background: #1f2937; }

                /* Footer */
                .pub-footer { border-top: 1px solid #f0f0f0; padding: 1.25rem 1.5rem; text-align: center; }
                .pub-footer p { font-size: 0.75rem; color: #9ca3af; margin: 0; }

                /* Geo Actions & GPS */
                .pub-geo-actions {
                    margin-top: 0.5rem;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                .pub-geo-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.6rem 1.25rem;
                    background: rgba(10, 10, 10, 0.05);
                    border: 1px dashed rgba(10, 10, 10, 0.2);
                    border-radius: 99px;
                    color: #0a0a0a;
                    font-size: 0.82rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pub-geo-btn:hover:not(:disabled) {
                    background: rgba(10, 10, 10, 0.08);
                    border-color: rgba(10, 10, 10, 0.4);
                    transform: translateY(-1px);
                }
                .pub-geo-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .pub-geo-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .pub-geo-error {
                    font-size: 0.78rem;
                    color: #dc2626;
                    background: rgba(220, 38, 38, 0.05);
                    border: 1px solid rgba(220, 38, 38, 0.1);
                    padding: 0.5rem 0.875rem;
                    border-radius: 8px;
                    text-align: center;
                    width: 100%;
                    margin-top: 0.5rem;
                }
                .makam-distance-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.2rem 0.55rem;
                    background: rgba(37, 99, 235, 0.08);
                    color: #2563eb;
                    border: 1px solid rgba(37, 99, 235, 0.15);
                    border-radius: 99px;
                    font-size: 0.72rem;
                    font-weight: 600;
                }
                .user-location-marker {
                    position: relative;
                }
                .user-pulse {
                    width: 14px;
                    height: 14px;
                    background: #3b82f6;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
                    position: absolute;
                    top: 3px;
                    left: 3px;
                }
                .user-pulse::after {
                    content: '';
                    width: 30px;
                    height: 30px;
                    border: 2px solid #3b82f6;
                    background: rgba(59, 130, 246, 0.15);
                    border-radius: 50%;
                    position: absolute;
                    top: -10px;
                    left: -10px;
                    animation: pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.35); opacity: 1; }
                    80%, 100% { transform: scale(1.2); opacity: 0; }
                }

                /* Marching Dash Animation for Route Navigation */
                @keyframes dash {
                    to {
                        stroke-dashoffset: -40;
                    }
                }
                .animated-polyline {
                    animation: dash 2.5s linear infinite;
                }

                /* Selection state styling for cards */
                .makam-card {
                    border: 1px solid #e5e7eb;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .makam-card--selected {
                    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
                    transform: translateY(-2px);
                }

                /* ==========================================
                   Responsive & Mobile Optimizations
                   ========================================== */
                
                @media (max-width: 768px) {
                    .pub-hero--compact {
                        padding: 4.5rem 1rem 1.5rem;
                    }
                    .pub-hero-inner {
                        padding: 1.5rem 1rem;
                        gap: 1.5rem;
                    }
                    .pub-results {
                        padding: 1.5rem 1rem 3rem;
                    }
                    .pub-results-header {
                        margin-bottom: 1rem;
                    }
                    /* Map container responsive height */
                    div[ref="mapRef"], .leaflet-container {
                        height: 350px !important;
                    }
                    .pub-geo-btn {
                        width: 100%;
                        border-radius: 12px;
                        padding: 0.7rem 1.25rem;
                    }
                }

                @media (max-width: 480px) {
                    .pub-topbar {
                        padding: 0 1rem;
                        height: 52px;
                    }
                    .pub-brand-icon {
                        width: 26px;
                        height: 26px;
                        border-radius: 6px;
                    }
                    .pub-brand {
                        font-size: 0.85rem;
                    }
                    .pub-login-btn {
                        padding: 0.3rem 0.75rem;
                        font-size: 0.75rem;
                        border-radius: 6px;
                    }
                    .pub-headline {
                        font-size: 2.2rem;
                        margin-bottom: 0.75rem;
                    }
                    .pub-desc {
                        font-size: 0.875rem;
                        line-height: 1.5;
                        padding: 0 0.5rem;
                    }
                    
                    /* Search input and button sizing on mobile */
                    .pub-search-box {
                        border-radius: 12px;
                    }
                    .pub-search-input {
                        padding: 0.8rem 0.4rem;
                        font-size: 0.9rem;
                    }
                    .pub-search-icon {
                        padding: 0 0.25rem 0 0.75rem;
                    }
                    .pub-search-btn {
                        padding: 0.8rem 1rem;
                        font-size: 0.82rem;
                    }
                    .pub-filter-toggle {
                        width: 32px;
                        height: 32px;
                    }
                    
                    /* Filter panel inputs full width on mobile */
                    .pub-filter-panel {
                        padding: 0.875rem 1rem;
                    }
                    .pub-filter-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 0.75rem;
                    }
                    .pub-filter-field {
                        min-width: 100%;
                    }
                    .pub-filter-input {
                        padding: 0.6rem 0.75rem;
                        font-size: 0.85rem;
                    }
                    .pub-filter-sep {
                        display: none;
                    }
                    .pub-filter-hint {
                        margin-top: 0.5rem;
                        text-align: center;
                    }

                    /* Search results metadata elements stacked */
                    .pub-results-header > div {
                        flex-direction: column;
                        align-items: stretch !important;
                        gap: 0.75rem;
                    }
                    .pub-results-count {
                        text-align: center;
                    }
                    .pub-results-header button {
                        flex: 1;
                        text-align: center;
                        justify-content: center;
                    }
                    
                    /* Touch-friendly lists and cards */
                    .pub-result-list {
                        gap: 0.5rem;
                    }
                    .makam-card {
                        padding: 0.875rem 1rem;
                        border-radius: 10px;
                        gap: 0.75rem;
                    }
                    .makam-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                    }
                    .makam-avatar svg {
                        width: 18px;
                        height: 18px;
                    }
                    .makam-name {
                        font-size: 0.9rem;
                    }
                    .makam-meta {
                        flex-direction: column;
                        gap: 0.35rem;
                    }
                    .makam-meta-item {
                        font-size: 0.75rem;
                    }
                    .makam-age {
                        margin-left: 0.25rem;
                        padding: 0.05rem 0.35rem;
                        font-size: 0.68rem;
                    }
                    .makam-distance-badge {
                        padding: 0.1rem 0.45rem;
                        font-size: 0.68rem;
                    }
                    .makam-keterangan {
                        font-size: 0.75rem;
                        margin-top: 0.35rem;
                    }
                    .makam-card-arrow {
                        align-self: center;
                    }
                }

                /* Spatial Dashboard CSS */
                .spatial-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    margin-top: 1rem;
                }
                .spatial-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .spatial-card h3 {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #0a0a0a;
                    margin: 0 0 0.75rem 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                    border-bottom: 1px solid #f3f4f6;
                    padding-bottom: 0.5rem;
                }
                .spatial-badge {
                    font-size: 0.7rem;
                    font-weight: 700;
                    background: #eff6ff;
                    color: #2563eb;
                    padding: 0.15rem 0.45rem;
                    border-radius: 99px;
                    border: 1px solid #dbeafe;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

            `}</style>
        </>
    );
}
