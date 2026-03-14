'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchItems } from '@/data/searchItems';
import HeaderSearchIcon from './HeaderSearchIcon';
import SearchOverlay from './SearchOverlay';

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export default function HeaderSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    const normalizedQuery = query.trim().toLowerCase();
    const results = useMemo(() => {
        if (!normalizedQuery) return searchItems;
        return searchItems.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
    }, [normalizedQuery]);

    const openSearch = () => {
        setIsOpen(true);
        setActiveIndex(0);
        window.setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const closeSearch = () => {
        setIsOpen(false);
        setQuery('');
        setActiveIndex(0);
    };

    const selectActiveResult = () => {
        if (results.length === 0) return;
        const item = results[Math.max(0, Math.min(activeIndex, results.length - 1))];
        closeSearch();
        router.push(item.link);
    };

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
            const isSlash = e.key === '/';

            if ((isCtrlK || isSlash) && !isTypingTarget(e.target)) {
                e.preventDefault();
                openSearch();
            }

            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                closeSearch();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [normalizedQuery]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (results.length > 0) {
                setActiveIndex((prev) => (prev + 1) % results.length);
            }
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (results.length > 0) {
                setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            selectActiveResult();
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            closeSearch();
        }
    };

    return (
        <>
            <HeaderSearchIcon onClick={openSearch} />

            <SearchOverlay
                isOpen={isOpen}
                query={query}
                onQueryChange={setQuery}
                results={results}
                activeIndex={activeIndex}
                onHoverIndex={setActiveIndex}
                onInputKeyDown={handleInputKeyDown}
                onClose={closeSearch}
                onSelectItem={closeSearch}
                inputRef={inputRef}
            />
        </>
    );
}