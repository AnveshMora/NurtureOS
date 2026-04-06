export type SkillNode =
  | 'curiosity'
  | 'firstPrinciples'
  | 'problemSolving'
  | 'communication'
  | 'grit'
  | 'arts';

export const SKILL_NODE_LABELS: Record<SkillNode, string> = {
  curiosity: 'Curiosity',
  firstPrinciples: 'First Principles',
  problemSolving: 'Problem Solving',
  communication: 'Communication',
  grit: 'Grit',
  arts: 'Arts',
};

export const SKILL_NODE_COLORS: Record<SkillNode, string> = {
  curiosity: 'var(--color-skill-curiosity)',
  firstPrinciples: 'var(--color-skill-first-principles)',
  problemSolving: 'var(--color-skill-problem-solving)',
  communication: 'var(--color-skill-communication)',
  grit: 'var(--color-skill-grit)',
  arts: 'var(--color-skill-arts)',
};

// 1-5 rubric per skill node (from PRD §21)
export const SKILL_RUBRIC: Record<SkillNode, [string, string, string]> = {
  curiosity: ['Passive', 'Occasionally inquisitive', 'Self-initiated questioning'],
  firstPrinciples: ['Repeats steps', 'Understands basic cause-effect', 'Explains why and how'],
  problemSolving: ['Gives up quickly', 'Tries with help', 'Tries multiple strategies independently'],
  communication: ['Single words / unclear', 'Basic narration', 'Clear sequence and explanation'],
  grit: ['Avoids challenge', 'Persists sometimes', 'Stays with hard task calmly'],
  arts: ['Copies only', 'Some free expression', 'Original and varied expression'],
};

export type SkillMapping = Record<SkillNode, number>;
