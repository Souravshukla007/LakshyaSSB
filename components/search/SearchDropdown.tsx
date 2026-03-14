    'use client';

import type { SearchItem } from '@/data/searchItems';
import SearchResultList from './SearchResultList';

interface SearchDropdownProps {
    items: SearchItem[];
    isOpen: boolean;
    onSelectItem?: () => void;
    emptyMessage?: string;
    className?: string;
}

export default function SearchDropdown({
    items,
    isOpen,
    onSelectItem,
    emptyMessage = 'No matching results found.',
    className = '',
}: SearchDropdownProps) {
    return (
        <div
            className={`absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 overflow-hidden transform origin-top transition-all duration-200 z-[120] ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-[0.98] pointer-events-none'} ${className}`}
        >
            <SearchResultList
                items={items}
                activeIndex={0}
                onHoverIndex={() => null}
                onSelectItem={() => onSelectItem?.()}
                emptyMessage={emptyMessage}
            />
        </div>
    );
}