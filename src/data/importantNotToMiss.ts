import type { AgeBand } from '../types';

export interface ImportantItem {
  id: string;
  text: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'weekend';
  ageBands: AgeBand[];
}

export const IMPORTANT_NOT_TO_MISS: ImportantItem[] = [
  {
    id: 'intm-concentration',
    text: '15–20 min uninterrupted concentration daily',
    description: 'Protect a block of time where the child works on a self-chosen activity without interruption. No questions, no help unless asked.',
    frequency: 'daily',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'intm-read-aloud',
    text: 'One read-aloud session daily',
    description: 'Read one book with expression. Pause for predictions. Ask for retelling after.',
    frequency: 'daily',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'intm-practical-task',
    text: 'One real-world practical task per week',
    description: 'Involve the child in a real household task: cooking, cleaning, organizing, gardening.',
    frequency: 'weekly',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'intm-open-ended',
    text: 'One open-ended problem per week',
    description: 'Give the child a challenge with no single right answer: build something, solve a puzzle creatively, invent a game.',
    frequency: 'weekly',
    ageBands: ['3-4', '4-5', '5-6'],
  },
  {
    id: 'intm-narration',
    text: 'One parent-child narration session every weekend',
    description: 'Sit together and have the child tell you about their week, a story, or an experience in their own words.',
    frequency: 'weekend',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'intm-arts',
    text: 'One arts activity per week with no template',
    description: 'Free drawing, painting, sculpting, or building with no model to copy. Process over product.',
    frequency: 'weekly',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
  {
    id: 'intm-observe-first',
    text: 'One observation note before giving help',
    description: 'Before each activity, watch the child for 30 seconds. Note what they try before intervening.',
    frequency: 'daily',
    ageBands: ['2-3', '3-4', '4-5', '5-6'],
  },
];
