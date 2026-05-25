import React from 'react';
import Sidebar from '../components/Sidebar';
import { usePage } from '@inertiajs/react';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="main-content">
                <header className="topbar">
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
