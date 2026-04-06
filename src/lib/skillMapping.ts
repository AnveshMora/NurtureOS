import type { SkillNode, SkillMapping } from '../types';

export const SKILL_NODES: SkillNode[] = [
  'curiosity',
  'firstPrinciples',
  'problemSolving',
  'communication',
  'grit',
  'arts',
];

export function getPrimarySkill(mapping: SkillMapping): SkillNode {
  return SKILL_NODES.reduce((best, node) =>
    mapping[node] > mapping[best] ? node : best
  );
}

export function getSecondarySkill(mapping: SkillMapping): SkillNode {
  const primary = getPrimarySkill(mapping);
  return SKILL_NODES.filter((n) => n !== primary).reduce((best, node) =>
    mapping[node] > mapping[best] ? node : best
  );
}

export function getSkillScore(mapping: SkillMapping): number {
  const total = SKILL_NODES.reduce((sum, node) => sum + mapping[node], 0);
  return Math.round((total / (SKILL_NODES.length * 5)) * 100);
}

export function emptySkillMapping(): SkillMapping {
  return {
    curiosity: 0,
    firstPrinciples: 0,
    problemSolving: 0,
    communication: 0,
    grit: 0,
    arts: 0,
  };
}

export function defaultSkillScores(): Record<SkillNode, number> {
  return {
    curiosity: 3,
    firstPrinciples: 3,
    problemSolving: 3,
    communication: 3,
    grit: 3,
    arts: 3,
  };
}
