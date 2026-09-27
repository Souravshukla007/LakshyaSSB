'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EligibilityForm {
    age: string;
    gender: string;
    education: string;
    pcmPercentage: string;
    graduationPercentage: string;
    jeeMains: string;
    clatScore: string;
    nccC: string;
    maritalStatus: string;
    serving: string;
    cpl: string;
}

/** Normalised candidate profile the entry gates are evaluated against. */
interface Profile {
    age: number;
    gender: string;
    edu: string;
    pcm: number;
    grad: number;
    jee: number;
    clat: number;
    nccC: boolean;
    unmarried: boolean;
    serving: boolean;
    /** Holds a valid Commercial Pilot Licence (Coast Guard CPL-SSA entry). */
    cpl: boolean;
}

type Stream = 'upsc' | 'non-upsc';
type Service = 'army' | 'navy' | 'airforce' | 'coastguard' | 'capf';

interface Cycle {
    /** Notification / exam cycle label, e.g. "NDA 1". Year is appended at runtime. */
    label: string;
    /** 0-indexed course commencement month. */
    month: number;
}

interface EntryDef {
    id: string;
    name: string;
    fullName: string;
    icon: string;
    stream: Stream;
    service: Service;
    /** Stage-1 filter shown as a chip. */
    written: string;
    /** One-line qualification note shown under the entry name. */
    writtenNote: string;
    minAge: number;
    maxAge: number;
    cycles: Cycle[];
    /** Non-age criteria. Returns a rejection reason, or null when the profile passes. */
    gate: (p: Profile) => string | null;
}

interface Intake {
    name: string;
    courseCommencement: string;
    ageOnCcdText: string;
    eligible: boolean;
    rejectReason?: string;
}

interface EntryResult {
    id: string;
    name: string;
    fullName: string;
    icon: string;
    stream: Stream;
    service: Service;
    written: string;
    ageWindow: string;
    eligible: boolean;
    reason: string;
    intakes: Intake[];
    /** Total upcoming cycles assessed inside the planning horizon. */
    totalCycles: number;
}

// ─── Gate helpers ─────────────────────────────────────────────────────────────
const need = (ok: boolean, reason: string): string | null => (ok ? null : reason);
const firstFail = (...checks: (string | null)[]): string | null =>
    checks.find(c => c !== null) ?? null;

const isTwelfth = (e: string) => e === '12th';
const isDegree = (e: string) =>
    e === 'graduate' || e === 'engineering' || e === 'llb' || e === 'postgraduate';
const isEngg = (e: string) => e === 'engineering';
const isEnggOrFinalYear = (e: string) => e === 'engineering' || e === 'engineering_final';
const isPostGrad = (e: string) => e === 'postgraduate';
const isLlb = (e: string) => e === 'llb';

const R = {
    male: 'Open to male candidates only',
    female: 'Open to women candidates only',
    twelfth: 'Requires 10+2 (Class XII) qualification',
    pcmStream: 'Requires Physics, Chemistry & Maths at 10+2 (enter your PCM %)',
    degree: 'Requires a completed graduation degree',
    engg: 'Requires a B.E./B.Tech degree',
    enggFinal: 'Requires pre-final / final year B.E./B.Tech enrolment',
    pg: 'Requires a post-graduate degree (M.Sc / MA / M.Tech)',
    llb: 'Requires an LLB degree',
    unmarried: 'Open to unmarried candidates only',
    ncc: "Requires an NCC 'C' certificate",
    jee: 'Requires a valid JEE Mains score',
    clat: 'Requires a valid CLAT PG score',
    serving: 'Open to serving Armed Forces personnel only',
    cpl: 'Requires a valid Commercial Pilot Licence (CPL)',
} as const;

const pcmAtLeast = (p: Profile, min: number) =>
    need(p.pcm >= min, `Requires ≥ ${min}% aggregate in PCM at 10+2`);
const gradAtLeast = (p: Profile, min: number) =>
    need(p.grad >= min, `Requires ≥ ${min}% aggregate in graduation / PG`);
const physMathsAtLeast = (p: Profile, min: number) =>
    need(p.pcm >= min, `Requires ≥ ${min}% in Physics & Maths at 10+2`);
/** IAF permits married candidates aged 25+; below that, unmarried only. */
const afMarital = (p: Profile) =>
    need(p.unmarried || p.age >= 25, 'Candidates below 25 years must be unmarried');

// ─── Cycle builders ───────────────────────────────────────────────────────────
const janJul = (a: string, b: string): Cycle[] => [
    { label: a, month: 0 },
    { label: b, month: 6 },
];
const aprOct = (a: string, b: string): Cycle[] => [
    { label: a, month: 3 },
    { label: b, month: 9 },
];
const once = (label: string, month: number): Cycle[] => [{ label, month }];

