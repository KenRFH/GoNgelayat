import React from 'react';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    animationClass?: string;
}

export default function StatCard({ label, value, icon, animationClass = '' }: StatCardProps) {
    return (
        <div className={`stat-card fade-in ${animationClass}`}>
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value}</div>
        </div>
    );
}
