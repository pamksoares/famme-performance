import Anthropic from "@anthropic-ai/sdk";
import { CyclePhase, Modality } from "@prisma/client";
import { scoreLabel } from "./score";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PHASE_LABEL: Record<CyclePhase, string> = {
  MENSTRUAL: "menstrual",
  FOLLICULAR: "folicular",
  OVULATORY: "ovulatória",
  LUTEAL: "lútea",
};

const MODALITY_LABEL: Record<Modality, string> = {
  CROSSFIT: "CrossFit",
  HYROX: "Hyrox",
  RUNNING: "Corrida",
  WEIGHTLIFTING: "Musculação",
};

export interface CheckInData {
  energy: number;
  mood: number;
  pain: boolean;
  sleepQuality: number;
  notes?: string | null;
}

export interface RecommendationInput {
  name: string;
  modality: Modality;
  phase: CyclePhase;
  cycleDay: number;
  score: number;
  hrv: number | null;
  hrvBaseline: number | null;
  sleepHours: number | null;
  restingHeartRate: number | null;
  checkIn?: CheckInData | null;
  recentScores?: Array<{ score: number; phase: CyclePhase; date: Date }>;
}

export interface RecommendationOutput {
  classification: "green" | "yellow" | "red";
  titulo: string;
  intensidade: "LEVE" | "MODERADO" | "INTENSO";
  treino: string;
  recuperacao: string;
  alerta: string | null;
  motivacao: string;
}

export async function generateRecommendation(
  input: RecommendationInput
): Promise<RecommendationOutput> {
  const label = scoreLabel(input.score);
  const phaseLabel = PHASE_LABEL[input.phase];
  const modalityLabel = MODALITY_LABEL[input.modality];

  const checkInSection = input.checkIn
    ? `
Check-in de sintomas de hoje:
- Energia subjetiva: ${input.checkIn.energy}/5
- Humor: ${input.checkIn.mood}/5
- Dor: ${input.checkIn.pain ? "Sim" : "Não"}
- Qualidade do sono: ${input.checkIn.sleepQuality}/5${input.checkIn.notes ? `\n- Nota: "${input.checkIn.notes}"` : ""}`
    : "";

  const historySection =
    input.recentScores && input.recentScores.length > 0
      ? `
Histórico dos últimos ${input.recentScores.length} dias:
${input.recentScores.map((s, i) => `- D-${i + 1}: score ${s.score} (${PHASE_LABEL[s.phase]})`).join("\n")}`
      : "";

  const prompt = `Você é a IA da Femme Performance — especialista em performance feminina, fisiologia hormonal e treinamento inteligente.

Dados da usuária hoje:
- Nome: ${input.name}
- Modalidade: ${modalityLabel}
- Fase do ciclo: ${phaseLabel} (dia ${input.cycleDay})
- Score diário: ${input.score}/100
- HRV: ${input.hrv ?? "não disponível"} ms${input.hrvBaseline ? ` (baseline: ${input.hrvBaseline} ms)` : ""}
- Sono: ${input.sleepHours != null ? `${input.sleepHours}h` : "não disponível"}
- FC repouso: ${input.restingHeartRate ?? "não disponível"} bpm${checkInSection}${historySection}

Com base nesses dados, gere uma recomendação de treino em JSON com esta estrutura exata:
{
  "titulo": "string curta (ex: 'Dia verde — vai de tudo!')",
  "intensidade": "LEVE" | "MODERADO" | "INTENSO",
  "treino": "string descrevendo o treino recomendado (2–3 frases)",
  "recuperacao": "string com orientações de recuperação pós-treino (1–2 frases)",
  "alerta": "string com alerta especial relevante ou null se não houver",
  "motivacao": "frase curta e motivacional personalizada (máx 15 palavras)"
}

Regras:
- Na fase menstrual ou score < 40: intensidade LEVE, priorize mobilidade e cuidado
- Score 40–70 ou fase lútea: intensidade MODERADO
- Score >= 70 e fase folicular/ovulatória: intensidade INTENSO, encoraje PRs
- Fase ovulatória: inclua alerta sobre risco aumentado de lesão ligamentar
- Se há dor no check-in: reduza intensidade e inclua alerta
- Se energia subjetiva <= 2: reduza uma categoria de intensidade
- Seja direta, concisa e empática
- Responda APENAS com o JSON, sem markdown, sem texto adicional`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Resposta inesperada da Claude API");
  }

  const parsed = JSON.parse(content.text) as Omit<
    RecommendationOutput,
    "classification"
  >;

  return { classification: label, ...parsed };
}
