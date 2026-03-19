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
}

export interface RecommendationOutput {
  classification: "green" | "yellow" | "red";
  title: string;
  rationale: string;
  trainingType: string;
  exercises: string[];
  recovery: string;
  alert: string | null;
}

export async function generateRecommendation(
  input: RecommendationInput
): Promise<RecommendationOutput> {
  const label = scoreLabel(input.score);
  const phaseLabel = PHASE_LABEL[input.phase];
  const modalityLabel = MODALITY_LABEL[input.modality];

  const prompt = `Você é a IA da Femme Performance — especialista em performance feminina, fisiologia hormonal e treinamento inteligente.

Dados da usuária hoje:
- Nome: ${input.name}
- Modalidade: ${modalityLabel}
- Fase do ciclo: ${phaseLabel} (dia ${input.cycleDay})
- Score diário: ${input.score}/100
- HRV: ${input.hrv ?? "não disponível"} ms${input.hrvBaseline ? ` (baseline: ${input.hrvBaseline} ms)` : ""}
- Sono: ${input.sleepHours != null ? `${input.sleepHours}h` : "não disponível"}
- FC repouso: ${input.restingHeartRate ?? "não disponível"} bpm

Com base nesses dados, gere uma recomendação de treino em JSON com esta estrutura exata:
{
  "title": "string curta (ex: 'Treino forte — dia verde')",
  "rationale": "string de 1–2 frases explicando o porquê da recomendação baseado nos dados",
  "trainingType": "string (ex: 'Alta intensidade — força')",
  "exercises": ["exercício 1", "exercício 2", "exercício 3"],
  "recovery": "string com orientações de recuperação pós-treino",
  "alert": "string com alerta especial ou null se não houver"
}

Regras:
- Na fase menstrual ou score < 50: reduza volume, priorize mobilidade e treino leve
- Na fase folicular ou score >= 75: encoraje PR e alta intensidade
- Fase ovulatória: alerta sobre risco aumentado de lesão ligamentar
- Fase lútea: reduza carga, foque em técnica e resistência moderada
- Seja direta, concisa e empática
- Responda APENAS com o JSON, sem markdown, sem texto adicional`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
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
