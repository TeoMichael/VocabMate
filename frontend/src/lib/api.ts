import axios from 'axios'
import type {
  AuthResponse,
  ImportResult,
  PracticeMode,
  QuizSession,
  QuizSummary,
  QuizType,
  Statistics,
  Topic,
  User,
  Vocabulary,
  VocabularyInput,
  WeeklyReview,
} from '../types'

export const AUTH_KEY = 'vocabmate.auth'
export const AUTH_EXPIRED_EVENT = 'vocabmate:auth-expired'

export function readAuth(): AuthResponse | null {
  try {
    const saved = sessionStorage.getItem(AUTH_KEY)
    if (!saved) return null
    const auth = JSON.parse(saved) as AuthResponse
    if (!auth.token || !auth.user || Date.parse(auth.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(AUTH_KEY)
      return null
    }
    return auth
  } catch {
    sessionStorage.removeItem(AUTH_KEY)
    return null
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5080/api',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const auth = readAuth()
  if (auth) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.match(/\/auth\/(login|register)$/)
    ) {
      sessionStorage.removeItem(AUTH_KEY)
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      { detail?: string; title?: string; errors?: Record<string, string[]> } | undefined
    if (data?.errors) return Object.values(data.errors).flat().join(' ')
    if (data?.detail) return data.detail
    if (!error.response)
      return 'Could not reach the server. Check that the API is running, then try again.'
    return data?.title || 'Something went wrong. Please try again.'
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export const authApi = {
  register: async (name: string, email: string, password: string) =>
    (await api.post<AuthResponse>('/auth/register', { name, email, password })).data,
  login: async (email: string, password: string) =>
    (await api.post<AuthResponse>('/auth/login', { email, password })).data,
  me: async () => (await api.get<User>('/auth/me')).data,
}

export const topicApi = {
  list: async () => (await api.get<Topic[]>('/topics')).data,
  create: async (name: string) => (await api.post<Topic>('/topics', { name })).data,
  update: async (id: string, name: string) =>
    (await api.put<Topic>(`/topics/${id}`, { name })).data,
  remove: async (id: string) => {
    await api.delete(`/topics/${id}`)
  },
}

export const vocabularyApi = {
  list: async (
    params: { search?: string; topicId?: string; masteryLevel?: string; weakOnly?: boolean } = {},
  ) => (await api.get<Vocabulary[]>('/vocabularies', { params })).data,
  get: async (id: string) => (await api.get<Vocabulary>(`/vocabularies/${id}`)).data,
  create: async (data: VocabularyInput) => (await api.post<Vocabulary>('/vocabularies', data)).data,
  update: async (id: string, data: VocabularyInput) =>
    (await api.put<Vocabulary>(`/vocabularies/${id}`, data)).data,
  remove: async (id: string) => {
    await api.delete(`/vocabularies/${id}`)
  },
  import: async (text: string, topicId: string | null) =>
    (await api.post<ImportResult>('/vocabularies/import', { text, topicId })).data,
}

export const learningApi = {
  start: async (quizType: QuizType, mode: PracticeMode, size: number) =>
    (await api.post<QuizSession>('/practice', { quizType, mode, size })).data,
  get: async (id: string) => (await api.get<QuizSession>(`/quizzes/${id}`)).data,
  history: async (completed = true) =>
    (await api.get<QuizSummary[]>('/quizzes', { params: { completed } })).data,
  answer: async (id: string, questionId: string, answer?: string, known?: boolean) =>
    (
      await api.post<{ isCorrect: boolean; correctAnswer: string; quiz: QuizSession }>(
        `/quizzes/${id}/answers`,
        { questionId, answer, known },
      )
    ).data,
  reveal: async (id: string, questionId: string) =>
    (
      await api.post<{ meaning: string; exampleSentence: string | null }>(
        `/quizzes/${id}/questions/${questionId}/reveal`,
      )
    ).data,
  weekly: async () => (await api.get<WeeklyReview>('/practice/weekly')).data,
  statistics: async () => (await api.get<Statistics>('/statistics')).data,
}
