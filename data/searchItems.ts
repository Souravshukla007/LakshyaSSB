export interface SearchItem {
    title: string;
    category: string;
    link: string;
    icon?: string;
}

export const searchItems: SearchItem[] = [
    {
        title: 'OIR Intelligence Test',
        category: 'Practice Test',
        link: '/practice/oir',
        icon: 'fa-brain',
    },
    {
        title: 'SRT Rapid Response',
        category: 'Psychology Test',
        link: '/practice/srt',
        icon: 'fa-bolt',
    },
    {
        title: 'TAT Story Writing',
        category: 'Psychology Test',
        link: '/practice/tat',
        icon: 'fa-images',
    },
    {
        title: 'WAT Word Association',
        category: 'Psychology Test',
        link: '/practice/wat',
        icon: 'fa-pen',
    },
    {
        title: 'Lecturette Trainer',
        category: 'Communication Practice',
        link: '/practice/lecturette',
        icon: 'fa-microphone-lines',
    },
    {
        title: 'Color Vision Test',
        category: 'Medical Tool',
        link: '/medical/color-vision-test',
        icon: 'fa-vial-circle-check',
    },
    {
        title: 'SSB Entry Navigator',
        category: 'SSB Tool',
        link: '/ssb-entry-navigator',
        icon: 'fa-compass',
    },
    {
        title: 'Leaderboard',
        category: 'Progress',
        link: '/leaderboard',
        icon: 'fa-trophy',
    },
    {
        title: 'Preparation Roadmap',
        category: 'Guidance',
        link: '/roadmap',
        icon: 'fa-route',
    },
];
