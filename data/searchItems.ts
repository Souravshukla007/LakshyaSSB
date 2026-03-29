export interface SearchItem {
    title: string;
    category: string;
    link: string;
    icon?: string;
    keywords?: string[];
}

export const searchItems: SearchItem[] = [
    {
        title: 'OIR Intelligence Test',
        category: 'Practice Test',
        link: '/practice/oir',
        icon: 'fa-brain',
        keywords: ['oir', 'intelligence', 'reasoning', 'aptitude', 'logic', 'math', 'test', 'practice'],
    },
    {
        title: 'SRT Rapid Response',
        category: 'Psychology Test',
        link: '/practice/srt',
        icon: 'fa-bolt',
        keywords: ['srt', 'situation', 'reaction', 'rapid', 'response', 'psychology', 'test', 'practice'],
    },
    {
        title: 'TAT Story Writing',
        category: 'Psychology Test',
        link: '/practice/tat',
        icon: 'fa-images',
        keywords: ['tat', 'thematic', 'apperception', 'story', 'writing', 'image', 'picture', 'psychology', 'test', 'practice'],
    },
    {
        title: 'WAT Word Association',
        category: 'Psychology Test',
        link: '/practice/wat',
        icon: 'fa-pen',
        keywords: ['wat', 'word', 'association', 'writing', 'sentence', 'psychology', 'test', 'practice'],
    },
    {
        title: 'GPE Group Planning',
        category: 'GTO Task',
        link: '/practice/gpe',
        icon: 'fa-people-group',
        keywords: ['gpe', 'group', 'planning', 'exercise', 'gto', 'team', 'task', 'practice', 'military'],
    },
    {
        title: 'Lecturette Trainer',
        category: 'Communication Practice',
        link: '/practice/lecturette',
        icon: 'fa-microphone-lines',
        keywords: ['lecturette', 'speaking', 'trainer', 'communication', 'speech', 'public', 'gto', 'practice'],
    },
    {
        title: 'Color Vision Test',
        category: 'Medical Tool',
        link: '/medical/color-vision-test',
        icon: 'fa-vial-circle-check',
        keywords: ['color', 'vision', 'blindness', 'medical', 'eye', 'test', 'health'],
    },
    {
        title: 'SSB Entry Navigator',
        category: 'SSB Tool',
        link: '/ssb-entry-navigator',
        icon: 'fa-compass',
        keywords: ['ssb', 'entry', 'navigator', 'guide', 'nda', 'cds', 'afcat', 'technical', 'tools', 'eligibility'],
    },
    {
        title: 'Leaderboard',
        category: 'Progress',
        link: '/leaderboard',
        icon: 'fa-trophy',
        keywords: ['leaderboard', 'progress', 'ranking', 'score', 'points', 'medals', 'top'],
    },
    {
        title: 'Preparation Roadmap',
        category: 'Guidance',
        link: '/roadmap',
        icon: 'fa-route',
        keywords: ['roadmap', 'preparation', 'guidance', 'plan', 'strategy', 'timeline', 'path'],
    },
    {
        title: 'Current Affairs',
        category: 'News & Knowledge',
        link: '/current-affairs',
        icon: 'fa-newspaper',
        keywords: ['current', 'affairs', 'news', 'gk', 'world', 'daily', 'general', 'knowledge'],
    },
    {
        title: 'Daily Question',
        category: 'Practice',
        link: '/daily-question',
        icon: 'fa-calendar-day',
        keywords: ['daily', 'question', 'quiz', 'practice', 'challenge'],
    },
    {
        title: 'User Dashboard',
        category: 'Navigation',
        link: '/dashboard',
        icon: 'fa-gauge-high',
        keywords: ['dashboard', 'home', 'panel', 'profile', 'stats', 'progress'],
    },
    {
        title: 'PIQ Builder',
        category: 'Documentation',
        link: '/piq-builder',
        icon: 'fa-file-signature',
        keywords: ['piq', 'personal', 'information', 'questionnaire', 'builder', 'form', 'document'],
    },
    {
        title: 'Privacy Policy',
        category: 'Legal',
        link: '/privacy',
        icon: 'fa-shield-halved',
        keywords: ['privacy', 'policy', 'legal', 'data', 'security', 'terms'],
    },
    {
        title: 'Terms & Conditions',
        category: 'Legal',
        link: '/terms',
        icon: 'fa-file-contract',
        keywords: ['terms', 'conditions', 'legal', 'rules', 'policy', 'agreement'],
    },
    {
        title: 'Refund Policy',
        category: 'Legal',
        link: '/refund-policy',
        icon: 'fa-money-bill-transfer',
        keywords: ['refund', 'policy', 'money', 'cancel', 'return', 'legal'],
    },
    {
        title: 'About Us',
        category: 'Information',
        link: '/about',
        icon: 'fa-circle-info',
        keywords: ['about', 'us', 'team', 'company', 'mission', 'vision', 'lakshya'],
    },
    {
        title: 'Contact Us',
        category: 'Support',
        link: '/contact',
        icon: 'fa-envelope',
        keywords: ['contact', 'support', 'help', 'email', 'reach', 'message'],
    },
    {
        title: 'Pricing & PRO',
        category: 'Subscription',
        link: '/pricing',
        icon: 'fa-credit-card',
        keywords: ['pricing', 'pro', 'subscription', 'upgrade', 'premium', 'buy', 'cost'],
    },
];
