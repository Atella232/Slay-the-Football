import type { TeamType } from '@/types/game';

export interface TeamPresentation {
  crestSrc: string;
  emblemTint: string;
  headerGradient: string;
  name: string;
  panelAccent: string;
  panelRing: string;
  pillAccent: string;
  softAccent: string;
}

const TEAM_PRESENTATIONS: Record<TeamType, TeamPresentation> = {
  athletic: {
    name: 'Athletic Club',
    crestSrc: '/crests/athletic.svg',
    headerGradient: 'from-rose-200 via-red-100 to-white',
    panelRing: 'border-rose-300/45',
    panelAccent: 'from-rose-700/75 via-red-700/45 to-slate-950',
    softAccent: 'border-rose-300/25 bg-rose-950/20',
    pillAccent: 'text-rose-100',
    emblemTint: 'drop-shadow-[0_10px_24px_rgba(127,29,29,0.35)]',
  },
  barcelona: {
    name: 'FC Barcelona',
    crestSrc: '/crests/barcelona.svg',
    headerGradient: 'from-cyan-200 via-blue-200 to-rose-200',
    panelRing: 'border-cyan-300/45',
    panelAccent: 'from-blue-950/80 via-blue-700/45 to-rose-900/70',
    softAccent: 'border-cyan-300/25 bg-blue-950/25',
    pillAccent: 'text-cyan-100',
    emblemTint: 'drop-shadow-[0_10px_24px_rgba(30,64,175,0.4)]',
  },
  madrid: {
    name: 'Real Madrid',
    crestSrc: '/crests/madrid.svg',
    headerGradient: 'from-white via-slate-100 to-amber-200',
    panelRing: 'border-amber-200/45',
    panelAccent: 'from-slate-200/25 via-slate-700/35 to-amber-300/25',
    softAccent: 'border-amber-200/25 bg-slate-200/10',
    pillAccent: 'text-amber-100',
    emblemTint: 'drop-shadow-[0_10px_24px_rgba(202,138,4,0.32)]',
  },
};

export function getTeamPresentation(team: TeamType): TeamPresentation {
  return TEAM_PRESENTATIONS[team];
}
