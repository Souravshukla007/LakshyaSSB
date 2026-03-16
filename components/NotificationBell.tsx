'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import notificationsData from '@/data/notifications.json';

interface Notification {
    id: number;
    title: string;
    description: string;
    link: string;
    icon: string;
    isNew: boolean;
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [missionReady, setMissionReady] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const notifications: Notification[] = notificationsData;
    const visibleNotifications: Notification[] = missionReady
        ? [
            {
                id: 999999,
                title: 'Daily Mission Ready',
                description: '🔥 Your LakshyaSSB daily mission is ready.',
                link: '/#daily-practice',
                icon: 'fa-fire',
                isNew: true,
            },
            ...notifications,
        ]
        : notifications;

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

    // Initialize unread count from localStorage on mount
    useEffect(() => {
        const fetchReadState = () => {
            try {
                const readState = localStorage.getItem('lakshya_notifications_read');
                if (readState) {
                    const readIds: number[] = JSON.parse(readState);
                    const unread = visibleNotifications.filter(n => !readIds.includes(n.id)).length;
                    setUnreadCount(unread);
                } else {
                    // All are unread if no state exists
                    setUnreadCount(visibleNotifications.length);
                }
            } catch (error) {
                console.error("Failed to parse notifications read state", error);
            }
        };

        fetchReadState();
        
        // Listen for storage events in case another tab marks them read
        window.addEventListener('storage', fetchReadState);
        return () => window.removeEventListener('storage', fetchReadState);
    }, [visibleNotifications]);

    // Close logic when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark all as read when opened
    const handleToggle = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);

        if (newIsOpen && unreadCount > 0) {
            try {
                const allIds = visibleNotifications.map(n => n.id);
                localStorage.setItem('lakshya_notifications_read', JSON.stringify(allIds));
                setUnreadCount(0);
                
                // Dispatch storage event manually for same-tab sync if needed
                window.dispatchEvent(new Event('storage'));
            } catch (error) {
                console.error("Failed to save notifications read state", error);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group
                    ${isOpen ? 'bg-orange-50 text-brand-orange border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} 
                    border shadow-sm hover:shadow-md`}
                aria-label="Notifications"
            >
                <i className={`fa-solid fa-bell text-sm transition-transform duration-300 ${isOpen ? 'rotate-12 scale-110' : 'group-hover:rotate-12 group-hover:scale-110'}`} />
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-full w-full bg-[#FF6A1A] text-white text-[9px] font-bold border border-white flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <div className={`absolute top-full right-0 mt-3 w-80 sm:w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 transform origin-top-right transition-all duration-300 z-[100] ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2 pointer-events-none'}`}>
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-sm font-bold text-brand-dark">Updates</h3>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5 tracking-wide">Latest improvements on LakshyaSSB</p>
                    </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {visibleNotifications.length > 0 ? (
                        <div className="flex flex-col">
                            {visibleNotifications.map((notification, index) => (
                                <Link 
                                    key={notification.id} 
                                    href={notification.link}
                                    onClick={() => setIsOpen(false)}
                                    className={`group flex items-start gap-4 p-5 hover:bg-orange-50/30 transition-colors ${index !== visibleNotifications.length - 1 ? 'border-b border-gray-50' : ''}`}
                                >
                                    {/* Icon Container */}
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-100/50 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300 shadow-sm dropdown-icon">
                                        <i className={`fa-solid ${notification.icon} text-sm`} />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-2 mb-1 border-gray-100">
                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-orange transition-colors truncate">{notification.title}</h4>
                                            {notification.isNew && (
                                                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-brand-orange bg-orange-100 uppercase rounded-md shadow-sm">New</span>
                                            )}
                                        </div>
                                        <p className="text-[13px] text-gray-500 leading-relaxed font-medium line-clamp-2 pr-2">{notification.description}</p>
                                        
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-brand-orange group-hover:text-orange-600 group-hover:pl-0.5 transition-all w-fit">
                                            View Details <i className="fa-solid fa-arrow-right text-[10px]" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-48">
                            <i className="fa-solid fa-box-open text-gray-300 text-3xl mb-3" />
                            <p className="text-sm text-gray-500 font-medium">No new updates right now.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
