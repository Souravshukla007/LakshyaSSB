'use client';

import React from 'react';

interface CategoryFilterProps {
    categories: string[];
    selectedCategory: string;
    onSelect: (cat: string) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
    // role="group" + aria-pressed so the selected filter is announced. Previously
    // the active state was conveyed by colour alone, which is invisible to screen
    // readers and fails WCAG 1.4.1 (use of colour).
    return (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter news by category">
            {categories.map((cat) => (
                <button
                    key={cat}
                    type="button"
                    onClick={() => onSelect(cat)}
                    aria-pressed={selectedCategory === cat}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold font-hero transition-all duration-300 ${
                        selectedCategory === cat
                            ? 'bg-brand-orange text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-orange hover:text-brand-orange'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
