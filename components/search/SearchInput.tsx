'use client';

import { forwardRef } from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    onFocus?: () => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
    {
        value,
        onChange,
        placeholder = 'Search tests, tools or pages...',
        className = '',
        inputClassName = '',
        onFocus,
        onKeyDown,
    },
    ref
) {
    return (
        <div
            className={`flex items-center gap-2 w-full rounded-full border border-gray-200 bg-white/95 shadow-sm px-3 py-2 transition-all duration-300 focus-within:border-brand-orange/60 focus-within:shadow-[0_0_0_3px_rgba(255,94,58,0.12)] ${className}`}
        >
            <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm" />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={`w-full bg-transparent text-sm text-brand-dark placeholder:text-gray-400 outline-none ${inputClassName}`}
                aria-label="Search LakshyaSSB"
            />
        </div>
    );
});

export default SearchInput;