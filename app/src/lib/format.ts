import { exerciseById, intendedUse, programs, teamWarmup, type Lang, type ProgramStage, type RoutineItem } from './content';
import type { Strings } from './i18n';
import type { Routine } from './routineCode';

export function doseText(it: RoutineItem, s: Strings): string {
  const amount = it.reps != null ? `${it.sets} × ${it.reps}` : `${it.sets} × ${it.sec} ${s.seconds}`;
  return exerciseById[it.ex]?.perSide ? `${amount} ${s.perSide}` : amount;
}

export interface RoutineInfo {
  title: string;
  stage?: string;
  moveOnWhen?: string;
  /** Next stage of a general program, if there is one. */
  nextStage?: ProgramStage;
}

/**
 * Display text for a routine in the current language. Bundled programs are looked up by id
 * so their names follow a language change; scanned routines show the physio's own text.
 */
export function describeRoutine(r: Routine, lang: Lang, s: Strings): RoutineInfo {
  if (r.programId === teamWarmup.id) return { title: teamWarmup.name[lang] };
  const program = programs.find((p) => p.id === r.programId);
  if (program) {
    const i = program.stages.findIndex((x) => x.id === r.stageId);
    const stage = program.stages[i];
    return { title: program.name[lang], stage: stage?.name[lang], moveOnWhen: stage?.moveOnWhen[lang], nextStage: program.stages[i + 1] };
  }
  return { title: r.title || (r.source === 'team' ? s.routineFromCoach : s.routineFromPhysio), stage: r.stage };
}

export function routineFromStage(programId: string, stage: ProgramStage): Routine {
  return { source: 'general', programId, stageId: stage.id, days: stage.days, items: stage.items };
}

export function routineFromTeamWarmup(): Routine {
  return { source: 'team', programId: teamWarmup.id, days: teamWarmup.days, items: teamWarmup.blocks.flatMap((b) => b.items) };
}

export const intendedUseFor = (r: Routine, lang: Lang): string => intendedUse.modes[r.source][lang];

export const daysText = (days: number[], s: Strings) => days.map((d) => s.days[d]).join(', ');
