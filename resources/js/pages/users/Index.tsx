import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface Props {
    users: UserItem[];
    auth: { user: { id: number; role: string } };
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ConfirmModal({ item, onCancel, onConfirm }: { item: UserItem; onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Hapus Pengguna</h3>
                <p className="modal-desc">Yakin ingin menghapus akun <strong>{item.name}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>Batal</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm} id="btn-confirm-delete-user">Hapus</button>
                </div>
            </div>
        </div>
    );
}

export default function UsersIndex({ users, auth }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/users/${deleteTarget.id}`);
        setDeleteTarget(null);
    }

    return (
        <AdminLayout title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna — GoNgelayat" />

            <div className="section-header fade-in">
                <h2 className="section-title">Daftar Admin &amp; Superadmin</h2>
                <Link href="/users/create" className="btn btn-primary btn-sm" id="btn-tambah-user">
                    + Tambah Pengguna
                </Link>
            </div>

            <div className="table-wrapper fade-in stagger-1">
                {users.length === 0 ? (
                    <div className="empty-state">
                        <p>Belum ada pengguna terdaftar.</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nama</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Bergabung</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <tr key={user.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '0.8rem', width: '40px' }}>{i + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                                        {user.id === auth.user.id && (
                                            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Anda</span>
                                        )}
                                    </td>
                                    <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{user.email}</td>
                                    <td>
                                        <span className={`badge badge-${user.role}`}>{user.role}</span>
                                    </td>
                                    <td style={{ color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatDate(user.created_at)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/users/${user.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setDeleteTarget(user)}
                                                disabled={user.id === auth.user.id}
                                                title={user.id === auth.user.id ? 'Tidak bisa hapus akun sendiri' : ''}
                                                id={`btn-delete-user-${user.id}`}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {deleteTarget && (
                <ConfirmModal
                    item={deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </AdminLayout>
    );
}
