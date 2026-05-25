import React, { useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface Coordinate {
    lat: number;
    lng: number;
}

interface Grave {
    id: number;
    nama_nisan: string;
    lat: number | null;
    lng: number | null;
}

interface TpuPolygonMapProps {
    initialPolygon?: Coordinate[];
    onPolygonChange?: (polygon: Coordinate[]) => void;
    readOnly?: boolean;
    graves?: Grave[];
}

const DEFAULT_CENTER: [number, number] = [-8.1681, 113.7151];
const DEFAULT_ZOOM = 16;

export default function TpuPolygonMap({
    initialPolygon = [],
    onPolygonChange,
    readOnly = false,
    graves = [],
}: TpuPolygonMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const mapRef = useRef<any>(null);

    const drawnItemsRef = useRef<any>(null);

    const polygonLayerRef = useRef<any>(null);
    const gravesGroupRef = useRef<any>(null);

    const [numVertices, setNumVertices] = useState<number>(
        initialPolygon.length
    );

    /**
     * =========================================================
     * INIT MAP
     * =========================================================
     */
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        let mounted = true;

        const initMap = async () => {
            try {
                const L = await import('leaflet');

                // IMPORTANT
                // expose Leaflet globally for leaflet-draw
                (window as any).L = L;

                await import('leaflet-draw');

                if (!mounted) return;

                /**
                 * ==========================================
                 * FIX DEFAULT ICON
                 * ==========================================
                 */
                delete (L.Icon.Default.prototype as any)._getIconUrl;

                L.Icon.Default.mergeOptions({
                    iconRetinaUrl:
                        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl:
                        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl:
                        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });

                /**
                 * ==========================================
                 * CENTER MAP
                 * ==========================================
                 */
                const center: [number, number] =
                    initialPolygon.length > 0
                        ? [
                              initialPolygon[0].lat,
                              initialPolygon[0].lng,
                          ]
                        : DEFAULT_CENTER;

                /**
                 * ==========================================
                 * CREATE MAP
                 * ==========================================
                 */
                const map = L.map(mapContainerRef.current!, {
                    zoomControl: true,
                    doubleClickZoom: !readOnly,
                }).setView(center, DEFAULT_ZOOM);

                mapRef.current = map;

                /**
                 * ==========================================
                 * TILE LAYER
                 * ==========================================
                 */
                L.tileLayer(
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19,
                    }
                ).addTo(map);

                /**
                 * ==========================================
                 * DRAWN ITEMS GROUP
                 * ==========================================
                 */
                const drawnItems = new L.FeatureGroup();

                map.addLayer(drawnItems);

                drawnItemsRef.current = drawnItems;

                /**
                 * ==========================================
                 * RENDER EXISTING POLYGON
                 * ==========================================
                 */
                if (initialPolygon.length > 0) {
                    renderPolygon(initialPolygon, L);
                }

                /**
                 * ==========================================
                 * RENDER GRAVE MARKERS
                 * ==========================================
                 */
                if (graves && graves.length > 0) {
                    renderGraves(graves, L);
                }

                /**
                 * ==========================================
                 * DRAW CONTROL
                 * ==========================================
                 */
                if (!readOnly) {
                    const drawControl = new (L as any).Control.Draw({
                        position: 'topright',

                        draw: {
                            polyline: false,
                            rectangle: false,
                            circle: false,
                            marker: false,
                            circlemarker: false,

                            polygon: {
                                allowIntersection: false,

                                drawError: {
                                    color: '#ef4444',
                                    message:
                                        'Polygon tidak boleh berpotongan',
                                },

                                shapeOptions: {
                                    color: '#0a0a0a',
                                    weight: 3,
                                    fillColor: '#0a0a0a',
                                    fillOpacity: 0.35,
                                },
                            },
                        },

                        edit: {
                            featureGroup: drawnItems,
                            remove: true,
                        },
                    });

                    map.addControl(drawControl);

                    /**
                     * ======================================
                     * CREATED
                     * ======================================
                     */
                    map.on(
                        (L as any).Draw.Event.CREATED,
                        (event: any) => {
                            const layer = event.layer;

                            drawnItems.clearLayers();

                            drawnItems.addLayer(layer);

                            polygonLayerRef.current = layer;

                            const latlngs = layer.getLatLngs()[0] as any[];

                            const coords: Coordinate[] = latlngs.map(
                                (ll: any) => ({
                                    lat: ll.lat,
                                    lng: ll.lng,
                                })
                            );

                            setNumVertices(coords.length);

                            onPolygonChange?.(coords);
                        }
                    );

                    /**
                     * ======================================
                     * EDITED
                     * ======================================
                     */
                    map.on(
                        (L as any).Draw.Event.EDITED,
                        (event: any) => {
                            event.layers.eachLayer((layer: any) => {
                                const latlngs =
                                    layer.getLatLngs()[0] as any[];

                                const coords: Coordinate[] = latlngs.map(
                                    (ll: any) => ({
                                        lat: ll.lat,
                                        lng: ll.lng,
                                    })
                                );

                                setNumVertices(coords.length);

                                onPolygonChange?.(coords);
                            });
                        }
                    );

                    /**
                     * ======================================
                     * DELETED
                     * ======================================
                     */
                    map.on(
                        (L as any).Draw.Event.DELETED,
                        () => {
                            polygonLayerRef.current = null;

                            setNumVertices(0);

                            onPolygonChange?.([]);
                        }
                    );
                }

                /**
                 * ==========================================
                 * FIX MAP SIZE
                 * ==========================================
                 */
                setTimeout(() => {
                    map.invalidateSize(true);
                }, 300);
            } catch (error) {
                console.error(
                    'Gagal menginisialisasi Leaflet:',
                    error
                );
            }
        };

        initMap();

        /**
         * =====================================================
         * CLEANUP
         * =====================================================
         */
        return () => {
            mounted = false;

            if (mapRef.current) {
                mapRef.current.off();

                mapRef.current.remove();

                mapRef.current = null;
            }

            drawnItemsRef.current = null;

            polygonLayerRef.current = null;
        };
    }, []);

    /**
     * =========================================================
     * SYNC EXISTING POLYGON
     * =========================================================
     */
    useEffect(() => {
        if (!mapRef.current || !drawnItemsRef.current) return;

        import('leaflet').then((L) => {
            drawnItemsRef.current.clearLayers();

            if (initialPolygon.length > 0) {
                renderPolygon(initialPolygon, L);
            } else {
                setNumVertices(0);
            }
        });
    }, [initialPolygon]);

    /**
     * =========================================================
     * RENDER POLYGON
     * =========================================================
     */
    const renderPolygon = (
        polygon: Coordinate[],
        L: any
    ) => {
        if (!drawnItemsRef.current) return;

        const latlngs = polygon.map((p) => [
            p.lat,
            p.lng,
        ]);

        const polygonLayer = L.polygon(latlngs, {
            color: '#0a0a0a',
            weight: 3,
            fillColor: '#0a0a0a',
            fillOpacity: 0.25,
        });

        drawnItemsRef.current.clearLayers();

        drawnItemsRef.current.addLayer(polygonLayer);

        polygonLayerRef.current = polygonLayer;

        setNumVertices(polygon.length);

        if (mapRef.current) {
            mapRef.current.fitBounds(
                polygonLayer.getBounds(),
                {
                    padding: [40, 40],
                }
            );
        }
    };

    /**
     * =========================================================
     * SYNC GRAVES MARKERS
     * =========================================================
     */
    useEffect(() => {
        if (!mapRef.current || !graves) return;

        import('leaflet').then((L) => {
            renderGraves(graves, L);
        });
    }, [graves]);

    /**
     * =========================================================
     * RENDER GRAVE MARKERS
     * =========================================================
     */
    const renderGraves = (gravesList: Grave[], L: any) => {
        if (!mapRef.current) return;

        if (gravesGroupRef.current) {
            gravesGroupRef.current.clearLayers();
        } else {
            gravesGroupRef.current = new L.FeatureGroup();
            mapRef.current.addLayer(gravesGroupRef.current);
        }

        const graveIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [18, 30],
            iconAnchor: [9, 30],
            popupAnchor: [1, -26],
            shadowSize: [30, 30]
        });

        gravesList.forEach((grave) => {
            if (grave.lat && grave.lng) {
                const marker = L.marker([grave.lat, grave.lng], { icon: graveIcon });
                const popupContent = `
                    <div style="font-family: inherit; padding: 4px; font-size: 0.82rem; min-width: 120px;">
                        <div style="font-weight: 700; color: #0a0a0a; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 0.9rem;">🪦</span> Makam
                        </div>
                        <div style="font-weight: 500; color: #374151; word-break: break-word;">${grave.nama_nisan}</div>
                    </div>
                `;
                marker.bindPopup(popupContent);
                gravesGroupRef.current.addLayer(marker);
            }
        });
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
            }}
        >
            {/* MAP */}
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: readOnly
                        ? '260px'
                        : '420px',
                    borderRadius: '0.625rem',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    zIndex: 1,
                }}
            />

            {/* INFO BADGE */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '0.75rem',
                    zIndex: 1000,

                    background:
                        'rgba(255,255,255,0.92)',

                    backdropFilter: 'blur(6px)',

                    border:
                        '1px solid #e5e7eb',

                    borderRadius: '0.5rem',

                    padding: '0.5rem 0.8rem',

                    fontSize: '0.76rem',

                    boxShadow:
                        '0 4px 12px rgba(0,0,0,0.05)',

                    color: '#1f2937',

                    display: 'flex',

                    flexDirection: 'column',

                    gap: '0.15rem',
                }}
            >
                {readOnly ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 600,
                        }}
                    >
                        <span
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#0a0a0a',
                                display: 'inline-block',
                            }}
                        />

                        Batas Area TPU (
                        {numVertices} koordinat)
                    </div>
                ) : numVertices > 0 ? (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontWeight: 600,
                            }}
                        >
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                    display: 'inline-block',
                                }}
                            />

                            Area tergambar (
                            {numVertices} simpul)
                        </div>

                        <div
                            style={{
                                color: '#6b7280',
                                fontSize: '0.7rem',
                            }}
                        >
                            Geser titik polygon untuk
                            mengedit area.
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: '#dc2626',
                            fontWeight: 500,
                        }}
                    >
                        <span
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#dc2626',
                                display: 'inline-block',
                                animation:
                                    'pulse 1.5s infinite',
                            }}
                        />

                        Belum ada polygon TPU
                    </div>
                )}
            </div>

            {/* ANIMATION */}
            <style>
                {`
                    @keyframes pulse {
                        0% {
                            transform: scale(0.95);
                            opacity: 0.5;
                        }

                        50% {
                            transform: scale(1.15);
                            opacity: 1;
                        }

                        100% {
                            transform: scale(0.95);
                            opacity: 0.5;
                        }
                    }
                `}
            </style>
        </div>
    );
}