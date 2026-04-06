export type AgeBand = '2-3' | '3-4' | '4-5' | '5-6';

export interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string
  ageBand: AgeBand;
  preferences: string[];
  sensitivities: string[];
  languageEnvironment: string;
  createdAt: string;
  updatedAt: string;
}

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  '2-3': 'Age 2–3',
  '3-4': 'Age 3–4',
  '4-5': 'Age 4–5',
  '5-6': 'Age 5–6',
};

export const AGE_BAND_FOCUS: Record<AgeBand, string[]> = {
  '2-3': ['Language explosion', 'Basic independence', 'Movement coordination', 'Order and routine'],
  '3-4': ['Sustained attention', 'Fine motor mastery', 'Early problem solving', 'Expressive language'],
  '4-5': ['Cause and effect reasoning', 'Early abstraction', 'Storytelling and explanation', 'Persistence through challenge'],
  '5-6': ['First-principles thinking', 'Confident communication', 'Longer task completion', 'Creative expression and choice'],
};
