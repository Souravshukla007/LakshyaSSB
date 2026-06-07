/**
 * lib/ssb-enhancer.ts
 * Pure-logic SSB enhancement — NO AI, NO external API calls.
 * Takes a news title + description and produces SSB-ready fields.
 */

export interface SSBEnhancement {
    summary: string;
    gd_topic: string;
    lecturette: string;
    ssb_importance: string;
    interview_question: string;
}

// ── Category Detection ─────────────────────────────────────────────────────────

const CATEGORY_RULES: { category: string; keywords: RegExp }[] = [
    {
        category: 'Defence',
        keywords: /missile|navy|army|air force|drdo|military|weapon|soldier|iaf|warship|fighter|tank|combat|ceasefire|armed forces|defence|defense|nuclear|warhead|border clash|surgical strike/i,
    },
    {
        category: 'Science',
        keywords: /isro|space|satellite|science|research|technology|quantum|ai |artificial intelligence|innovation|launch vehicle|rocket|chandrayaan|gaganyaan/i,
    },
    {
        category: 'Economy',
        keywords: /economy|gdp|inflation|rupee|rbi|budget|trade|finance|market|export|import|fiscal|interest rate|forex|stock|sensex|nifty/i,
    },
    {
        category: 'International',
        keywords: /china|pakistan|russia|us |usa|nato|international|global|foreign|trump|ukraine|israel|iran|taiwan|geopolitics|un |united nations|bilateral|summit|treaty|sanctions/i,
    },
];

/**
 * Detect category from title text using keyword matching.
 * Defaults to 'India' if no specific category matches.
 */
export function getCategory(title: string): string {
    const text = title.toLowerCase();
    for (const rule of CATEGORY_RULES) {
        if (rule.keywords.test(text)) {
            return rule.category;
        }
    }
    return 'India'; // Default
}

// ── Summary Extraction ─────────────────────────────────────────────────────────

/**
 * Extract a clean 2-sentence summary from the news description.
 * Falls back to the title if description is empty.
 */
function extractSummary(title: string, description: string): string {
    if (!description || description.trim().length < 20) {
        return `${title}. This news is significant from an SSB preparation standpoint.`;
    }
    // Take first 2 sentences or first 220 characters, whichever is shorter
    const sentences = description.split(/(?<=[.!?])\s+/);
    const twoSentences = sentences.slice(0, 2).join(' ');
    return twoSentences.length > 220 ? `${twoSentences.slice(0, 220)}...` : twoSentences;
}

// ── Interview Question Templates ───────────────────────────────────────────────

function buildInterviewQuestion(title: string): string {
    const titleLower = title.toLowerCase();

    if (/missile|nuclear|weapon|drdo/.test(titleLower)) {
        return `What is the strategic significance of this development for India's defence posture?`;
    }
    if (/isro|space|satellite/.test(titleLower)) {
        return `How does India's space programme contribute to national security and development?`;
    }
    if (/china|pakistan|border/.test(titleLower)) {
        return `What should India's strategic approach be in the context of: "${title}"?`;
    }
    if (/economy|gdp|budget|rupee/.test(titleLower)) {
        return `How does this economic development impact India's defence budget and military readiness?`;
    }
    return `As a future officer, how would you stay informed and form an opinion on: "${title}"?`;
}

// ── SSB Importance Templates ───────────────────────────────────────────────────

function buildSSBImportance(category: string): string {
    const map: Record<string, string> = {
        Defence:       'Critical for officers — demonstrates awareness of India\'s strategic assets and military modernization.',
        Science:       'Shows India\'s technological advancement; relevant for dual-use applications in defence and national security.',
        Economy:       'Economic strength underpins defence spending — an officer must understand the national fiscal picture.',
        International: 'Geopolitical awareness is vital for an officer commissioned to serve India\'s strategic interests.',
        India:         'Domestic awareness is critical for officers who serve the nation and its citizens at every level.',
    };
    return map[category] || map['India'];
}

// ── Main Enhancer ──────────────────────────────────────────────────────────────

/**
 * Enhance a raw news article into SSB-ready fields using pure logic.
 * No AI, no external calls.
 */
export function enhanceForSSB(title: string, description: string): SSBEnhancement {
    const category = getCategory(title);

    return {
        summary:            extractSummary(title, description),
        gd_topic:           `Discuss: ${title}`,
        lecturette:         `Lecturette on: ${title}`,
        ssb_importance:     buildSSBImportance(category),
        interview_question: buildInterviewQuestion(title),
    };
}
