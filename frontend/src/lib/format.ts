import type { MasteryLevel, PracticeMode, QuizType } from '../types'

export const masteryLabels: Record<MasteryLevel, string> = {
  NEW: 'New',
  LEARNING: 'Learning',
  FAMILIAR: 'Familiar',
  MASTERED: 'Mastered',
}

export const quizLabels: Record<QuizType, string> = {
  PRACTICE: 'Daily practice',
  WEAK_WORDS: 'Words to review',
  WEEKLY: 'Weekly review',
}

export const modeLabels: Record<PracticeMode, string> = {
  FLASHCARD: 'Flashcards',
  MULTIPLE_CHOICE: 'Multiple choice',
  FILL_MEANING: 'Fill the meaning',
  REVERSE: 'Reverse quiz',
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const displayOptions = { ...(options || { month: 'short', day: 'numeric' }) }
  // Date-only statistics buckets are UTC calendar labels, not local instants.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) displayOptions.timeZone = 'UTC'
  return new Intl.DateTimeFormat('en', displayOptions).format(new Date(value))
}

export function dateRange(start: string, end: string) {
  return `${formatDate(start)} – ${formatDate(end)}`
}

export function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}
