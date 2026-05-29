import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { usePage } from '@inertiajs/react';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="admin-layout">
            <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            <main className="main-content">
                <header className="topbar">
                    <button 
                        className="sidebar-toggle" 
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Buka menu navigasi"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <h2 className="topbar-title">{title ?? 'Dashboard'}</h2>
                </header>

                <div className="page-container">
                    {flash?.success && (
                        <div className="alert-success fade-in" role="alert">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="alert-error fade-in" role="alert">
                            {flash.error}
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
