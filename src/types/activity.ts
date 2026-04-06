import type { SkillMapping } from './skillNode';
import type { AgeBand } from './child';

export type ActivityCategory =
  | 'practical-life'
  | 'sensorial'
  | 'language'
  | 'math'
  | 'nature-science'
  | 'arts-movement'
  | 'social-grace';

export type ActivityDuration = '10min' | '20min' | '45min';

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  'practical-life': 'Practical Life',
  sensorial: 'Sensorial',
  language: 'Language',
  math: 'Math Thinking',
  'nature-science': 'Nature & Science',
  'arts-movement': 'Arts & Movement',
  'social-grace': 'Social Grace',
};

export const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  'practical-life': '🏠',
  sensorial: '🖐️',
  language: '📖',
  math: '🔢',
  'nature-science': '🌿',
  'arts-movement': '🎨',
  'social-grace': '🤝',
};

export const DURATION_LABELS: Record<ActivityDuration, string> = {
  '10min': '10 min',
  '20min': '20 min',
  '45min': '45 min',
};

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  skillMapping: SkillMapping;
  ageBands: AgeBand[];
  duration: ActivityDuration;
  materials: string[];
  instructions: string[];
  parentPrompts: string[];
  expectedBehavior: string;
  commonMistakes: string[];
  isCustom: boolean;
  createdAt: string;
}
