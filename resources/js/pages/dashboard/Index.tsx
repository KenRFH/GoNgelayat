import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

// ── Types ──────────────────────────────────────────────────────
interface Stats {
    total_tpu?: number;
    total_blok?: number;
    total_admin?: number;
    total_makam?: number;
}

interface RecentItem {
    id: number;
    // superadmin
    nama?: string;
    alamat?: string;
    blok_tpu_count?: number;
    // admin
    nama_nisan?: string;
    tpu_nama?: string;
    tanggal_wafat?: string;
    created_at?: string;
}

interface Props {
    stats: Stats;
    recent: RecentItem[];
    mode: 'superadmin' | 'admin';
}

function formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, icon, accent = false }: {
    label: string; value: number | undefined; icon: React.ReactNode; accent?: boolean;
}) {
    return (
        <div className="stat-card" style={accent ? { background: '#0a0a0a', color: '#fff' } : {}}>
            <div className="stat-card-icon" style={accent ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}>
                {icon}
            </div>
            <div className="stat-card-value" style={accent ? { color: '#fff' } : {}}>
                {value ?? 0}
            </div>
            <div className="stat-card-label" style={accent ? { color: 'rgba(255,255,255,0.6)' } : {}}>
                {label}
            </div>
        </div>
    );
}

// ── Icons ──────────────────────────────────────────────────────
const IconMap = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
);
const IconLayers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
    </svg>
);
const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const IconGrave = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a5 5 0 0 1 5 5v7H7V7a5 5 0 0 1 5-5z"/>
        <line x1="7" y1="14" x2="17" y2="14"/>
        <line x1="9" y1="19" x2="15" y2="19"/>
        <line x1="12" y1="14" x2="12" y2="22"/>
    </svg>
);

// ── Main ───────────────────────────────────────────────────────
export default function DashboardIndex({ stats, recent, mode }: Props) {
    const isSuperadmin = mode === 'superadmin';

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard — GoNgelayat" />

            {/* Welcome */}
            <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
                <h2 className="section-title">
                    {isSuperadmin ? 'Dashboard Superadmin' : 'Dashboard Admin'}
                </h2>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                    {isSuperadmin
                        ? 'Kelola TPU, blok, dan akun pengguna.'
                        : 'Kelola data makam di TPU yang ditugaskan.'}
                </p>
            </div>

            {/* ── Stats ── */}
            <div className="stats-grid fade-in stagger-1">
                {isSuperadmin ? (
                    <>
                        <StatCard label="Total TPU" value={stats.total_tpu} icon={<IconMap />} accent />
                        <StatCard label="Total Blok" value={stats.total_blok} icon={<IconLayers />} />
                        <StatCard label="Admin" value={stats.total_admin} icon={<IconUsers />} />
                        <StatCard label="Total Makam" value={stats.total_makam} icon={<IconGrave />} />
                    </>
                ) : (
                    <>
                        <StatCard label="Total Makam" value={stats.total_makam} icon={<IconGrave />} accent />
                        <StatCard label="Total Blok" value={stats.total_blok} icon={<IconLayers />} />
                        <StatCard label="Total TPU" value={stats.total_tpu} icon={<IconMap />} />
                    </>
                )}
            </div>

            {/* ── Recent ── */}
            <div className="card fade-in stagger-2" style={{ marginTop: '1.5rem' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0',
                }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                        {isSuperadmin ? 'TPU Terbaru Ditambahkan' : 'Makam Terbaru Ditambahkan'}
                    </h3>
                    <Link
                        href={isSuperadmin ? '/tpu' : '/makam'}
                        style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none' }}
                    >
                        Lihat semua →
                    </Link>
                </div>

                {recent.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            Belum ada data.{' '}
                            <Link href={isSuperadmin ? '/tpu/create' : '/makam/create'}
                                style={{ color: '#0a0a0a', fontWeight: 500 }}>
                                Tambah sekarang
                            </Link>
                        </p>
                    </div>
                ) : isSuperadmin ? (
                    // Superadmin: tabel TPU
                    <div className="table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Nama TPU</th>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Alamat</th>
                                    <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Blok</th>
                                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>{t.nama}</td>
                                        <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {t.alamat || '—'}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                minWidth: '22px', height: '22px', padding: '0 6px',
                                                background: (t.blok_tpu_count ?? 0) > 0 ? '#0a0a0a' : '#f5f5f5',
                                                color: (t.blok_tpu_count ?? 0) > 0 ? '#fff' : '#9ca3af',
                                                borderRadius: '99px', fontSize: '0.72rem', fontWeight: 600,
                                            }}>
                                                {t.blok_tpu_count ?? 0}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                                            <Link href={`/tpu/${t.id}`} style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none' }}>
                                                Kelola →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Admin: tabel Makam
                    <div className="table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Nama Nisan</th>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>TPU</th>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Tgl Wafat</th>
                                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>
                                            {m.nama_nisan || <span style={{ color: '#9ca3af' }}>(Tanpa Nama)</span>}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>
                                            {m.tpu_nama || '—'}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                            {formatDate(m.tanggal_wafat)}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                                            <Link href={`/makam/${m.id}/edit`} style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none' }}>
                                                Edit →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="fade-in stagger-3" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {isSuperadmin ? (
                    <>
                        <Link href="/tpu/create" className="btn btn-primary btn-sm">+ Tambah TPU</Link>
                        <Link href="/users/create" className="btn btn-secondary btn-sm">+ Tambah Pengguna</Link>
                    </>
                ) : (
                    <Link href="/makam/create" className="btn btn-primary btn-sm">+ Tambah Makam</Link>
                )}
            </div>
        </AdminLayout>
    );
}
