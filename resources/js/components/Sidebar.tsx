import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface NavItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    active?: boolean;
}

function NavItem({ href, label, icon, active }: NavItemProps) {
    return (
        <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
            {icon}
            <span>{label}</span>
        </Link>
    );
}

// ── SVG Icons ─────────────────────────────────────────────────
const IconDashboard = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
);

const IconMap = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
);

const IconGrave = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 1 5 5v7H7V7a5 5 0 0 1 5-5z"/><line x1="7" y1="14" x2="17" y2="14"/>
        <line x1="9" y1="19" x2="15" y2="19"/><line x1="12" y1="14" x2="12" y2="22"/>
    </svg>
);

const IconLayers = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
    </svg>
);

const IconUsers = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const IconLogout = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

export default function Sidebar({ isOpen, setIsSidebarOpen }: { isOpen?: boolean; setIsSidebarOpen?: (open: boolean) => void }) {
    const { auth, url } = usePage<{ auth: { user: AuthUser }; url: string }>().props;
    const user = auth?.user;
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';

    const initials = user?.name
        ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    function handleLogout() {
        router.post('/logout');
    }

    const isActive = (path: string) => currentUrl === path || currentUrl.startsWith(path + '/');

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Brand */}
            <div className="sidebar-brand">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1>GoNgelayat</h1>
                        <p>Panel Admin</p>
                    </div>
                    {setIsSidebarOpen && (
                        <button 
                            className="sidebar-close-btn" 
                            onClick={() => setIsSidebarOpen(false)}
                            aria-label="Tutup menu navigasi"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Menu</div>

                <NavItem
                    href="/dashboard"
                    label="Dashboard"
                    icon={<IconDashboard />}
                    active={isActive('/dashboard')}
                />

                {/* Kelola Makam — hanya admin */}
                {user?.role === 'admin' && (
                    <NavItem
                        href="/makam"
                        label="Kelola Makam"
                        icon={<IconGrave />}
                        active={isActive('/makam')}
                    />
                )}

                {/* Hanya superadmin */}
                {user?.role === 'superadmin' && (
                    <>
                        <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>Superadmin</div>

                        <NavItem
                            href="/tpu"
                            label="Kelola TPU"
                            icon={<IconMap />}
                            active={isActive('/tpu')}
                        />

                        <NavItem
                            href="/users"
                            label="Pengguna"
                            icon={<IconUsers />}
                            active={isActive('/users')}
                        />
                    </>
                )}
            </nav>

            {/* Footer: user info + logout */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name ?? '—'}</div>
                        <div className="sidebar-user-role">{user?.role}</div>
                    </div>
                </div>

                <button
                    className="nav-item"
                    style={{ marginTop: '0.25rem', width: '100%' }}
                    onClick={handleLogout}
                    id="btn-logout"
                >
                    <IconLogout />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}
