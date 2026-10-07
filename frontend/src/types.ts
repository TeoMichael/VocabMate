export type MasteryLevel = 'NEW' | 'LEARNING' | 'FAMILIAR' | 'MASTERED'
export type QuizType = 'PRACTICE' | 'WEAK_WORDS' | 'WEEKLY'
export type PracticeMode = 'FLASHCARD' | 'MULTIPLE_CHOICE' | 'FILL_MEANING' | 'REVERSE'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface Topic {
  id: string
  name: string
  vocabularyCount: number
}

export interface Vocabulary {
  id: string
  word: string
  meaning: string
  exampleSentence: string | null
  topicId: string | null
  topicName: string | null
  createdAt: string
  correctCount: number
  wrongCount: number
  masteryLevel: MasteryLevel
  lastReviewed: string | null
}

export interface VocabularyInput {
  word: string
  meaning: string
  exampleSentence: string
  topicId: string | null
}

export interface ImportResult {
  importedCount: number
  invalidLines: { lineNumber: number; text: string; reason: string }[]
}

export interface QuizQuestion {
  id: string
  vocabularyId: string
  word: string
  mode: PracticeMode
  prompt: string
  options: string[]
  userAnswer: string | null
  isCorrect: boolean | null
  correctAnswer: string | null
  revealed: boolean
}

export interface QuizSession {
  id: string
  quizType: QuizType
  score: number
  totalQuestions: number
  completedAt: string | null
  createdAt: string
  questions: QuizQuestion[]
  mastered: number
  learning: number
  needReview: number
}

export interface QuizSummary {
  id: string
  quizType: QuizType
  score: number
  totalQuestions: number
  createdAt: string
  completedAt: string
}

export interface WeeklyReview {
  available: boolean
  availableAt: string
  windowStart: string
  windowEnd: string
  wordsLearned: number
  questionCount: number
  lastQuizId: string | null
}

export interface Statistics {
  totalVocabulary: number
  new: number
  learning: number
  familiar: number
  mastered: number
  overallAccuracy: number
  totalQuizzes: number
  correctAnswers: number
  incorrectAnswers: number
  todayPracticed: number
  dailyGoal: number
  reviewCount: number
  newPracticeCount: number
  wordsOverTime: { date: string; count: number }[]
}
