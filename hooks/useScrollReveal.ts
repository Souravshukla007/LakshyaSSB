import { useEffect } from 'react';

export default function useScrollReveal(deps: any[] = []) {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        elements.forEach(el => {
            if (!el.classList.contains('active')) {
                observer.observe(el);
            }
        });

        return () => {
            elements.forEach(el => observer.unobserve(el));
            observer.disconnect();
        };
    }, deps);
}