// ─── Entry catalog (single source of truth for every section) ─────────────────
const ENTRY_CATALOG: EntryDef[] = [
    // ══════════ UPSC — NDA & NA EXAM ══════════
    {
        id: 'nda-army',
        name: 'NDA (Army)',
        fullName: 'National Defence Academy — Army Wing',
        icon: '⚔️',
        stream: 'upsc',
        service: 'army',
        written: 'UPSC NDA & NA',
        writtenNote: 'Maths (300) + GAT (600)',
        minAge: 16.5,
        maxAge: 19.5,
        cycles: janJul('NDA 1', 'NDA 2'),
        gate: p => firstFail(need(isTwelfth(p.edu), R.twelfth), need(p.unmarried, R.unmarried)),
    },
    {
        id: 'nda-navy',
        name: 'NDA (Navy)',
        fullName: 'National Defence Academy — Naval Wing',
        icon: '⚓',
        stream: 'upsc',
        service: 'navy',
        written: 'UPSC NDA & NA',
        writtenNote: '10+2 with PCM mandatory',
        minAge: 16.5,
        maxAge: 19.5,
        cycles: janJul('NDA 1', 'NDA 2'),
        gate: p =>
            firstFail(
                need(isTwelfth(p.edu), R.twelfth),
                need(p.pcm > 0, R.pcmStream),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'nda-af',
        name: 'NDA (Air Force)',
        fullName: 'National Defence Academy — Air Force Wing',
        icon: '✈️',
        stream: 'upsc',
        service: 'airforce',
        written: 'UPSC NDA & NA',
        writtenNote: '10+2 with PCM mandatory',
        minAge: 16.5,
        maxAge: 19.5,
        cycles: janJul('NDA 1', 'NDA 2'),
        gate: p =>
            firstFail(
                need(isTwelfth(p.edu), R.twelfth),
                need(p.pcm > 0, R.pcmStream),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'na-10plus2',
        name: 'NA (10+2 B.Tech)',
        fullName: 'Naval Academy 10+2 B.Tech Cadet Entry (via NDA & NA)',
        icon: '🎓',
        stream: 'upsc',
        service: 'navy',
        written: 'UPSC NDA & NA',
        writtenNote: 'B.Tech course at INA Ezhimala',
        minAge: 16.5,
        maxAge: 19.5,
        cycles: janJul('NA 1', 'NA 2'),
        gate: p =>
            firstFail(
                need(isTwelfth(p.edu), R.twelfth),
                need(p.pcm > 0, R.pcmStream),
                need(p.unmarried, R.unmarried)
            ),
    },

    // ══════════ UPSC — CDS EXAM ══════════
    {
        id: 'cds-ima',
        name: 'IMA (CDS)',
        fullName: 'Indian Military Academy via CDS',
        icon: '🎖️',
        stream: 'upsc',
        service: 'army',
        written: 'UPSC CDS',
        writtenNote: 'English + GK + Elementary Maths',
        minAge: 19,
        maxAge: 24,
        cycles: janJul('CDS 1', 'CDS 2'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isDegree(p.edu), R.degree),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'cds-ina',
        name: 'INA (CDS)',
        fullName: 'Indian Naval Academy via CDS',
        icon: '⛵',
        stream: 'upsc',
        service: 'navy',
        written: 'UPSC CDS',
        writtenNote: 'Engineering degree required',
        minAge: 19,
        maxAge: 24,
        cycles: janJul('CDS 1', 'CDS 2'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isEngg(p.edu), R.engg),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'cds-afa',
        name: 'AFA (CDS)',
        fullName: 'Air Force Academy via CDS (Flying, Permanent Commission)',
        icon: '🛩️',
        stream: 'upsc',
        service: 'airforce',
        written: 'UPSC CDS + CPSS',
        writtenNote: 'CDS written, then AFSB & CPSS',
        minAge: 20,
        maxAge: 24,
        cycles: janJul('CDS 1', 'CDS 2'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isDegree(p.edu), R.degree),
                need(
                    isEngg(p.edu) || p.pcm >= 50,
                    'Requires Physics & Maths at 10+2, or a B.E./B.Tech degree'
                ),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'cds-ota-men',
        name: 'OTA — SSC (Men)',
        fullName: 'Officers Training Academy — Short Service Commission (Men)',
        icon: '🪖',
        stream: 'upsc',
        service: 'army',
        written: 'UPSC CDS (OTA)',
        writtenNote: 'English + GK only (no Maths)',
        minAge: 19,
        maxAge: 25,
        cycles: aprOct('CDS 1', 'CDS 2'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isDegree(p.edu), R.degree),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'cds-ota-women',
        name: 'OTA — SSC (Women)',
        fullName: 'Officers Training Academy — SSC Non-Technical (Women)',
        icon: '🎗️',
        stream: 'upsc',
        service: 'army',
        written: 'UPSC CDS (OTA)',
        writtenNote: 'English + GK only (no Maths)',
        minAge: 19,
        maxAge: 25,
        cycles: aprOct('CDS 1', 'CDS 2'),
        gate: p =>
            firstFail(
                need(p.gender === 'female', R.female),
                need(isDegree(p.edu), R.degree),
                need(p.unmarried, R.unmarried)
            ),
    },

    // ══════════ UPSC — CAPF AC EXAM ══════════
    // Conducted by UPSC, so it sits in the UPSC stream even though the
    // personality test is PST/PET + interview rather than an SSB.
    {
        id: 'capf-ac',
        name: 'CAPF (AC)',
        fullName: 'Central Armed Police Forces Assistant Commandant — BSF, CRPF, CISF, ITBP, SSB',
        icon: '🛡️',
        stream: 'upsc',
        service: 'capf',
        written: 'UPSC CAPF AC',
        writtenNote: 'Paper I (GA/GK) + Paper II (Essay & Comprehension)',
        minAge: 20,
        maxAge: 25,
        cycles: once('CAPF AC', 6),
        // Graduation in any discipline; married candidates are eligible and there
        // is no prescribed minimum percentage.
        gate: p => need(isDegree(p.edu), R.degree),
    },

    // ══════════ NON-UPSC — INDIAN ARMY ══════════
    {
        id: 'tes',
        name: 'TES (10+2)',
        fullName: 'Army Technical Entry Scheme — 10+2',
        icon: '⚙️',
        stream: 'non-upsc',
        service: 'army',
        written: 'JEE Mains (CRL)',
        writtenNote: '10+2 PCM ≥ 60% aggregate',
        minAge: 16.5,
        maxAge: 19.5,
        cycles: janJul('TES 1', 'TES 2'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isTwelfth(p.edu), R.twelfth),
                pcmAtLeast(p, 60),
                need(p.jee > 0, R.jee),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'tgc',
        name: 'TGC',
        fullName: 'Technical Graduate Course',
        icon: '🔧',
        stream: 'non-upsc',
        service: 'army',
        written: 'Engineering Marks',
        writtenNote: 'B.E./B.Tech aggregate, final year allowed',
        minAge: 20,
        maxAge: 27,
        cycles: janJul('TGC (Jan)', 'TGC (Jul)'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isEnggOrFinalYear(p.edu), R.engg),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'tgc-aec',
        name: 'TGC (AEC)',
        fullName: 'Army Education Corps — Technical Graduate Course',
        icon: '📚',
        stream: 'non-upsc',
        service: 'army',
        written: 'Post-Graduation Marks',
        writtenNote: 'MA / M.Sc ≥ 50%, 1st or 2nd division',
        minAge: 23,
        maxAge: 27,
        cycles: janJul('AEC (Jan)', 'AEC (Jul)'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isPostGrad(p.edu), R.pg),
                gradAtLeast(p, 50),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'ssc-tech-men',
        name: 'SSC (Tech) Men',
        fullName: 'Short Service Commission (Technical) — Men',
        icon: '💻',
        stream: 'non-upsc',
        service: 'army',
        written: 'Engineering Marks',
        writtenNote: 'B.E./B.Tech aggregate, no written exam',
        minAge: 20,
        maxAge: 27,
        cycles: aprOct('SSC(T) Apr', 'SSC(T) Oct'),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(isEnggOrFinalYear(p.edu), R.engg),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'ssc-tech-women',
        name: 'SSC (Tech) Women',
        fullName: 'Short Service Commission (Technical) — Women',
        icon: '👩‍💻',
        stream: 'non-upsc',
        service: 'army',
        written: 'Engineering Marks',
        writtenNote: 'B.E./B.Tech aggregate, no written exam',
        minAge: 20,
        maxAge: 27,
        cycles: aprOct('SSCW(T) Apr', 'SSCW(T) Oct'),
        gate: p =>
            firstFail(
                need(p.gender === 'female', R.female),
                need(isEnggOrFinalYear(p.edu), R.engg),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'ssc-jag',
        name: 'SSC (JAG)',
        fullName: 'Judge Advocate General Branch (Men & Women)',
        icon: '⚖️',
        stream: 'non-upsc',
        service: 'army',
        written: 'CLAT PG Score',
        writtenNote: 'LLB ≥ 55%, Bar Council eligible',
        minAge: 21,
        maxAge: 27,
        cycles: aprOct('JAG Apr', 'JAG Oct'),
        gate: p =>
            firstFail(
                need(isLlb(p.edu), R.llb),
                gradAtLeast(p, 55),
                need(p.clat > 0, R.clat),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'ssc-ncc-army',
        name: 'NCC Special Entry',
        fullName: 'Army NCC Special Entry (SSC, Men & Women)',
        icon: '🏅',
        stream: 'non-upsc',
        service: 'army',
        written: "Graduation % + NCC 'C'",
        writtenNote: 'Direct SSB — no written exam',
        minAge: 19,
        maxAge: 25,
        cycles: aprOct('NCC Apr', 'NCC Oct'),
        gate: p =>
            firstFail(
                need(isDegree(p.edu), R.degree),
                gradAtLeast(p, 50),
                need(p.nccC, R.ncc),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'ues',
        name: 'UES',
        fullName: 'University Entry Scheme (pre-final year B.E./B.Tech)',
        icon: '🏫',
        stream: 'non-upsc',
        service: 'army',
        written: 'Campus Interview + Marks',
        writtenNote: 'Pre-final year engineering students',
        minAge: 18,
        maxAge: 24,
        cycles: once('UES', 6),
        gate: p =>
            firstFail(
                need(p.gender === 'male', R.male),
                need(p.edu === 'engineering_final', R.enggFinal),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'ta',
        name: 'TA (Officer)',
        fullName: 'Territorial Army — Officer Entry (Men & Women)',
        icon: '🎽',
        stream: 'non-upsc',
        service: 'army',
        written: 'TA PIB Written Test',
        writtenNote: 'Graduate, gainfully employed',
        minAge: 18,
        maxAge: 42,
        cycles: once('TA', 3),
        gate: p => need(isDegree(p.edu), R.degree),
    },
    {
        id: 'acc',
        name: 'ACC',
        fullName: 'Army Cadet College (serving soldiers)',
        icon: '🎓',
        stream: 'non-upsc',
        service: 'army',
        written: 'ACC Written Exam',
        writtenNote: 'Serving soldiers with 10+2',
        minAge: 20,
        maxAge: 27,
        cycles: janJul('ACC (Jan)', 'ACC (Jul)'),
        gate: p => firstFail(need(p.serving, R.serving), need(isTwelfth(p.edu), R.twelfth)),
    },
    {
        id: 'sco',
        name: 'SCO',
        fullName: 'Special Commissioned Officer (serving soldiers)',
        icon: '🎯',
        stream: 'non-upsc',
        service: 'army',
        written: 'SCO Written Exam',
        writtenNote: 'Serving soldiers, 5+ years service',
        minAge: 28,
        maxAge: 35,
        cycles: once('SCO', 0),
        gate: p => firstFail(need(p.serving, R.serving), need(isTwelfth(p.edu), R.twelfth)),
    },

    // ══════════ NON-UPSC — INDIAN NAVY ══════════
    {
        id: 'navy-10plus2-btech',
        name: 'Navy 10+2 (B.Tech)',
        fullName: 'Indian Navy 10+2 (B.Tech) Cadet Entry Scheme',
        icon: '🚢',
        stream: 'non-upsc',
        service: 'navy',
        written: 'JEE Mains Rank',
        writtenNote: '10+2 PCM ≥ 70%, JEE Mains CRL',
        minAge: 16.5,
        maxAge: 19.5,
        cycles: once('Navy 10+2 B.Tech', 6),
        gate: p =>
            firstFail(
                need(isTwelfth(p.edu), R.twelfth),
                pcmAtLeast(p, 70),
                need(p.jee > 0, R.jee),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'navy-ssc-exec',
        name: 'Navy SSC Executive',
        fullName: 'SSC Executive — General Service (via INET)',
        icon: '⚓',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET',
        writtenNote: 'B.E./B.Tech any discipline ≥ 60%',
        minAge: 21,
        maxAge: 24,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(
                need(isEnggOrFinalYear(p.edu), R.engg),
                gradAtLeast(p, 60),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'navy-ssc-tech',
        name: 'Navy SSC Technical',
        fullName: 'SSC Technical — Engineering & Electrical (via INET)',
        icon: '🔌',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET',
        writtenNote: 'Mechanical / Electrical / Electronics ≥ 60%',
        minAge: 21,
        maxAge: 24,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(
                need(isEnggOrFinalYear(p.edu), R.engg),
                gradAtLeast(p, 60),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'navy-ssc-pilot',
        name: 'Navy SSC Pilot',
        fullName: 'SSC Pilot (via INET + CPSS)',
        icon: '🛫',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET + CPSS',
        writtenNote: 'B.E./B.Tech ≥ 60%, PCM at 10+2',
        minAge: 21,
        maxAge: 24,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(
                need(isEnggOrFinalYear(p.edu), R.engg),
                gradAtLeast(p, 60),
                physMathsAtLeast(p, 60),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'navy-ssc-observer',
        name: 'Navy SSC Observer / ATC',
        fullName: 'SSC Observer & Air Traffic Control (via INET + CPSS)',
        icon: '📡',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET + CPSS',
        writtenNote: 'B.E./B.Tech ≥ 60%, PCM at 10+2',
        minAge: 21,
        maxAge: 24,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(
                need(isEnggOrFinalYear(p.edu), R.engg),
                gradAtLeast(p, 60),
                physMathsAtLeast(p, 60),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'navy-ssc-log',
        name: 'Navy SSC Logistics',
        fullName: 'SSC Logistics Cadre (via INET)',
        icon: '📦',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET',
        writtenNote: 'B.E./B.Tech, B.Com or MBA ≥ 60%',
        minAge: 21,
        maxAge: 24,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(
                need(isDegree(p.edu) || isEnggOrFinalYear(p.edu), R.degree),
                gradAtLeast(p, 60),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'navy-ssc-edu',
        name: 'Navy SSC Education',
        fullName: 'SSC Education Branch (via INET)',
        icon: '📖',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET',
        writtenNote: 'M.Sc / MA / M.Tech ≥ 50%',
        minAge: 21,
        maxAge: 25,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(need(isPostGrad(p.edu), R.pg), gradAtLeast(p, 50), need(p.unmarried, R.unmarried)),
    },
    {
        id: 'navy-ssc-law',
        name: 'Navy SSC Law',
        fullName: 'SSC Law Cadre — Judge Advocate (via INET)',
        icon: '⚖️',
        stream: 'non-upsc',
        service: 'navy',
        written: 'INET',
        writtenNote: 'LLB ≥ 55%, Bar Council eligible',
        minAge: 22,
        maxAge: 27,
        cycles: janJul('INET 1', 'INET 2'),
        gate: p =>
            firstFail(need(isLlb(p.edu), R.llb), gradAtLeast(p, 55), need(p.unmarried, R.unmarried)),
    },
    {
        id: 'navy-ncc',
        name: 'Navy NCC Special Entry',
        fullName: "Navy NCC Special Entry — Executive (NCC 'C' Naval Wing)",
        icon: '🎖️',
        stream: 'non-upsc',
        service: 'navy',
        written: "Graduation % + NCC 'C'",
        writtenNote: 'Direct SSB — no INET required',
        minAge: 21,
        maxAge: 24,
        cycles: once('Navy NCC', 0),
        gate: p =>
            firstFail(
                need(isDegree(p.edu), R.degree),
                gradAtLeast(p, 60),
                need(p.nccC, R.ncc),
                need(p.unmarried, R.unmarried)
            ),
    },

    // ══════════ NON-UPSC — INDIAN AIR FORCE ══════════
    {
        id: 'afcat-flying',
        name: 'AFCAT — Flying',
        fullName: 'Air Force Flying Branch via AFCAT',
        icon: '✈️',
        stream: 'non-upsc',
        service: 'airforce',
        written: 'AFCAT + CPSS',
        writtenNote: '10+2 Phy & Maths ≥ 50%, degree ≥ 60%',
        minAge: 20,
        maxAge: 24,
        cycles: janJul('AFCAT 1', 'AFCAT 2'),
        gate: p =>
            firstFail(
                need(isDegree(p.edu) || isEnggOrFinalYear(p.edu), R.degree),
                physMathsAtLeast(p, 50),
                gradAtLeast(p, 60),
                afMarital(p)
            ),
    },
    {
        id: 'afcat-gdt',
        name: 'AFCAT — GD (Tech)',
        fullName: 'Ground Duty Technical — AE(L) & AE(M) via AFCAT',
        icon: '🛠️',
        stream: 'non-upsc',
        service: 'airforce',
        written: 'AFCAT',
        writtenNote: 'B.E./B.Tech ≥ 60%, 10+2 Phy & Maths ≥ 50%',
        minAge: 20,
        maxAge: 26,
        cycles: janJul('AFCAT 1', 'AFCAT 2'),
        gate: p =>
            firstFail(
                need(isEnggOrFinalYear(p.edu), R.engg),
                physMathsAtLeast(p, 50),
                gradAtLeast(p, 60),
                afMarital(p)
            ),
    },
    {
        id: 'afcat-gdnt',
        name: 'AFCAT — GD (Non-Tech)',
        fullName: 'Administration, Logistics, Accounts & Education via AFCAT',
        icon: '📋',
        stream: 'non-upsc',
        service: 'airforce',
        written: 'AFCAT',
        writtenNote: 'Graduate ≥ 60% in any stream',
        minAge: 20,
        maxAge: 26,
        cycles: janJul('AFCAT 1', 'AFCAT 2'),
        gate: p => firstFail(need(isDegree(p.edu), R.degree), gradAtLeast(p, 60), afMarital(p)),
    },
    {
        id: 'afcat-met',
        name: 'AFCAT — Meteorology',
        fullName: 'Meteorology Branch via AFCAT',
        icon: '🌦️',
        stream: 'non-upsc',
        service: 'airforce',
        written: 'AFCAT',
        writtenNote: 'PG in Science / Maths / Stats ≥ 50%',
        minAge: 20,
        maxAge: 26,
        cycles: janJul('AFCAT 1', 'AFCAT 2'),
        gate: p => firstFail(need(isPostGrad(p.edu), R.pg), gradAtLeast(p, 50), afMarital(p)),
    },
    {
        id: 'ncc-af-flying',
        name: 'NCC Special Entry (AF)',
        fullName: "Air Force Flying Branch — NCC Special Entry (Air Wing 'C')",
        icon: '🪂',
        stream: 'non-upsc',
        service: 'airforce',
        written: "NCC 'C' (Air Wing)",
        writtenNote: 'No AFCAT required — direct AFSB',
        minAge: 20,
        maxAge: 24,
        cycles: janJul('AFCAT 1', 'AFCAT 2'),
        gate: p =>
            firstFail(
                need(isDegree(p.edu) || isEnggOrFinalYear(p.edu), R.degree),
                need(p.nccC, "Requires NCC Air Wing Senior Division 'C' certificate"),
                physMathsAtLeast(p, 50),
                gradAtLeast(p, 60),
                afMarital(p)
            ),
    },

    // ══════════ NON-UPSC — INDIAN COAST GUARD (CGCAT) ══════════
    {
        id: 'icg-ac-gd',
        name: 'ICG AC (GD)',
        fullName: 'Coast Guard Assistant Commandant — General Duty',
        icon: '🛟',
        stream: 'non-upsc',
        service: 'coastguard',
        written: 'CGCAT',
        writtenNote: 'Degree ≥ 60%, 10+2 Maths & Physics ≥ 55%',
        minAge: 21,
        maxAge: 25,
        cycles: janJul('CGCAT 1', 'CGCAT 2'),
        gate: p =>
            firstFail(
                need(isDegree(p.edu), R.degree),
                gradAtLeast(p, 60),
                physMathsAtLeast(p, 55),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'icg-ac-tech',
        name: 'ICG AC (Tech)',
        fullName: 'Coast Guard Assistant Commandant — Technical (Mechanical / Electrical / Electronics)',
        icon: '🧰',
        stream: 'non-upsc',
        service: 'coastguard',
        written: 'CGCAT',
        writtenNote: 'B.E./B.Tech ≥ 60% in Mech / Elec / Electronics',
        minAge: 21,
        maxAge: 25,
        cycles: janJul('CGCAT 1', 'CGCAT 2'),
        gate: p =>
            firstFail(
                need(isEnggOrFinalYear(p.edu), R.engg),
                gradAtLeast(p, 60),
                need(p.unmarried, R.unmarried)
            ),
    },
    {
        id: 'icg-ac-law',
        name: 'ICG AC (Law)',
        fullName: 'Coast Guard Assistant Commandant — Law',
        icon: '📜',
        stream: 'non-upsc',
        service: 'coastguard',
        written: 'CGCAT',
        writtenNote: 'LLB ≥ 55%, Bar Council eligible',
        minAge: 21,
        maxAge: 30,
        cycles: janJul('CGCAT 1', 'CGCAT 2'),
        gate: p =>
            firstFail(need(isLlb(p.edu), R.llb), gradAtLeast(p, 55), need(p.unmarried, R.unmarried)),
    },
    {
        id: 'icg-ac-cpl',
        name: 'ICG AC (CPL-SSA)',
        fullName: 'Coast Guard Assistant Commandant — Commercial Pilot Licence (Short Service Appointment)',
        icon: '🚁',
        stream: 'non-upsc',
        service: 'coastguard',
        written: 'CGCAT + valid CPL',
        writtenNote: '10+2 Maths & Physics ≥ 55% + current CPL',
        minAge: 21,
        maxAge: 25,
        cycles: janJul('CGCAT 1', 'CGCAT 2'),
        // Qualification is the 10+2 stream plus the licence, so education level is
        // not gated — graduates holding a CPL apply on the same footing.
        gate: p =>
            firstFail(need(p.cpl, R.cpl), physMathsAtLeast(p, 55), need(p.unmarried, R.unmarried)),
    },
];

// ─── Derived views of the catalog ─────────────────────────────────────────────
const UPSC_ENTRIES = ENTRY_CATALOG.filter(e => e.stream === 'upsc');

const SERVICE_META: { service: Service; label: string; short: string }[] = [
    { service: 'army', label: 'Indian Army', short: 'Army' },
    { service: 'navy', label: 'Indian Navy', short: 'Navy' },
    { service: 'airforce', label: 'Indian Air Force', short: 'Air Force' },
    { service: 'coastguard', label: 'Indian Coast Guard', short: 'Coast Guard' },
    { service: 'capf', label: 'Paramilitary (CAPF)', short: 'CAPF' },
];

// Services with no non-UPSC entry are dropped so they never render an empty tab —
// CAPF AC, for instance, is conducted by UPSC.
const NON_UPSC_BY_SERVICE = SERVICE_META.map(meta => ({
    ...meta,
    entries: ENTRY_CATALOG.filter(e => e.stream === 'non-upsc' && e.service === meta.service),
})).filter(group => group.entries.length > 0);

const RESULT_GROUPS: { id: string; title: string; subtitle: string; badge: string; tone: 'upsc' | 'non' }[] = [
    { id: 'upsc', title: 'UPSC Entries', subtitle: 'Through UPSC NDA & NA, CDS and CAPF AC examinations', badge: 'U', tone: 'upsc' },
    { id: 'army', title: 'Indian Army — Non-UPSC', subtitle: 'joinindianarmy.nic.in', badge: 'A', tone: 'non' },
    { id: 'navy', title: 'Indian Navy — Non-UPSC', subtitle: 'joinindiannavy.gov.in', badge: 'N', tone: 'non' },
    { id: 'airforce', title: 'Indian Air Force — Non-UPSC', subtitle: 'afcat.cdac.in', badge: 'F', tone: 'non' },
    { id: 'coastguard', title: 'Indian Coast Guard — Non-UPSC', subtitle: 'joinindiancoastguard.cdac.in', badge: 'C', tone: 'non' },
];

// ─── Intake maths ─────────────────────────────────────────────────────────────
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
/** Calendar years of upcoming cycles to assess. */
const HORIZON_YEARS = 4;

function formatAgeLimit(value: number): string {
    const years = Math.floor(value);
    const months = Math.round((value - years) * 12);
    return months > 0 ? `${years} yrs ${months} mo` : `${years} yrs`;
}

function upcomingCycles(def: EntryDef, now: Date): { name: string; ccd: Date }[] {
    const list: { name: string; ccd: Date }[] = [];
    const firstYear = now.getFullYear();
    for (let year = firstYear; year < firstYear + HORIZON_YEARS; year++) {
        for (const cycle of def.cycles) {
            const ccd = new Date(year, cycle.month, 1);
            if (ccd.getTime() <= now.getTime()) continue;
            list.push({ name: `${cycle.label} ${year}`, ccd });
        }
    }
    return list.sort((a, b) => a.ccd.getTime() - b.ccd.getTime());
}

function toProfile(form: EligibilityForm): Profile {
    return {
        age: parseFloat(form.age) || 0,
        gender: form.gender,
        edu: form.education,
        pcm: parseFloat(form.pcmPercentage) || 0,
        grad: parseFloat(form.graduationPercentage) || 0,
        jee: parseFloat(form.jeeMains) || 0,
        clat: parseFloat(form.clatScore) || 0,
        nccC: form.nccC === 'yes',
        unmarried: form.maritalStatus !== 'married',
        serving: form.serving === 'yes',
        cpl: form.cpl === 'yes',
    };
}

function checkEligibility(form: EligibilityForm, now: Date = new Date()): EntryResult[] {
    const profile = toProfile(form);

    return ENTRY_CATALOG.map(def => {
        const gateReason = def.gate(profile);
        const cycles = upcomingCycles(def, now);

        const assessed: Intake[] = cycles.map(cycle => {
            const ageOnCcd = profile.age + (cycle.ccd.getTime() - now.getTime()) / MS_PER_YEAR;
            const years = Math.floor(ageOnCcd);
            const months = Math.min(11, Math.max(0, Math.floor((ageOnCcd - years) * 12)));

            let reason = gateReason;
            if (!reason && ageOnCcd < def.minAge) {
                reason = `Below the ${formatAgeLimit(def.minAge)} minimum on this course date`;
            } else if (!reason && ageOnCcd > def.maxAge) {
                reason = `Above the ${formatAgeLimit(def.maxAge)} upper age limit on this course date`;
            }

            return {
                name: cycle.name,
                courseCommencement: `${MONTH_NAMES[cycle.ccd.getMonth()]} ${cycle.ccd.getFullYear()}`,
                ageOnCcdText: `${years} years ${months} months`,
                eligible: !reason,
                rejectReason: reason ?? undefined,
            };
        });

        const eligibleIntakes = assessed.filter(i => i.eligible);
        const eligible = eligibleIntakes.length > 0;

        // Eligible → every attempt inside the horizon. Not eligible → only the next
        // upcoming attempt, since the rest repeat the same rejection.
        const intakes = eligible ? eligibleIntakes : assessed.slice(0, 1);

        const reason = eligible
            ? `${eligibleIntakes.length} upcoming attempt${eligibleIntakes.length === 1 ? '' : 's'} available.`
            : gateReason ?? assessed[0]?.rejectReason ?? 'No upcoming intake published.';

        return {
            id: def.id,
            name: def.name,
            fullName: def.fullName,
            icon: def.icon,
            stream: def.stream,
            service: def.service,
            written: def.written,
            ageWindow: `${formatAgeLimit(def.minAge)} – ${formatAgeLimit(def.maxAge)}`,
            eligible,
            reason,
            intakes,
            totalCycles: assessed.length,
        };
    });
}

// ─── Small presentational helpers ─────────────────────────────────────────────
function Chips({ items, tone }: { items: string[]; tone: 'upsc' | 'non' }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map(item => (
                <span
                    key={item}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${tone === 'upsc'
                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

// ─── Pointer capability ───────────────────────────────────────────────────────
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

const subscribeHover = (onChange: () => void) => {
    const mq = window.matchMedia(HOVER_QUERY);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
};
const readHover = () => window.matchMedia(HOVER_QUERY).matches;
/** SSR has no pointer info, so assume touch and render the tap affordance. */
const readHoverOnServer = () => false;

/** True on devices with a precise, hover-capable pointer (desktop mice / trackpads). */
function useHoverCapable(): boolean {
    return useSyncExternalStore(subscribeHover, readHover, readHoverOnServer);
}

/**
 * Attempt list for one entry.
 *
 * `overlay` (desktop, hover-driven) floats the panel over the grid so the card
 * layout never reflows mid-hover. The outer wrapper sits flush against the card
 * and carries transparent top padding instead of a margin — a real gap would let
 * the pointer exit the card subtree and fire mouseleave, closing the panel while
 * the user is reaching for it. On touch devices the panel renders inline instead.
 */
function AttemptsPanel({
    entry,
    overlay,
    onStartPrep,
}: {
    entry: EntryResult;
    overlay: boolean;
    onStartPrep: () => void;
}) {
    return (
        <div
            className={
                overlay
                    ? 'absolute top-full left-0 right-0 pt-2 z-50'
                    : 'relative mt-2 rounded-b-2xl border-t border-gray-100 bg-gray-50/70'
            }
        >
            <div className={overlay ? 'rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden' : ''}>
                <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                        {entry.eligible ? 'Your eligible attempts' : 'Next upcoming attempt'}
                    </p>
                    <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">Age {entry.ageWindow}</span>
                </div>

                <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                    {entry.intakes.length === 0 && (
                        <p className="text-xs text-gray-500">
                            No upcoming intake published in the next {HORIZON_YEARS} years.
                        </p>
                    )}

                    {entry.intakes.map((intake, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-xl border text-left ${intake.eligible ? 'bg-white border-green-100 shadow-sm' : 'bg-white border-red-100'}`}
                        >
                            <p className="font-bold text-gray-900 text-sm">{intake.name}</p>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between gap-2 text-xs">
                                    <span className="text-gray-500">Commencement:</span>
                                    <span className="font-semibold text-gray-700">{intake.courseCommencement}</span>
                                </div>
                                <div className="flex justify-between gap-2 text-xs">
                                    <span className="text-gray-500">Age on CCD:</span>
                                    <span className="font-semibold text-gray-700">{intake.ageOnCcdText}</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${intake.eligible ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                                >
                                    {intake.eligible ? '🟢 Eligible' : '🔴 Not Eligible'}
                                </span>
                                {intake.eligible && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            onStartPrep();
                                        }}
                                        className="bg-gray-900 text-white hover:bg-gray-800 text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5"
                                    >
                                        Start prep <i className="fa-solid fa-arrow-right text-[8px]" />
                                    </button>
                                )}
                            </div>
                            {!intake.eligible && intake.rejectReason && (
                                <p className="text-red-500 text-[10px] mt-2 leading-tight font-medium bg-red-50/50 p-1.5 rounded-md border border-red-100">
                                    Reason: {intake.rejectReason}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const COMPARISON_ROWS: { label: string; upsc: ReactNode; nonUpsc: ReactNode }[] = [
    {
        label: '🏛️ Conducting Body',
        upsc: 'Union Public Service Commission',
        nonUpsc: 'Army HQ (ADG Rtg), Indian Navy, IAF, Indian Coast Guard',
    },
    {
        label: '🌐 Website',
        upsc: 'upsc.gov.in',
        nonUpsc: 'joinindianarmy.nic.in · joinindiannavy.gov.in · afcat.cdac.in · joinindiancoastguard.cdac.in',
    },
    {
        label: '📅 Notification',
        upsc: 'NDA & NA (Dec & May) · CDS (Oct & May) · CAPF AC (Apr, once a year)',
        nonUpsc: 'Rolling — each entry notified 1–2 times a year',
    },
    {
        label: '🎓 Course Start',
        upsc: 'Jan & Jul (NDA, NA, IMA, INA, AFA) · Apr & Oct (OTA) · CAPF AC training varies by force',
        nonUpsc: 'Jan, Apr, Jul & Oct — varies by entry',
    },
    {
        label: '📝 Application Window',
        upsc: '3–4 weeks on the UPSC portal',
        nonUpsc: '3–6 weeks on the respective service portal',
    },
    {
        label: '✍️ Written Exam',
        upsc: 'UPSC written mandatory (NDA & NA / CDS / CAPF AC)',
        nonUpsc: "Service tests (AFCAT, INET, CGCAT, TA, ACC) or merit shortlisting on JEE Mains, degree %, CLAT PG, NCC 'C'",
    },
    {
        label: '🎯 Selection Board',
        upsc: 'SSB / AFSB / NSB — 5 days, then medical board · CAPF AC: PST/PET + interview',
        nonUpsc: 'SSB / AFSB / NSB — 5 days, then medical board · CGCAT: Coast Guard PSB & FSB',
    },
    {
        label: '📋 Entries',
        upsc: <Chips items={UPSC_ENTRIES.map(e => e.name)} tone="upsc" />,
        nonUpsc: (
            <Chips
                items={ENTRY_CATALOG.filter(e => e.stream === 'non-upsc').map(e => e.name)}
                tone="non"
            />
        ),
    },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SSBEntryNavigatorPage() {
    const router = useRouter();
    const [form, setForm] = useState<EligibilityForm>({
        age: '',
        gender: '',
        education: '',
        pcmPercentage: '',
        graduationPercentage: '',
        jeeMains: '',
        clatScore: '',
        nccC: 'no',
        maritalStatus: 'unmarried',
        serving: 'no',
        cpl: 'no',
    });
    const [results, setResults] = useState<EntryResult[] | null>(null);
    const [activeEntry, setActiveEntry] = useState<string | null>(null);
    const [activeService, setActiveService] = useState<Service>('army');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
    // Desktop pointers reveal attempts on hover; touch devices toggle on tap.
    const hoverCapable = useHoverCapable();

    // ── Check session once on mount ──────────────────────────────────────────
    useEffect(() => {
        fetch('/api/auth/session')
            .then(r => r.json())
            .then(data => setIsLoggedIn(!!data.user))
            .catch(() => setIsLoggedIn(false));
    }, []);

    // ── Auth guard: run fn if logged in, else redirect to /auth ──────────────
    const requireAuth = useCallback(
        (fn: () => void) => {
            if (isLoggedIn === null) return; // still loading, ignore
            if (!isLoggedIn) {
                router.push('/auth');
            } else {
                fn();
            }
        },
        [isLoggedIn, router]
    );

    const handleCheck = () => {
        if (!form.age || !form.gender || !form.education) return;
        requireAuth(() => {
            setActiveEntry(null);
            setResults(checkEligibility(form));
        });
    };

    const eligibleCount = results?.filter(r => r.eligible).length ?? 0;

    const activeServiceEntries =
        NON_UPSC_BY_SERVICE.find(g => g.service === activeService)?.entries ?? [];

    const groupedResults = useMemo(() => {
        if (!results) return [];
        return RESULT_GROUPS.map(group => ({
            ...group,
            entries: results.filter(r =>
                group.id === 'upsc' ? r.stream === 'upsc' : r.stream === 'non-upsc' && r.service === group.id
            ),
        })).filter(g => g.entries.length > 0);
    }, [results]);

    const toggleEntry = (id: string) =>
        setActiveEntry(current => (current === id ? null : id));

    return (
        <>
            <main
                className="min-h-screen pt-24 pb-20 px-4 md:px-8"
                style={{
                    background: '#FBF8F3',
                    backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            >
                <div className="max-w-6xl mx-auto space-y-16">

                    {/* ════════════════════════════════════
              PAGE HEADER
          ════════════════════════════════════ */}
                    <section className="text-center space-y-4 pt-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                            <i className="fa-solid fa-compass text-[10px]" />
                            Career Guidance
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            SSB Entry <span className="text-orange-500">Navigator™</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">
                            Discover which officer entries you are eligible for — all {ENTRY_CATALOG.length} Army, Navy, Air Force, Coast Guard and CAPF entries in one place.
                        </p>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 1 — PROCESS OVERVIEW
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">The Stage Selection System</h2>
                            <p className="text-gray-500 mt-2 text-sm">From notification to academy — here is how every Defence officer is selected.</p>
                        </div>

                        {/* Flow: cards + arrows as siblings in the same row */}
                        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-3 md:gap-0">
                            {[
                                { icon: 'fa-bell', color: 'bg-purple-100 text-purple-600', ring: 'hover:border-purple-200 hover:shadow-purple-100', title: 'Notification & Application', time: '12–09 Months', desc: 'Entry notification released; candidates apply online.', step: '00' },
                                { icon: 'fa-pen-nib', color: 'bg-blue-100 text-blue-600', ring: 'hover:border-blue-200 hover:shadow-blue-100', title: 'Stage 1 – Written Test', time: 'UPSC / JEE / Degree Filter', desc: 'UPSC exam, AFCAT, INET, CGCAT, JEE Mains, degree marks, or CLAT score depending on entry.', step: '01' },
                                { icon: 'fa-brain', color: 'bg-orange-100 text-orange-600', ring: 'hover:border-orange-200 hover:shadow-orange-100', title: 'Stage 2 – SSB Personality Test', time: '5 Days at Selection Centre', desc: 'Officer Intelligence Rating, Psychological, Group Tasks, Personal Interview. CAPF AC runs PST/PET instead.', step: '02' },
                                { icon: 'fa-stethoscope', color: 'bg-red-100 text-red-600', ring: 'hover:border-red-200 hover:shadow-red-100', title: 'Stage 3 – Medical Board', time: 'At Service Hospital', desc: 'Medically fit candidates proceed to merit list.', step: '03' },
                                { icon: 'fa-flag', color: 'bg-green-100 text-green-600', ring: 'hover:border-green-200 hover:shadow-green-100', title: 'Merit List & Academy Joining', time: 'Final Step', desc: 'Merit list released. Selected candidates join NDA/NA, IMA, OTA, AFA, INA, or a Coast Guard / CAPF academy.', step: '04' },
                            ].map((step, i, arr) => (
                                // Each step renders the CARD + the ARROW (if not last) as a flat row pair
                                <div key={i} className="flex flex-row md:flex-row items-center flex-1 w-full md:w-auto min-w-0">

                                    {/* ── Card ── */}
                                    <div className={`
                                        group flex-1 bg-white/85 backdrop-blur-sm rounded-2xl border border-gray-100
                                        shadow-md p-5 flex flex-col gap-3 min-w-0 h-full
                                        transition-all duration-300
                                        hover:-translate-y-1.5 hover:shadow-xl ${step.ring}
                                        cursor-default
                                    `}>
                                        {/* Step badge */}
                                        <span className="self-start text-[10px] font-black text-gray-300 tracking-widest uppercase">{step.step}</span>

                                        {/* Icon */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-300 group-hover:scale-110 ${step.color}`}>
                                            <i className={`fa-solid ${step.icon}`} />
                                        </div>

                                        {/* Text */}
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm leading-tight">{step.title}</p>
                                            <p className="text-orange-500 text-xs font-semibold mt-0.5">{step.time}</p>
                                            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>

                                    {/* ── Arrow (between cards, not below them) ── */}
                                    {i < arr.length - 1 && (
                                        <div className="flex items-center justify-center shrink-0 px-2 md:px-1.5">
                                            {/* Always right-pointing on desktop, down on mobile column layout */}
                                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                                                <i className="fa-solid fa-chevron-right text-orange-500 text-xs" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 2 — UPSC vs Non-UPSC
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">UPSC vs Non-UPSC Entries</h2>
                            <p className="text-gray-500 mt-2 text-sm">Two distinct pathways for becoming an officer in the Defence Forces.</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-1/5">Criteria</th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">U</span>
                                                    <span className="font-bold text-gray-900 text-sm">UPSC Entries</span>
                                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">{UPSC_ENTRIES.length}</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold">N</span>
                                                    <span className="font-bold text-gray-900 text-sm">Non-UPSC Entries</span>
                                                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">{ENTRY_CATALOG.length - UPSC_ENTRIES.length}</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {COMPARISON_ROWS.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50/80 transition-colors align-top">
                                                <td className="px-6 py-4 text-gray-500 font-semibold text-xs whitespace-nowrap">{row.label}</td>
                                                <td className="px-6 py-4 text-gray-700 text-sm">{row.upsc}</td>
                                                <td className="px-6 py-4 text-gray-700 text-sm">{row.nonUpsc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 3 — WRITTEN TEST QUALIFICATION
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Stage 1 – Written Qualification Criteria</h2>
                            <p className="text-gray-500 mt-2 text-sm">How candidates are shortlisted before appearing for SSB — every entry, both streams.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            {/* UPSC Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">U</span>
                                        <h3 className="font-bold text-gray-900">UPSC Entries</h3>
                                        <span className="text-[10px] font-bold text-gray-400">({UPSC_ENTRIES.length})</span>
                                    </div>
                                    <span className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full whitespace-nowrap">Shortlist 1:20</span>
                                </div>
                                <div className="p-6 space-y-3">
                                    {UPSC_ENTRIES.map(row => (
                                        <div key={row.id} className="flex items-center justify-between gap-3 p-3 bg-orange-50/60 rounded-xl border border-orange-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm">{row.name}</p>
                                                <p className="text-gray-400 text-xs">{row.writtenNote}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-orange-600 bg-white px-2.5 py-1 rounded-lg border border-orange-200 whitespace-nowrap shrink-0">{row.written}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Non-UPSC Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-bold">N</span>
                                        <h3 className="font-bold text-gray-900">Non-UPSC Entries</h3>
                                        <span className="text-[10px] font-bold text-gray-400">({ENTRY_CATALOG.length - UPSC_ENTRIES.length})</span>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full whitespace-nowrap">Shortlist 1:100</span>
                                </div>
                                {/* Service tabs — 25 non-UPSC entries stacked made this card far
                                    taller than the UPSC one, so only the selected service is shown. */}
                                <div className="px-6 pt-4 flex flex-wrap gap-2" role="tablist" aria-label="Non-UPSC entries by service">
                                    {NON_UPSC_BY_SERVICE.map(group => {
                                        const selected = activeService === group.service;
                                        return (
                                            <button
                                                key={group.service}
                                                type="button"
                                                role="tab"
                                                aria-selected={selected}
                                                onClick={() => setActiveService(group.service)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${selected
                                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className="hidden sm:inline">{group.label}</span>
                                                <span className="sm:hidden">{group.short}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${selected ? 'bg-white/20 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                                                    {group.entries.length}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-6 space-y-3">
                                    {activeServiceEntries.map(row => (
                                        <div key={row.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm">{row.name}</p>
                                                <p className="text-gray-400 text-xs">{row.writtenNote}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200 whitespace-nowrap shrink-0">{row.written}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Shortlisting ratio banner */}
                        <div className="mt-6 grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
                                <i className="fa-solid fa-filter text-orange-500 text-xl" />
                                <div>
                                    <p className="font-bold text-gray-900">UPSC Shortlisting</p>
                                    <p className="text-orange-600 font-extrabold text-2xl">1 : 20</p>
                                    <p className="text-gray-400 text-xs">1 candidate per every 20 who appear for SSB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
                                <i className="fa-solid fa-filter text-gray-600 text-xl" />
                                <div>
                                    <p className="font-bold text-gray-900">Non-UPSC Shortlisting</p>
                                    <p className="text-gray-800 font-extrabold text-2xl">1 : 100</p>
                                    <p className="text-gray-400 text-xs">Higher competition; merit-based cutoffs apply</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              SECTION 4 — ELIGIBILITY CALCULATOR
          ════════════════════════════════════ */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Find Your Eligible Entries</h2>
                            <p className="text-gray-500 mt-2 text-sm">Fill in your profile and instantly see which of the {ENTRY_CATALOG.length} entries you qualify for.</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md p-8 md:p-10">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

                                {/* Age */}
                                <div className="flex flex-col gap-1.5">
                                    {/* Every control in this form is wired up with htmlFor/id. Without it the
                                        visible text is not the control's accessible name, so a screen reader
                                        announces a bare "edit" / "combo box", and clicking the label does
                                        nothing. */}
                                    <label htmlFor="nav-age" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age (years)</label>
                                    <input
                                        id="nav-age"
                                        type="number"
                                        placeholder="e.g. 19"
                                        min={15}
                                        max={45}
                                        value={form.age}
                                        onChange={e => setForm({ ...form, age: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="nav-gender" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</label>
                                    <select
                                        id="nav-gender"
                                        value={form.gender}
                                        onChange={e => setForm({ ...form, gender: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition appearance-none"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>

                                {/* Education */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="nav-education" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Education Level</label>
                                    <select
                                        id="nav-education"
                                        value={form.education}
                                        onChange={e => setForm({ ...form, education: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition appearance-none"
                                    >
                                        <option value="">Select education</option>
                                        <option value="12th">10+2 (Class XII)</option>
                                        <option value="graduate">Graduate (Any Stream)</option>
                                        <option value="engineering">Engineering (B.Tech/B.E.) — completed</option>
                                        <option value="engineering_final">Engineering — pre-final / final year</option>
                                        <option value="llb">LLB (Law Graduate)</option>
                                        <option value="postgraduate">Post Graduate (M.Sc / MA / M.Tech)</option>
                                    </select>
                                </div>

                                {/* PCM % */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="nav-pcm" className="text-xs font-bold text-gray-500 uppercase tracking-wider">10+2 PCM Percentage (%)</label>
                                    <input
                                        id="nav-pcm"
                                        type="number"
                                        placeholder="e.g. 75"
                                        min={0}
                                        max={100}
                                        value={form.pcmPercentage}
                                        onChange={e => setForm({ ...form, pcmPercentage: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Graduation % */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="nav-grad" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Graduation / PG Percentage (%)</label>
                                    <input
                                        id="nav-grad"
                                        type="number"
                                        placeholder="e.g. 65"
                                        min={0}
                                        max={100}
                                        value={form.graduationPercentage}
                                        onChange={e => setForm({ ...form, graduationPercentage: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* JEE Mains */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="nav-jee" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        JEE Mains Score <span className="text-gray-400 font-normal normal-case">(TES & Navy 10+2)</span>
                                    </label>
                                    <input
                                        id="nav-jee"
                                        type="number"
                                        placeholder="e.g. 120"
                                        min={0}
                                        max={300}
                                        value={form.jeeMains}
                                        onChange={e => setForm({ ...form, jeeMains: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* CLAT */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="nav-clat" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        CLAT PG Score <span className="text-gray-400 font-normal normal-case">(JAG)</span>
                                    </label>
                                    <input
                                        id="nav-clat"
                                        type="number"
                                        placeholder="e.g. 95"
                                        min={0}
                                        max={120}
                                        value={form.clatScore}
                                        onChange={e => setForm({ ...form, clatScore: e.target.value })}
                                        suppressHydrationWarning
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Marital status */}
                                <div className="flex flex-col gap-1.5">
                                    {/* Not a real <label> target — these are toggle buttons, so the group is
                                        named with aria-labelledby and each button reports its pressed state. */}
                                    <span id="nav-marital-label" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Marital Status</span>
                                    <div className="flex gap-3" role="group" aria-labelledby="nav-marital-label">
                                        {[
                                            { val: 'unmarried', label: 'Unmarried' },
                                            { val: 'married', label: 'Married' },
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                aria-pressed={form.maritalStatus === opt.val}
                                                onClick={() => setForm({ ...form, maritalStatus: opt.val })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.maritalStatus === opt.val
                                                    ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* NCC C Certificate */}
                                <div className="flex flex-col gap-1.5">
                                    <span id="nav-ncc-label" className="text-xs font-bold text-gray-500 uppercase tracking-wider">NCC C Certificate</span>
                                    <div className="flex gap-3" role="group" aria-labelledby="nav-ncc-label">
                                        {['yes', 'no'].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                aria-pressed={form.nccC === val}
                                                aria-label={`NCC C Certificate: ${val === 'yes' ? 'Yes' : 'No'}`}
                                                onClick={() => setForm({ ...form, nccC: val })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.nccC === val
                                                    ? val === 'yes'
                                                        ? 'bg-green-500 text-white border-green-500 shadow-md'
                                                        : 'bg-gray-800 text-white border-gray-800 shadow-md'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {val === 'yes' ? '✅ Yes' : '❌ No'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Serving personnel */}
                                <div className="flex flex-col gap-1.5">
                                    <span id="nav-serving-label" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Serving in Armed Forces <span className="text-gray-400 font-normal normal-case">(ACC / SCO)</span>
                                    </span>
                                    <div className="flex gap-3" role="group" aria-labelledby="nav-serving-label">
                                        {['yes', 'no'].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                aria-pressed={form.serving === val}
                                                aria-label={`Serving in Armed Forces: ${val === 'yes' ? 'Yes' : 'No'}`}
                                                onClick={() => setForm({ ...form, serving: val })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.serving === val
                                                    ? val === 'yes'
                                                        ? 'bg-green-500 text-white border-green-500 shadow-md'
                                                        : 'bg-gray-800 text-white border-gray-800 shadow-md'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {val === 'yes' ? '✅ Yes' : '❌ No'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Commercial Pilot Licence */}
                                <div className="flex flex-col gap-1.5">
                                    <span id="nav-cpl-label" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Commercial Pilot Licence <span className="text-gray-400 font-normal normal-case">(ICG CPL-SSA)</span>
                                    </span>
                                    <div className="flex gap-3" role="group" aria-labelledby="nav-cpl-label">
                                        {['yes', 'no'].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                aria-pressed={form.cpl === val}
                                                aria-label={`Commercial Pilot Licence: ${val === 'yes' ? 'Yes' : 'No'}`}
                                                onClick={() => setForm({ ...form, cpl: val })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.cpl === val
                                                    ? val === 'yes'
                                                        ? 'bg-green-500 text-white border-green-500 shadow-md'
                                                        : 'bg-gray-800 text-white border-gray-800 shadow-md'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {val === 'yes' ? '✅ Yes' : '❌ No'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={handleCheck}
                                    disabled={!form.age || !form.gender || !form.education}
                                    className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <i className="fa-solid fa-magnifying-glass text-orange-400" />
                                    Check Eligibility
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ════════════════════════════════════
              RESULTS SECTION
          ════════════════════════════════════ */}
                    {results && (
                        <section>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">You Are Eligible For:</h2>
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                                    {eligibleCount > 0 ? (
                                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <i className="fa-solid fa-circle-check text-xs" />
                                            {eligibleCount} of {results.length} entr{eligibleCount === 1 ? 'y' : 'ies'} matched
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <i className="fa-solid fa-circle-xmark text-xs" />
                                            No entries matched your profile
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-semibold">
                                        <i className={`fa-solid ${hoverCapable ? 'fa-arrow-pointer' : 'fa-hand-pointer'} text-[10px]`} />
                                        {hoverCapable ? 'Hover an entry to see every attempt' : 'Tap an entry to see every attempt'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {groupedResults.map(group => {
                                    const groupEligible = group.entries.filter(e => e.eligible).length;
                                    return (
                                        <div key={group.id}>
                                            {/* Group header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${group.tone === 'upsc' ? 'bg-orange-100 text-orange-600' : 'bg-gray-900 text-white'}`}>
                                                    {group.badge}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-gray-900 text-sm md:text-base leading-tight">{group.title}</p>
                                                    <p className="text-gray-400 text-xs">{group.subtitle}</p>
                                                </div>
                                                <span className="ml-auto text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
                                                    {groupEligible}/{group.entries.length} eligible
                                                </span>
                                            </div>

                                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {group.entries.map(entry => {
                                                    const isActive = activeEntry === entry.id;
                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-expanded={isActive}
                                                            aria-label={`${entry.name} — ${entry.eligible ? 'eligible' : 'not eligible'}. Show attempts.`}
                                                            // Pointer devices open on hover/focus. Touch devices toggle on tap —
                                                            // they must NOT also open on focus, or the focus that precedes the
                                                            // tap would open the panel and the tap would immediately close it.
                                                            onMouseEnter={hoverCapable ? () => setActiveEntry(entry.id) : undefined}
                                                            onMouseLeave={
                                                                hoverCapable
                                                                    ? () => setActiveEntry(cur => (cur === entry.id ? null : cur))
                                                                    : undefined
                                                            }
                                                            onFocus={hoverCapable ? () => setActiveEntry(entry.id) : undefined}
                                                            onBlur={
                                                                hoverCapable
                                                                    ? e => {
                                                                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                                                            setActiveEntry(cur => (cur === entry.id ? null : cur));
                                                                        }
                                                                    }
                                                                    : undefined
                                                            }
                                                            onClick={hoverCapable ? undefined : () => toggleEntry(entry.id)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Escape') {
                                                                    setActiveEntry(null);
                                                                } else if (!hoverCapable && (e.key === 'Enter' || e.key === ' ')) {
                                                                    e.preventDefault();
                                                                    toggleEntry(entry.id);
                                                                }
                                                            }}
                                                            // NOTE: the de-emphasis for non-eligible entries must NOT live on this
                                                            // element. `opacity` applies to the whole subtree, and AttemptsPanel is
                                                            // a child — so `opacity-75` here made the hover panel translucent and
                                                            // let the page behind it bleed through. It also creates a stacking
                                                            // context, trapping the panel's own z-index. The dimming now sits on
                                                            // the card body below instead.
                                                            className={`relative cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl border shadow-md flex flex-col transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${isActive ? 'ring-2 ring-orange-500 shadow-orange-100 z-40' : 'hover:-translate-y-1 z-0'
                                                                } ${entry.eligible
                                                                    ? 'border-green-200 shadow-green-100/60'
                                                                    : 'border-gray-200'
                                                                }`}
                                                        >
                                                            <div
                                                                className={`p-5 flex flex-col gap-3 transition-opacity duration-200 ${entry.eligible || isActive ? 'opacity-100' : 'opacity-75'
                                                                    }`}
                                                            >
                                                                {/* Status badge */}
                                                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${entry.eligible ? 'bg-green-500' : 'bg-red-400'}`}>
                                                                    {entry.eligible ? '✓' : '✗'}
                                                                </div>

                                                                {/* Icon & name */}
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${entry.eligible ? 'bg-green-50' : 'bg-gray-100'}`}>
                                                                    {entry.icon}
                                                                </div>

                                                                <div>
                                                                    <p className="font-extrabold text-gray-900 text-base leading-tight">{entry.name}</p>
                                                                    <p className="text-gray-400 text-xs leading-tight mt-0.5">{entry.fullName}</p>
                                                                </div>

                                                                {/* Status label */}
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${entry.eligible
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-red-50 text-red-500'
                                                                        }`}>
                                                                        {entry.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                                                                    </span>
                                                                    {entry.eligible && (
                                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg">
                                                                            {entry.intakes.length} attempt{entry.intakes.length === 1 ? '' : 's'}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-start justify-between gap-2 mt-1">
                                                                    <p className="text-gray-500 text-xs flex-1 line-clamp-2">{entry.reason}</p>
                                                                    {!hoverCapable && (
                                                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                                                            <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isActive && (
                                                                <AttemptsPanel
                                                                    entry={entry}
                                                                    overlay={hoverCapable}
                                                                    onStartPrep={() => requireAuth(() => router.push('/practice'))}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-xs text-gray-400 mt-8 mb-8 italic max-w-3xl mx-auto">
                                *Eligibility is calculated on your age at the course commencement date (CCD), across every notified cycle in the next {HORIZON_YEARS} years.
                                Intake months and cut-offs are indicative — always confirm against the official notification before applying.
                            </p>

                            {/* CTA */}
                            {eligibleCount > 0 && (
                                <div className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl px-8 py-10 text-center">
                                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                                    <div className="relative z-10 space-y-4">
                                        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest">Next Step</p>
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                                            Start Preparation for <span className="text-orange-500">Selected Entry</span>
                                        </h3>
                                        <p className="text-gray-400 text-sm max-w-lg mx-auto">
                                            Our structured modules cover PIQ, Leaderboard coaching, OLQ reports, and daily practice — everything you need to crack SSB.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                                            <button
                                                onClick={() => requireAuth(() => router.push('/practice'))}
                                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-900/30"
                                            >
                                                <i className="fa-solid fa-dumbbell text-xs" />
                                                Start Practice Now
                                            </button>
                                            <button
                                                onClick={() => requireAuth(() => router.push('/piq-builder'))}
                                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                                            >
                                                <i className="fa-solid fa-clipboard-list text-xs" />
                                                Build Your PIQ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                </div>
            </main>
        </>
    );
}
