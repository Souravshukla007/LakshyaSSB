'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import notificationsData from '@/data/notifications.json';

interface Notification {
    id: string | number;
    title: string;
    description: string;
    link: string;
    icon: string;
    isNew: boolean;
    category?: 'ca' | 'platform' | 'mission';
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [missionReady, setMissionReady] = useState(false);
    const [caNotifications, setCaNotifications] = useState<Notification[]>([]);
    const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const staticNotifications: Notification[] = (notificationsData as Notification[]);

    // Fetch user-specific notifications from DB
    useEffect(() => {
        fetch('/api/notifications')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.success && Array.isArray(data.data)) {
                    const mapped: Notification[] = data.data.map((n: any) => ({
                        id: n.id,
                        title: n.title,
                        description: n.message,
                        link: n.link || '/dashboard',
                        icon: n.type === 'medal' ? 'fa-medal' : 'fa-bell',
                        isNew: !n.isRead,
                        category: 'platform' as const,
                    }));
                    setUserNotifications(mapped);
                }
            })
            .catch(() => null);
    }, []);

    // Fetch latest current affairs
    useEffect(() => {
        fetch('/api/current-affairs')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.success && Array.isArray(data.data)) {
                    const mapped: Notification[] = data.data.slice(0, 3).map((item: any, idx: number) => ({
                        id: `ca_${item.date}_${idx}`,
                        title: item.title,
                        description: item.summary?.slice(0, 80) + '…',
                        link: '/current-affairs',
                        icon: 'fa-newspaper',
                        isNew: true,
                        category: 'ca' as const,
                    }));
                    setCaNotifications(mapped);
                }
            })
            .catch(() => null);
    }, []);

    // Fetch daily mission state
    useEffect(() => {
        fetch('/api/streak/status')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.authenticated && data?.completedToday === false) {
                    setMissionReady(true);
                }
            })
            .catch(() => null);
    }, []);

    const missionNotification: Notification = {
        id: 999999,
        title: 'Daily Mission Ready',
        description: '🔥 Your LakshyaSSB daily mission is ready.',
        link: '/#daily-practice',
        icon: 'fa-fire',
        isNew: true,
        category: 'mission',
    };

    const visibleNotifications: Notification[] = [
        ...(missionReady ? [missionNotification] : []),
        ...userNotifications,
        ...caNotifications,
        ...staticNotifications,
    ];

    // Update unread count
    useEffect(() => {
        setUnreadCount(visibleNotifications.filter(n => n.isNew).length);
    }, [visibleNotifications]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (newIsOpen && unreadCount > 0) {
            const unreadIds = visibleNotifications.filter(n => n.isNew && typeof n.id === 'string').map(n => n.id);
            if (unreadIds.length > 0) {
                fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: unreadIds })
                }).catch(() => null);
            }
            setUnreadCount(0);
        }
    };

    const caItems = visibleNotifications.filter(n => n.category === 'ca');
    const otherItems = visibleNotifications.filter(n => n.category !== 'ca');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group
                    ${isOpen ? 'bg-orange-50 text-brand-orange border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} 
                    border shadow-sm hover:shadow-md`}
                aria-label="Notifications"
            >
                <i className={`fa-solid fa-bell text-sm transition-transform duration-300 ${isOpen ? 'rotate-12 scale-110' : 'group-hover:rotate-12 group-hover:scale-110'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-full w-full bg-[#FF6A1A] text-white text-[9px] font-bold border border-white flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <div className={`absolute top-full right-0 mt-3 w-80 sm:w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 transform origin-top-right transition-all duration-300 z-[100] ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2 pointer-events-none'}`}>
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-sm font-bold text-brand-dark">Updates</h3>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5 tracking-wide">Latest achievements & news</p>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {visibleNotifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-48">
                            <i className="fa-solid fa-box-open text-gray-300 text-3xl mb-3" />
                            <p className="text-sm text-gray-500 font-medium">No new updates right now.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {otherItems.map((notification, index) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    isLast={index === otherItems.length - 1 && caItems.length === 0}
                                    onClose={() => setIsOpen(false)}
                                />
                            ))}
                            {caItems.length > 0 && (
                                <>
                                    <div className="px-5 py-2.5 bg-orange-50/60 border-b border-orange-100/50 flex items-center gap-2">
                                        <i className="fa-solid fa-newspaper text-brand-orange text-[10px]" />
                                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Current Affairs</span>
                                    </div>
                                    {caItems.map((notification, index) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            isLast={index === caItems.length - 1}
                                            onClose={() => setIsOpen(false)}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NotificationItem({ notification, isLast, onClose }: {
    notification: Notification;
    isLast: boolean;
    onClose: () => void;
}) {
    return (
        <Link
            href={notification.link}
            onClick={onClose}
            className={`group flex items-start gap-4 p-5 hover:bg-orange-50/30 transition-colors ${!isLast ? 'border-b border-gray-50' : ''}`}
        >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-100/50 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300 shadow-sm">
                <i className={`fa-solid ${notification.icon} text-sm`} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-orange transition-colors truncate">{notification.title}</h4>
                    {notification.isNew && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-brand-orange bg-orange-100 uppercase rounded-md shadow-sm">New</span>
                    )}
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed font-medium line-clamp-2 pr-2">{notification.description}</p>
            </div>
        </Link>
    );
}
