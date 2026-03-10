'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
    id: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    createdAt: string;
    razorpayPaymentId: string | null;
}

interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    targetEntry: string | null;
    attemptNumber: number | null;
    preferredSSBCenter: string | null;
    plan: 'FREE' | 'PRO';
    profileImageUrl: string | null;
    payments: Payment[];
}

interface NotifPrefs {
    loginAlerts: boolean;
    weeklyDigest: boolean;
    promoEmails: boolean;
}

interface ActivityEntry {
    id: string;
    action: string;
    details: string;
    createdAt: string;
}

interface Props {
    user: User;
}

const TARGET_ENTRIES = ['NDA', 'CDS', 'AFCAT', 'TA', 'SSC', 'NCC Special'];
const SSB_CENTERS = ['Allahabad', 'Bhopal', 'Bangalore', 'Mysore', 'Kapurthala', 'Coimbatore', 'Varanasi'];

function isPro(plan: string): boolean {
    if (plan !== 'PRO') return false;
    return true;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
    return (
        <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all
        ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
            {type === 'success' ? '✓ ' : '✗ '}
            {message}
        </div>
    );
}

// ─── Helper: Relative Time ────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Action icon helper ───────────────────────────────────────────────────────

function actionIcon(action: string): { icon: string; color: string } {
    switch (action) {
        case 'LOGIN': return { icon: 'fa-right-to-bracket', color: 'text-green-500 bg-green-50' };
        case 'PROFILE_UPDATE': return { icon: 'fa-user-pen', color: 'text-blue-500 bg-blue-50' };
        case 'PASSWORD_CHANGE': return { icon: 'fa-key', color: 'text-purple-500 bg-purple-50' };
        case 'AVATAR_UPLOAD': return { icon: 'fa-camera', color: 'text-orange-500 bg-orange-50' };
        case 'AVATAR_REMOVE': return { icon: 'fa-image', color: 'text-gray-500 bg-gray-50' };
        case 'GOOGLE_LOGIN': return { icon: 'fa-brands fa-google', color: 'text-red-500 bg-red-50' };
        default: return { icon: 'fa-circle-info', color: 'text-gray-500 bg-gray-50' };
    }
}

// ─── Section: Profile Header (Avatar) ─────────────────────────────────────────

