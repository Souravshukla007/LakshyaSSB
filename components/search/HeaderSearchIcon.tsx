'use client';

interface HeaderSearchIconProps {
    onClick: () => void;
}

export default function HeaderSearchIcon({ onClick }: HeaderSearchIconProps) {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-600 hover:text-brand-orange hover:bg-orange-50 transition-all duration-300 shadow-sm hover:shadow-md"
            aria-label="Open search"
        >
            <i className="fa-solid fa-magnifying-glass text-sm" />
        </button>
    );
}
