'use client';

import SearchInput from './SearchInput';
import SearchResultList from './SearchResultList';
import type { SearchItem } from '@/data/searchItems';

interface SearchOverlayProps {
    isOpen: boolean;
    query: string;
    onQueryChange: (value: string) => void;
    results: SearchItem[];
    activeIndex: number;
    onHoverIndex: (index: number) => void;
    onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onSelectItem: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SearchOverlay({
    isOpen,
    query,
    onQueryChange,
    results,
    activeIndex,
    onHoverIndex,
    onInputKeyDown,
    onClose,
    onSelectItem,
    inputRef,
}: SearchOverlayProps) {
    return (
        <div
            className={`fixed inset-0 z-[140] transition-all duration-150 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isOpen}
        >
            <button
                onClick={onClose}
                className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
                aria-label="Close search"
            />

            <div className="absolute left-1/2 top-[86px] md:top-[98px] -translate-x-1/2 w-full px-3 md:px-0 md:w-[650px]">
                <div
                    className={`bg-brand-bg/95 rounded-3xl border border-gray-200/70 shadow-soft p-3 md:p-4 transition-all duration-150 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-1'}`}
                >
                    <SearchInput
                        ref={inputRef}
                        value={query}
                        onChange={onQueryChange}
                        onKeyDown={onInputKeyDown}
                        className="h-12 md:h-14 px-4"
                        inputClassName="text-sm md:text-base"
                        placeholder="Search tests, tools or pages..."
                    />

                    <div className="mt-3">
                        <SearchResultList
                            items={results}
                            activeIndex={activeIndex}
                            onHoverIndex={onHoverIndex}
                            onSelectItem={onSelectItem}
                            emptyMessage="No pages found for your search."
                        />
                    </div>

                    <div className="mt-2 px-2 hidden md:flex items-center justify-between text-[11px] text-gray-500">
                        <span>Use ↑ ↓ to navigate</span>
                        <span>Enter to open · Esc to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