function ProfileHeader({ user, onAvatarChange }: { user: User; onAvatarChange: (url: string | null) => void }) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.profileImageUrl);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        // Validate size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be under 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            setUploading(true);
            try {
                const res = await fetch('/api/account/upload-avatar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 }),
                });
                const data = await res.json();
                if (res.ok) {
                    setAvatarUrl(base64);
                    onAvatarChange(base64);
                    showToast('Avatar updated!', 'success');
                } else {
                    showToast(data.error || 'Upload failed', 'error');
                }
            } catch {
                showToast('Network error', 'error');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    }

    async function handleRemove() {
        setUploading(true);
        try {
            const res = await fetch('/api/account/upload-avatar', { method: 'DELETE' });
            if (res.ok) {
                setAvatarUrl(null);
                onAvatarChange(null);
                showToast('Avatar removed', 'success');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            {toast && <Toast {...toast} />}
            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-orange/20 shadow-lg">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-orange to-orange-400 flex items-center justify-center text-white text-3xl font-bold">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Overlay on hover */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 w-24 h-24 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                    >
                        <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'} text-white text-lg`}></i>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Info + buttons */}
                <div className="text-center sm:text-left flex-1">
                    <h2 className="font-hero font-bold text-2xl text-brand-dark">{user.fullName}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isPro(user.plan) ? 'bg-brand-orange/10 text-brand-orange' : 'bg-gray-100 text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPro(user.plan) ? 'bg-brand-orange' : 'bg-gray-400'}`} />
                            {isPro(user.plan) ? 'PRO' : 'FREE'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2 text-xs font-bold text-brand-dark bg-gray-100 rounded-full hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            <i className="fa-solid fa-upload mr-1.5"></i>
                            {uploading ? 'Uploading…' : 'Upload Photo'}
                        </button>
                        {avatarUrl && (
                            <button
                                onClick={handleRemove}
                                disabled={uploading}
                                className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-all disabled:opacity-50"
                            >
                                <i className="fa-solid fa-trash-can mr-1.5"></i>
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: User }) {
    const [form, setForm] = useState({
        fullName: user.fullName,
        phone: user.phone ?? '',
        targetEntry: user.targetEntry ?? '',
        attemptNumber: user.attemptNumber?.toString() ?? '',
        preferredSSBCenter: user.preferredSSBCenter ?? '',
    });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isPending, startTransition] = useTransition();

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    function handleSave() {
        startTransition(async () => {
            try {
                const res = await fetch('/api/account/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: form.fullName,
                        phone: form.phone || null,
                        targetEntry: form.targetEntry || null,
                        attemptNumber: form.attemptNumber ? Number(form.attemptNumber) : null,
                        preferredSSBCenter: form.preferredSSBCenter || null,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    showToast(data.error || 'Update failed', 'error');
                } else {
                    showToast('Profile saved successfully', 'success');
                }
            } catch {
                showToast('Network error', 'error');
            }
        });
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            {toast && <Toast {...toast} />}
            <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">Personal Details</h3>

            <div className="grid md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Full Name</label>
                    <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Email</label>
                    <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-400 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Phone</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Target Entry</label>
                    <select
                        value={form.targetEntry}
                        onChange={(e) => setForm({ ...form, targetEntry: e.target.value })}
                        className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    >
                        <option value="">Select entry type</option>
                        {TARGET_ENTRIES.map((e) => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Attempt Number</label>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.attemptNumber}
                        onChange={(e) => setForm({ ...form, attemptNumber: e.target.value })}
                        placeholder="1"
                        className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Preferred SSB Center</label>
                    <select
                        value={form.preferredSSBCenter}
                        onChange={(e) => setForm({ ...form, preferredSSBCenter: e.target.value })}
                        className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    >
                        <option value="">Select center</option>
                        {SSB_CENTERS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-8 py-3 bg-brand-orange text-white rounded-full text-sm font-bold font-noname hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {isPending ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

// ─── Section: Account Activity ────────────────────────────────────────────────

function ActivitySection() {
    const [logs, setLogs] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/account/activity')
            .then(res => res.ok ? res.json() : [])
            .then(data => setLogs(data))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">
                <i className="fa-solid fa-clock-rotate-left text-brand-orange mr-2"></i>
                Account Activity
            </h3>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <i className="fa-solid fa-spinner fa-spin text-brand-orange text-xl"></i>
                </div>
            ) : logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => {
                        const { icon, color } = actionIcon(log.action);
                        return (
                            <div key={log.id} className="flex items-start gap-4 p-4 bg-brand-bg rounded-2xl border border-gray-50 hover:border-gray-100 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                    <i className={`fa-solid ${icon} text-sm`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-brand-dark truncate">
                                            {log.action.replace(/_/g, ' ')}
                                        </p>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {timeAgo(log.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Section: Notification Preferences ────────────────────────────────────────

function NotificationsSection() {
    const [prefs, setPrefs] = useState<NotifPrefs>({ loginAlerts: true, weeklyDigest: true, promoEmails: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/account/notifications')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data) setPrefs(data); })
            .catch(() => null)
            .finally(() => setLoading(false));
    }, []);

    async function toggle(key: keyof NotifPrefs) {
        const newValue = !prefs[key];
        setPrefs(prev => ({ ...prev, [key]: newValue }));
        setSaving(key);
        try {
            await fetch('/api/account/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newValue }),
            });
        } catch {
            // Revert on error
            setPrefs(prev => ({ ...prev, [key]: !newValue }));
        } finally {
            setSaving(null);
        }
    }

    const toggles: { key: keyof NotifPrefs; label: string; desc: string; icon: string }[] = [
        { key: 'loginAlerts', label: 'Login Alerts', desc: 'Get notified when a new device signs in', icon: 'fa-shield-halved' },
        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive weekly progress summary and tips', icon: 'fa-envelope' },
        { key: 'promoEmails', label: 'Promotional Emails', desc: 'Updates about new features and offers', icon: 'fa-gift' },
    ];

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">
                <i className="fa-solid fa-bell text-brand-orange mr-2"></i>
                Notification Preferences
            </h3>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <i className="fa-solid fa-spinner fa-spin text-brand-orange text-xl"></i>
                </div>
            ) : (
                <div className="space-y-4">
                    {toggles.map(({ key, label, desc, icon }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                                    <i className={`fa-solid ${icon} text-sm`}></i>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-brand-dark">{label}</p>
                                    <p className="text-xs text-gray-500">{desc}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle(key)}
                                disabled={saving === key}
                                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${prefs[key] ? 'bg-brand-orange' : 'bg-gray-200'} disabled:opacity-50`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${prefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Section: Subscription ────────────────────────────────────────────────────

function SubscriptionSection({ user }: { user: User }) {
    const proActive = isPro(user.plan);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">Subscription</h3>

            <div className="flex flex-wrap items-center gap-4 mb-6">
                <span
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold
            ${proActive ? 'bg-brand-orange/10 text-brand-orange' : 'bg-gray-100 text-gray-500'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${proActive ? 'bg-brand-orange' : 'bg-gray-400'}`} />
                    {proActive ? 'PRO Active (Lifetime)' : 'FREE Plan'}
                </span>
            </div>

            {!proActive && (
                <a
                    href="/pricing"
                    className="inline-block px-8 py-3 bg-brand-orange text-white rounded-full text-sm font-bold font-noname hover:opacity-90 transition-all mb-6"
                >
                    Upgrade to PRO — ₹99
                </a>
            )}


        </div>
    );
}

// ─── Section: Payment History ─────────────────────────────────────────────────

function PaymentHistorySection({ payments }: { payments: Payment[] }) {
    const statusStyle = {
        SUCCESS: 'bg-green-50 text-green-700',
        FAILED: 'bg-red-50 text-red-600',
        PENDING: 'bg-yellow-50 text-yellow-700',
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">Payment History</h3>

            {payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No payments yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left text-[10px] font-bold text-gray-400 uppercase pb-3">Date</th>
                                <th className="text-left text-[10px] font-bold text-gray-400 uppercase pb-3">Amount</th>
                                <th className="text-left text-[10px] font-bold text-gray-400 uppercase pb-3">Status</th>
                                <th className="text-left text-[10px] font-bold text-gray-400 uppercase pb-3">Payment ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td className="py-4 text-brand-dark">
                                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="py-4 font-semibold text-brand-dark">
                                        ₹{(p.amount / 100).toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle[p.status]}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-400 text-xs font-mono">
                                        {p.razorpayPaymentId ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection() {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Change password
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwToast, setPwToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isPwPending, startPw] = useTransition();

    // Delete account
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, startDelete] = useTransition();

    function showPwToast(message: string, type: 'success' | 'error') {
        setPwToast({ message, type });
        setTimeout(() => setPwToast(null), 3500);
    }

    function handleChangePassword() {
        if (pwForm.next !== pwForm.confirm) {
            showPwToast('New passwords do not match', 'error');
            return;
        }
        if (pwForm.next.length < 8) {
            showPwToast('Password must be at least 8 characters', 'error');
            return;
        }
        startPw(async () => {
            const res = await fetch('/api/account/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
            });
            const data = await res.json();
            if (!res.ok) {
                showPwToast(data.error || 'Failed', 'error');
            } else {
                showPwToast('Password changed successfully', 'success');
                setPwForm({ current: '', next: '', confirm: '' });
            }
        });
    }

    function handleLogoutAll() {
        startPw(async () => {
            await fetch('/api/account/logout-all', { method: 'POST' });
            router.push('/auth');
        });
    }

    function handleDeleteAccount() {
        setDeleteError('');
        startDelete(async () => {
            const res = await fetch('/api/account/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || 'Deletion failed');
            } else {
                router.push('/');
            }
        });
    }

    return (
        <>
            {pwToast && <Toast {...pwToast} />}

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-hero font-bold text-xl text-brand-dark mb-6">Security</h3>

                {/* Change password */}
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-brand-dark mb-4">Change Password</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { label: 'Current Password', key: 'current' as const },
                            { label: 'New Password', key: 'next' as const },
                            { label: 'Confirm New Password', key: 'confirm' as const },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">{label}</label>
                                <input
                                    type="password"
                                    value={pwForm[key]}
                                    onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                                    className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleChangePassword}
                            disabled={isPwPending}
                            className="px-6 py-3 bg-brand-dark text-white rounded-full text-sm font-bold font-noname hover:opacity-80 transition-all disabled:opacity-50"
                        >
                            {isPwPending ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </div>

                {/* Danger zone */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                    <h4 className="text-sm font-bold text-red-600">Danger Zone</h4>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-red-50/50 rounded-3xl border border-red-100">
                        <div>
                            <p className="text-sm font-semibold text-brand-dark">Logout All Sessions</p>
                            <p className="text-xs text-gray-500 mt-0.5">Invalidate your session on this and all other devices.</p>
                        </div>
                        <button
                            onClick={handleLogoutAll}
                            className="px-6 py-3 border-2 border-brand-dark rounded-full text-xs font-bold font-noname hover:bg-brand-dark hover:text-white transition-all whitespace-nowrap"
                        >
                            Logout All
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-red-50/50 rounded-3xl border border-red-100">
                        <div>
                            <p className="text-sm font-semibold text-brand-dark">Delete Account</p>
                            <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-6 py-3 border-2 border-red-500 text-red-500 rounded-full text-xs font-bold font-noname hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                        <h4 className="font-hero font-bold text-xl text-brand-dark mb-2">Delete Account?</h4>
                        <p className="text-sm text-gray-500 mb-6">
                            This will permanently delete your account and all payment records. Enter your password to confirm.
                        </p>

                        <input
                            type="password"
                            placeholder="Your password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full p-4 bg-brand-bg rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 mb-3"
                        />

                        {deleteError && (
                            <p className="text-xs text-red-500 mb-4">{deleteError}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                                className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-full text-sm font-bold font-noname hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || !deletePassword}
                                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-full text-sm font-bold font-noname hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function AccountClient({ user }: Props) {
    const [, setAvatarVersion] = useState(0);

    return (
        <div className="space-y-8">
            <ProfileHeader user={user} onAvatarChange={() => setAvatarVersion(v => v + 1)} />
            <ProfileSection user={user} />
            <ActivitySection />
            <NotificationsSection />
            <SubscriptionSection user={user} />
            <PaymentHistorySection payments={user.payments} />
            <SecuritySection />
        </div>
    );
}
