import { useEffect } from 'react';

const REVEAL_SELECTOR = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

/**
 * Adds `.active` to `.reveal*` elements once they scroll into view.
 *
 * This matters more than a typical animation helper: `app/globals.css` sets
 * `opacity: 0` on `.reveal*` and only `.active` brings it back. An element this
 * hook fails to observe is not un-animated — it is **invisible**.
 *
 * That is exactly how the Current Affairs page lost its news. The page called
 * `useScrollReveal([news.length])` and the card grid container itself carries
 * `.reveal`. Selecting a category with no matches unmounted that grid; selecting
 * "All" again mounted a *brand new* node with no `.active` class. Because
 * `news.length` had not changed, the effect never re-ran, the new node was never
 * observed, and the whole news grid stayed at `opacity: 0` — the user saw their
 * articles vanish.
 *
 * Fixed by not relying on the dependency array for correctness:
 *
 *  - every `.reveal*` element currently in the document is observed on mount, and
 *  - a MutationObserver re-scans when elements are added later, so remounts,
 *    async data, filtering and pagination are all covered.
 *
 * `deps` is still honoured for callers that want an explicit re-scan, but the
 * hook is now correct even when it is empty or wrong.
 */
export default function useScrollReveal(deps: any[] = []) {
    useEffect(() => {
        // Elements already revealed are never re-observed, so the animation does
        // not replay and the observer set stays small.
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 },
        );

        const observeAll = () => {
            document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
                if (!el.classList.contains('active')) observer.observe(el);
            });
        };

        observeAll();

        // Coalesce bursts of mutations into one scan per frame. Without this a
        // large list render would trigger a full-document query per inserted node.
        let frame = 0;
        const scheduleScan = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                observeAll();
            });
        };

        const mutationObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        scheduleScan();
                        return;
                    }
                }
            }
        });

        mutationObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            if (frame) cancelAnimationFrame(frame);
            mutationObserver.disconnect();
            // disconnect() drops every observation at once. The previous cleanup
            // iterated a stale NodeList captured at effect time, so elements added
            // afterwards were never unobserved.
            observer.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
