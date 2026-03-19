import { CyclePhase } from "@prisma/client";

/**
 * Multiplicadores por fase do ciclo.
 * Baseados em literatura de performance feminina e fisiologia hormonal.
 */
const PHASE_MULTIPLIER: Record<CyclePhase, number> = {
  FOLLICULAR: 1.0,   // Estrogênio em alta — pico de força e recuperação
  OVULATORY: 0.95,   // Janela de pico curta, leve risco de lesão ligamentar
  LUTEAL: 0.75,      // Progesterona alta — maior fadiga, menor tolerância ao esforço
  MENSTRUAL: 0.60,   // Inflamação + perda de ferro — priorizar recuperação
};

const WEIGHTS = {
  hrv: 0.45,
  sleep: 0.30,
  phase: 0.25,
};

interface ScoreInput {
  hrv?: number | null;
  hrvBaseline?: number | null; // média histórica do usuário
  sleepHours?: number | null;
  phase: CyclePhase;
}

/**
 * Calcula o score diário (0–100).
 * Cada componente é normalizado para 0–1 antes de ser ponderado.
 */
export function calculateDailyScore(input: ScoreInput): number {
  const { hrv, hrvBaseline, sleepHours, phase } = input;

  // HRV: normalizado em relação à baseline pessoal
  let hrvNorm = 0.7; // valor neutro quando não há dado
  if (hrv != null && hrvBaseline != null && hrvBaseline > 0) {
    hrvNorm = Math.min(hrv / hrvBaseline, 1.4) / 1.4; // cap em 140% da baseline
  }

  // Sono: 6h = 0.6, 7h = 0.85, 8h = 1.0, >9h diminui (oversleeping)
  let sleepNorm = 0.75; // neutro
  if (sleepHours != null) {
    if (sleepHours >= 8) {
      sleepNorm = Math.min(1, 1 - (sleepHours - 8) * 0.05);
    } else {
      sleepNorm = Math.max(0, sleepHours / 8);
    }
  }

  const phaseNorm = PHASE_MULTIPLIER[phase];

  const raw =
    WEIGHTS.hrv * hrvNorm +
    WEIGHTS.sleep * sleepNorm +
    WEIGHTS.phase * phaseNorm;

  return Math.round(raw * 100);
}

/**
 * Classifica o score em verde/amarelo/vermelho.
 */
export function scoreLabel(score: number): "green" | "yellow" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

/**
 * Calcula em qual fase do ciclo está o usuário hoje.
 */
export function getCyclePhase(
  startDate: Date,
  cycleLengthDays: number,
  today = new Date()
): { phase: CyclePhase; cycleDay: number } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / msPerDay
  );
  const cycleDay = (daysSinceStart % cycleLengthDays) + 1;

  // Janelas padrão (ajustadas para ciclos de 21–35 dias via proporção)
  const ratio = cycleLengthDays / 28;
  const menstrualEnd = Math.round(5 * ratio);
  const follicularEnd = Math.round(13 * ratio);
  const ovulatoryEnd = Math.round(16 * ratio);

  let phase: CyclePhase;
  if (cycleDay <= menstrualEnd) {
    phase = "MENSTRUAL";
  } else if (cycleDay <= follicularEnd) {
    phase = "FOLLICULAR";
  } else if (cycleDay <= ovulatoryEnd) {
    phase = "OVULATORY";
  } else {
    phase = "LUTEAL";
  }

  return { phase, cycleDay };
}

/**
 * Média de HRV dos últimos N scores do usuário.
 */
export function computeHrvBaseline(
  recentScores: Array<{ hrv: number | null }>
): number | null {
  const valid = recentScores
    .map((s) => s.hrv)
    .filter((h): h is number => h != null);

  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}
