'use client';

import React, { useEffect } from 'react';

interface ApkDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApkDownloadModal({ isOpen, onClose }: ApkDownloadModalProps) {
    // Configurable info for the APK
    const apkVersion = "1.0.0";
    const apkSize = "18.5 MB";
    const lastUpdated = "Oct 25, 2026";
    // Assuming the APK is placed in the public/downloads folder
    const apkDownloadUrl = "/downloads/LakshyaSSB_v1.0.0.apk";

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Lock background scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content container */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-gray-100">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-brand-dark transition-colors z-10"
                    aria-label="Close modal"
                >
                    <i className="fa-solid fa-xmark" />
                </button>

                {/* Decorative Banner/Header */}
                <div className="relative w-full h-32 bg-brand-bg flex items-center justify-center overflow-hidden">
                    {/* Glowing effect */}
                    <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-brand-orange/20 blur-3xl rounded-full mix-blend-multiply opacity-50"></div>

                    {/* Icon container */}
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-brand-orange text-3xl">
                        <i className="fa-brands fa-android"></i>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 md:p-8 text-center pt-8">

                    <h3 className="text-2xl font-hero font-bold tracking-tight text-brand-dark mb-2" id="modal-title">
                        Get Lakshya SSB for Android
                    </h3>
                    <p className="text-gray-500 font-noname text-sm mb-6 max-w-[280px] mx-auto">
                        Experience faster load times, seamless navigation, and daily practice without opening your browser.
                    </p>

                    {/* App Metadata Card */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex justify-between items-center text-xs font-bold text-gray-500">
                        <div className="text-center flex-1 border-r border-gray-200 last:border-0 pl-1 pr-1">
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Version</div>
                            <div className="text-brand-dark">v{apkVersion}</div>
                        </div>
                        <div className="text-center flex-1 border-r border-gray-200 last:border-0 pl-1 pr-1">
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Size</div>
                            <div className="text-brand-dark">{apkSize}</div>
                        </div>
                        <div className="text-center flex-1 last:border-0 pl-1 pr-1">
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Updated</div>
                            <div className="text-brand-dark">{lastUpdated}</div>
                        </div>
                    </div>

                    {/* Installation Steps */}
                    <div className="text-left mb-8 space-y-4">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Installation Guide</h4>

                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 shrink-0 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] flex items-center justify-center font-bold relative z-10">1</div>
                            <div className="text-sm text-gray-600 font-medium pt-0.5">Click download and wait for the APK file to finish downloading.</div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 shrink-0 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] flex items-center justify-center font-bold relative z-10">2</div>
                            <div className="text-sm text-gray-600 font-medium pt-0.5">Open the downloaded file. Chrome/Android may ask you to <strong>Allow installation from this source</strong>. Allow it.</div>
                        </div>

                        <div className="flex gap-4 items-start pb-2">
                            <div className="w-6 h-6 shrink-0 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] flex items-center justify-center font-bold relative z-10">3</div>
                            <div className="text-sm text-gray-600 font-medium pt-0.5">Install the app and open it to begin your journey.</div>
                        </div>
                    </div>

                    {/* Download Action */}
                    <div className="pt-2">
                        <a
                            href={apkDownloadUrl}
                            download
                            onClick={onClose}
                            className="w-full relative group bg-brand-dark text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-xl hover:bg-brand-orange transition-all duration-300"
                        >
                            {/* Shiny sweep effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />

                            <i className="fa-solid fa-download text-lg relative z-10" />
                            <span className="relative z-10 tracking-wide">Download APK File</span>
                        </a>
                        <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-wider font-bold flex items-center justify-center gap-1.5">
                            <i className="fa-solid fa-shield-check text-green-500" />
                            100% Safe & Secure Installation
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
