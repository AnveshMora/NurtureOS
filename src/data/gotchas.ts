import type { AgeBand } from '../types';

export interface Gotcha {
  id: string;
  text: string;
  description: string;
  ageBands: AgeBand[];
}

export const GOTCHA_LIBRARY: Gotcha[] = [
  {
    id: 'gotcha-too-much-help',
    text: 'Too much help',
    description: 'Stepping in before the child has had a chance to struggle. Wait 30 seconds before offering assistance.',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-too-many-toys',
    text: 'Too many toys',
    description: 'Overwhelming the child with options. Rotate toys — keep 8-10 out at a time.',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-too-many-activities',
    text: 'Too many activities at once',
    description: 'Scheduling every minute. Leave unstructured time for free play and self-direction.',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-worksheets-early',
    text: 'Worksheets too early',
    description: 'Paper-based learning before hands-on mastery. Use real objects before abstract representation.',
    ageBands: ['2-3', '3-4', '4-5'],
  },
  {
    id: 'gotcha-over-correcting',
    text: 'Over-correcting mistakes',
    description: 'Fixing every error immediately. Let the child discover mistakes through the activity itself.',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-reward-punishment',
    text: 'Reward/punishment dependency',
    description: 'Using stickers, treats, or threats to motivate. Focus on intrinsic satisfaction: "You did it yourself!"',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-screen-time',
    text: 'Screen time replacing exploration',
    description: 'Using screens as a default activity. Replace with hands-on exploration and real-world interaction.',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-ignoring-repetition',
    text: 'Ignoring repetition',
    description: 'Moving on when the child wants to repeat. Repetition is how mastery is built — let them repeat as much as they want.',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'gotcha-jumping-advanced',
    text: 'Jumping to advanced academics',
    description: 'Teaching reading/writing before sensorial and practical life foundations are set.',
    ageBands: ['2-3', '3-4', '4-5'],
  },
  {
    id: 'gotcha-compliance-learning',
    text: 'Confusing compliance with learning',
    description: 'A child who obeys is not necessarily a child who understands. Look for independent initiative, not just following instructions.',
    ageBands: ['3-4', '4-5', '5-6'],
  },
];
