'use client';

import SearchResultItem from './SearchResultItem';
import type { SearchItem } from '@/data/searchItems';

interface SearchResultListProps {
    items: SearchItem[];
    activeIndex: number;
    onSelectItem: () => void;
    onHoverIndex: (index: number) => void;
    emptyMessage?: string;
}

export default function SearchResultList({
    items,
    activeIndex,
    onSelectItem,
    onHoverIndex,
    emptyMessage = 'No matching results found.',
}: SearchResultListProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto p-2">
                {items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item, index) => (
                            <SearchResultItem
                                key={`${item.link}-${item.title}`}
                                item={item}
                                isActive={index === activeIndex}
                                onHover={() => onHoverIndex(index)}
                                onSelect={onSelectItem}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center">
                        <i className="fa-solid fa-magnifying-glass text-gray-300 text-xl" />
                        <p className="text-sm text-gray-500 mt-2 font-medium">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
