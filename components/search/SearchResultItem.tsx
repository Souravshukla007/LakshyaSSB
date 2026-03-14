'use client';

import Link from 'next/link';
import type { SearchItem } from '@/data/searchItems';

interface SearchResultItemProps {
    item: SearchItem;
    onSelect?: () => void;
    isActive?: boolean;
    onHover?: () => void;
}

export default function SearchResultItem({ item, onSelect, isActive = false, onHover }: SearchResultItemProps) {
    return (
        <Link
            href={item.link}
            onClick={onSelect}
            onMouseEnter={onHover}
            className={`group flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive ? 'bg-orange-50/80 ring-1 ring-orange-100' : 'hover:bg-orange-50/70'}`}
        >
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200 ${isActive ? 'bg-brand-orange text-white border-brand-orange' : 'bg-orange-50 text-brand-orange border-orange-100 group-hover:bg-brand-orange group-hover:text-white'}`}>
                <i className={`fa-solid ${item.icon || 'fa-compass'} text-sm`} />
            </div>

            <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-brand-orange' : 'text-brand-dark group-hover:text-brand-orange'}`}>
                    {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.category}</p>
            </div>
        </Link>
    );
}