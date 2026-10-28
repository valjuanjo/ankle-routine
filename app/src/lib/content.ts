// Fixed, versioned content bundled with the app (copied from /content by scripts/sync-content.mjs).
import exercisesJson from '../content/exercises.json';
import programsJson from '../content/programs.json';
import warmupJson from '../content/team-warmup.json';
import safetyJson from '../content/safety-checklist.json';
import intendedJson from '../content/intended-use.json';
import templatesJson from '../content/templates.json';

export type Lang = 'en' | 'es';
export type Country = 'US' | 'PE';
export type Text = Record<Lang, string>;
export type Category = 'mobility' | 'strength' | 'balance' | 'hop';

export interface Exercise {
  id: string;
  category: Category;
  name: Text;
  instructions: Text;
  mistakes: Record<Lang, string[]>;
  perSide: boolean;
  video: string | null;
}

/** One exercise in a routine. Exactly one of reps or sec is set. */
export interface RoutineItem {
  ex: string;
  sets: number;
  reps?: number;
  sec?: number;
}

export interface ProgramStage {
  id: string;
  name: Text;
  days: number[];
  items: RoutineItem[];
  moveOnWhen: Text;
}

export interface Program {
  id: string;
  name: Text;
  for: Text;
  requiresConfirmation?: boolean;
  stages: ProgramStage[];
}

export interface EmergencyNumber { label: string; number: string }
export interface SafetyChecklist {
  title: string;
  items: string[];
  action: string;
  emergency: Record<Country, EmergencyNumber[]>;
}

export const exercises = exercisesJson.exercises as Exercise[];
export const exerciseById: Record<string, Exercise> = Object.fromEntries(exercises.map((e) => [e.id, e]));
export const programs = programsJson.programs as Program[];
export const templates = templatesJson.templates as { id: string; name: Text; days: number[]; items: RoutineItem[] }[];
export const teamWarmup = warmupJson as {
  id: string; name: Text; minutes: number; frequency: Text; days: number[];
  blocks: { name: Text; items: RoutineItem[] }[];
};
export const safety = { en: safetyJson.en, es: safetyJson.es } as Record<Lang, SafetyChecklist>;
export const intendedUse = intendedJson as {
  modes: Record<'prescribed' | 'general' | 'team', Text>;
  notice: Text;
  shareNotice: Text;
};
export const CONTENT_VERSION = exercisesJson.version;
