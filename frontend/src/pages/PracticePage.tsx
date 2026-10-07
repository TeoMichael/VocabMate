import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  GraduationCap,
  Layers,
  Heart,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Shuffle,
  Target,
  Type,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { PracticeMode, QuizSession, QuizType } from '../types'
import { errorMessage, learningApi, vocabularyApi } from '../lib/api'
import { formatDate, modeLabels, plural, quizLabels } from '../lib/format'
import { useResource } from '../lib/useResource'
import { EmptyState, ErrorMessage, Loading, PageHeading } from '../components/ui'

const modes: { id: PracticeMode; icon: typeof Layers; description: string; hint: string }[] = [
  {
    id: 'FLASHCARD',
    icon: Layers,
    description: 'Take a moment. Reveal the meaning and see what you remember.',
    hint: 'A gentle place to start',
  },
  {
    id: 'MULTIPLE_CHOICE',
    icon: ListChecks,
    description: 'Find the right meaning among words from your own collection.',
    hint: 'Recognize and connect',
  },
  {
    id: 'FILL_MEANING',
    icon: Type,
    description: 'Look at the English word and write its Vietnamese meaning.',
    hint: 'Recall what you saved',
  },
  {
    id: 'REVERSE',
    icon: RotateCcw,
    description: 'Read the meaning, then remember the English word.',
    hint: 'Build recall both ways',
  },
]

export default function PracticePage() {
  const [params] = useSearchParams()
  const requestedType = params.get('type')
  const quizType: QuizType =
    requestedType === 'WEAK_WORDS' || requestedType === 'WEEKLY' ? requestedType : 'PRACTICE'
  const weekly = quizType === 'WEEKLY'
  const [mode, setMode] = useState<PracticeMode>('FLASHCARD')
  const [size, setSize] = useState(10)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const resource = useResource(async () => {
    const [stats, saved, weeklyReview, weakWords] = await Promise.all([
      learningApi.statistics(),
      learningApi.history(false),
      learningApi.weekly(),
      quizType === 'WEAK_WORDS' ? vocabularyApi.list({ weakOnly: true }) : Promise.resolve([]),
    ])
    return { stats, saved, weeklyReview, weakWords }
  }, [quizType])

  async function start() {
    setBusy(true)
    setError('')
    try {
      const quiz = await learningApi.start(
        quizType,
        quizType === 'WEEKLY' ? 'MULTIPLE_CHOICE' : mode,
        quizType === 'WEEKLY' ? 20 : size,
      )
      navigate(`/practice/${quiz.id}`)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={
          weekly
            ? 'A LOOK BACK, A STEP FORWARD'
            : quizType === 'WEAK_WORDS'
              ? 'FOCUS ON WHAT NEEDS YOU'
              : 'A LITTLE PRACTICE GOES A LONG WAY'
        }
        title={
          weekly
            ? 'Ready for your weekly review?'
            : quizType === 'WEAK_WORDS'
              ? 'Practice your tricky words'
              : 'How would you like to practice?'
        }
        description={
          weekly
            ? 'A mix of questions to help this week’s vocabulary stay with you.'
            : 'Choose a way to learn. Your progress is saved after every answer.'
        }
      />
      {!resource.loading &&
        !resource.error &&
        resource.data?.saved.some((quiz) => quiz.quizType === quizType) && (
          <section className="card saved-practice-card" aria-label="Saved practice sessions">
            <div className="section-heading">
              <div>
                <h2>Pick up where you left off</h2>
                <p>Your answers are saved. Finish a session whenever you’re ready.</p>
              </div>
              <Layers size={23} />
            </div>
            <div className="pending-session-list">
              {resource.data.saved
                .filter((quiz) => quiz.quizType === quizType)
                .slice(0, 3)
                .map((quiz) => (
                  <Link className="pending-session-card" to={`/practice/${quiz.id}`} key={quiz.id}>
                    <div>
                      <h3>{quizLabels[quiz.quizType]}</h3>
                      <p>
                        {plural(quiz.totalQuestions, 'word')} · Started {formatDate(quiz.createdAt)}
                      </p>
                    </div>
                    <span className="text-link">
                      Resume <ArrowRight size={17} />
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        )}
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} onRetry={resource.reload} />
      ) : resource.data?.stats.totalVocabulary === 0 &&
        !(weekly && resource.data.weeklyReview.activeQuizId) ? (
        <section className="card">
          <EmptyState
            title="A few words make a beginning"
            description="Add your own vocabulary first. Your practice will be built around the words you choose."
            action={
              <Link className="button primary" to="/vocabulary/new">
                Add vocabulary <ArrowRight size={17} />
              </Link>
            }
          />
        </section>
      ) : quizType === 'WEAK_WORDS' && !resource.data?.weakWords.length ? (
        <section className="card">
          <EmptyState
            title="Nothing needs extra review"
            description="No words meet the review rule right now. Keep learning with a regular practice session, or finish a saved session above."
            action={
              <Link className="button primary" to="/practice">
                Choose regular practice <ArrowRight size={17} />
              </Link>
            }
          />
        </section>
      ) : (
        <>
          {weekly ? (
            <section className="weekly-practice-intro card">
              <span className="big-soft-icon">
                <Shuffle size={31} />
              </span>
              <div>
                <h2>A little of everything</h2>
                <p>
                  Multiple choice, fill the meaning, and reverse questions. Up to 20 unique words,
                  starting with what you added in the previous 7 days.
                </p>
              </div>
            </section>
          ) : (
            <div className="practice-mode-grid" role="group" aria-label="Learning mode">
              {modes.map(({ id, icon: Icon, description, hint }) => (
                <button
                  type="button"
                  className={`mode-card ${mode === id ? 'selected' : ''}`}
                  key={id}
                  onClick={() => setMode(id)}
                  aria-pressed={mode === id}
                >
                  <span className="mode-card-icon">
                    <Icon size={27} strokeWidth={1.6} />
                  </span>
                  <span className="mode-check">{mode === id && <Check size={15} />}</span>
                  <h2>{modeLabels[id]}</h2>
                  <p>{description}</p>
                  <span className="mode-hint">{hint}</span>
                </button>
              ))}
            </div>
          )}
          <section className="practice-start-panel">
            <div>
              <h3>{weekly ? 'Your week in words' : 'Keep it manageable'}</h3>
              <p>
                {weekly
                  ? 'Finish at your own pace. Reloading this page won’t lose your answers.'
                  : quizType === 'WEAK_WORDS'
                    ? 'Your session includes only words that need extra review.'
                    : `${plural(resource.data?.stats.reviewCount || 0, 'word')} to review · ${plural(resource.data?.stats.newPracticeCount || 0, 'new word')}`}
              </p>
              {!weekly && (
                <label className="session-size">
                  Words this session
                  <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
                    <option value={5}>5 words</option>
                    <option value={10}>10 words</option>
                    <option value={20}>20 words</option>
                  </select>
                </label>
              )}
            </div>
            <button
              type="button"
              className="button primary large"
              disabled={busy || (weekly && !resource.data?.weeklyReview.available)}
              onClick={() => {
                void start()
              }}
            >
              {busy ? <LoaderCircle size={19} className="spinner" /> : <GraduationCap size={20} />}
              {busy
                ? 'Preparing your words…'
                : weekly
                  ? resource.data?.weeklyReview.activeQuizId
                    ? 'Resume weekly review'
                    : 'Start weekly test'
                  : 'Start practice'}
              <ArrowRight size={18} />
            </button>
          </section>
          <ErrorMessage message={error} />
          {weekly && !resource.data?.weeklyReview.available && (
            <div className="notice" role="status">
              <CalendarDays size={19} />
              <span>
                Your weekly review opens{' '}
                {resource.data && formatDate(resource.data.weeklyReview.availableAt)}.{' '}
                <Link className="text-link" to="/weekly-review">
                  See your weekly plan <ArrowRight size={14} />
                </Link>
              </span>
            </div>
          )}
          <div className="practice-note">
            <CircleHelp size={17} />
            <p>
              {weekly
                ? 'Review unlocks after 7 days. You can leave and return to your session using its page link.'
                : 'Fewer words than your selected size? We’ll use what you have. Multiple choice becomes fill the meaning when there aren’t enough different meanings.'}
            </p>
          </div>
        </>
      )}
    </>
  )
}

export function PracticeSessionPage() {
  const { id = '' } = useParams()
  const resource = useResource(() => learningApi.get(id), [id])
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState<{
    questionId: string
    meaning: string
    exampleSentence: string | null
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const quiz = resource.data
  const question =
    quiz?.questions.find((item) => item.id === feedbackId) ||
    quiz?.questions.find((item) => item.isCorrect === null)

  async function reveal() {
    if (!question) return
    setBusy(true)
    setError('')
    try {
      const response = await learningApi.reveal(id, question.id)
      setRevealed({ ...response, questionId: question.id })
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function submit(value?: string, known?: boolean) {
    if (!question || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await learningApi.answer(id, question.id, value, known)
      resource.setData(response.quiz)
      setFeedbackId(question.id)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  function next() {
    setFeedbackId(null)
    setAnswer('')
    setRevealed(null)
    setError('')
    window.scrollTo(0, 0)
  }
  function submitText(event: FormEvent) {
    event.preventDefault()
    if (answer.trim()) void submit(answer.trim())
  }

  if (resource.loading) return <Loading label="Opening your practice session…" />
  if (resource.error || !quiz)
    return (
      <>
        <Link className="back-link" to="/practice">
          <ArrowLeft size={16} /> Back to practice
        </Link>
        <ErrorMessage message={resource.error} onRetry={resource.reload} />
      </>
    )
  if (quiz.completedAt && !feedbackId) return <QuizResults quiz={quiz} />
  if (!question)
    return (
      <ErrorMessage
        message="This session has no unanswered questions. Reload to view your results."
        onRetry={resource.reload}
      />
    )

  const index = quiz.questions.findIndex((item) => item.id === question.id)
  const answered = question.isCorrect !== null
  const revealData = revealed?.questionId === question.id ? revealed : null
  const completedCount = quiz.questions.filter((item) => item.isCorrect !== null).length
  const instruction =
    question.mode === 'FLASHCARD'
      ? 'Think of the meaning. Ready to take a look?'
      : question.mode === 'MULTIPLE_CHOICE'
        ? 'Choose the correct meaning'
        : question.mode === 'REVERSE'
          ? 'What’s the English word?'
          : 'Write the Vietnamese meaning'

  return (
    <div className="session-page">
      <div className="session-header">
        <Link
          className="back-link"
          to={quiz.quizType === 'WEEKLY' ? '/weekly-review' : '/practice'}
        >
          <ArrowLeft size={16} /> Leave practice
        </Link>
        <span className="session-type">
          <GraduationCap size={16} />
          {quizLabels[quiz.quizType]}
        </span>
      </div>
      <div className="session-progress-heading">
        <span>
          Word <strong>{index + 1}</strong> of {quiz.totalQuestions}
        </span>
        <span>{completedCount} answered</span>
      </div>
      <div
        className="progress-track session-progress"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={quiz.totalQuestions}
      >
        <span style={{ width: `${(completedCount / quiz.totalQuestions) * 100}%` }} />
      </div>
      <section className="quiz-card card">
        <div className="quiz-mode-tag">{modeLabels[question.mode]}</div>
        <p className="quiz-instruction">{instruction}</p>
        <h1 className={`quiz-prompt ${question.mode === 'REVERSE' ? 'meaning-prompt' : ''}`}>
          {question.prompt}
        </h1>
        {question.mode === 'FLASHCARD' ? (
          <div className="flashcard-content">
            {!answered && !revealData ? (
              <>
                <div className="flashcard-hidden">
                  <Heart size={27} />
                  <span>A moment to remember</span>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    void reveal()
                  }}
                >
                  {busy ? <LoaderCircle size={17} className="spinner" /> : <Layers size={18} />}
                  {question.revealed ? 'Show meaning again' : 'Reveal meaning'}
                </button>
              </>
            ) : (
              <>
                <div className="flashcard-reveal">
                  <span className="eyebrow">MEANING</span>
                  <h2>{revealData?.meaning || question.correctAnswer}</h2>
                  {revealData?.exampleSentence && <p>“{revealData.exampleSentence}”</p>}
                </div>
                {!answered && (
                  <div className="flashcard-actions">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        void submit(undefined, false)
                      }}
                    >
                      <RotateCcw size={17} /> I don’t know
                    </button>
                    <button
                      type="button"
                      className="button primary"
                      disabled={busy}
                      onClick={() => {
                        void submit(undefined, true)
                      }}
                    >
                      <Check size={18} /> I know this
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : question.mode === 'MULTIPLE_CHOICE' ? (
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => (
              <button
                type="button"
                key={option}
                className={`quiz-option ${answered && option === question.correctAnswer ? 'correct' : ''} ${answered && option === question.userAnswer && !question.isCorrect ? 'incorrect' : ''}`}
                disabled={busy || answered}
                onClick={() => {
                  void submit(option)
                }}
              >
                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option}</span>
                {answered && option === question.correctAnswer && <Check size={18} />}
              </button>
            ))}
          </div>
        ) : (
          <form className="quiz-answer-form" onSubmit={submitText}>
            <label className="sr-only" htmlFor="quiz-answer">
              {question.mode === 'REVERSE' ? 'English word' : 'Vietnamese meaning'}
            </label>
            <input
              key={question.id}
              id="quiz-answer"
              aria-describedby={!answered ? 'quiz-answer-hint' : undefined}
              value={answered ? question.userAnswer || '' : answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={busy || answered}
              placeholder={
                question.mode === 'REVERSE' ? 'Type the English word…' : 'Type the meaning…'
              }
              autoComplete="off"
              spellCheck={false}
              maxLength={1000}
              autoFocus
            />
            {!answered && (
              <p className="quiz-helper" id="quiz-answer-hint">
                {question.mode === 'REVERSE'
                  ? 'Use the English word you saved. Capital letters and extra spaces are okay.'
                  : 'Use any meaning you saved (separated by / or ;). Capital letters and extra spaces are okay; keep Vietnamese accents.'}
              </p>
            )}
            {!answered && (
              <button className="button primary" disabled={busy || !answer.trim()}>
                {busy ? <LoaderCircle size={18} className="spinner" /> : <Check size={18} />} Check
                answer
              </button>
            )}
          </form>
        )}
        {answered && (
          <div
            className={`answer-feedback ${question.isCorrect ? 'correct' : 'incorrect'}`}
            role="status"
          >
            <span className="feedback-icon">
              {question.isCorrect ? <CheckCircle2 size={24} /> : <RotateCcw size={23} />}
            </span>
            <div>
              <h3>{question.isCorrect ? 'You’ve got it!' : 'A little more practice will help'}</h3>
              <p>
                {question.isCorrect
                  ? question.mode === 'FLASHCARD'
                    ? 'Another step toward remembering this word.'
                    : 'Correct answer:'
                  : 'The answer to remember:'}{' '}
                <strong>{question.correctAnswer}</strong>
              </p>
            </div>
          </div>
        )}
        <ErrorMessage
          message={error}
          onRetry={() => {
            next()
            resource.reload()
          }}
        />
        {answered && (
          <button type="button" className="button primary next-question" onClick={next}>
            {quiz.completedAt ? 'See my results' : 'Next word'}
            <ArrowRight size={18} />
          </button>
        )}
        {busy && question.mode === 'MULTIPLE_CHOICE' && (
          <span className="answer-saving" role="status">
            <LoaderCircle size={16} className="spinner" /> Saving your answer…
          </span>
        )}
      </section>
      <p className="session-footer">
        <Check size={15} /> Your progress is saved after each answer. Take your time.
      </p>
    </div>
  )
}

function QuizResults({ quiz }: { quiz: QuizSession }) {
  const [showMistakes, setShowMistakes] = useState(false)
  const mistakes = quiz.questions.filter((question) => question.isCorrect === false)
  const accuracy = quiz.totalQuestions ? Math.round((quiz.score / quiz.totalQuestions) * 100) : 0
  return (
    <>
      <PageHeading
        eyebrow="ANOTHER STEP FORWARD"
        title="Look how far you’ve come"
        description={`${quizLabels[quiz.quizType]} complete. Every answer helps you learn.`}
      />
      <section
        className={`results-card card ${quiz.quizType === 'WEEKLY' ? 'weekly-results' : ''}`}
      >
        {quiz.quizType === 'WEEKLY' && (
          <span className="achievement-label">
            <Sparkles size={15} /> YOUR WEEK IN WORDS
          </span>
        )}
        <span className="results-icon">
          {quiz.quizType === 'WEEKLY' ? <Trophy size={35} /> : <GraduationCap size={35} />}
        </span>
        <h2>{accuracy >= 80 ? 'A little practice paid off' : 'You’re building something good'}</h2>
        <p>
          {accuracy >= 80
            ? 'Keep giving your words a little time. It makes a difference.'
            : 'Now you know which words need another look. That’s progress, too.'}
        </p>
        <div className="score-display">
          <strong>
            {quiz.score}
            <span> / {quiz.totalQuestions}</span>
          </strong>
          <div>
            <span>{accuracy}%</span>
            <small>accuracy</small>
          </div>
        </div>
        <div className="results-breakdown">
          <div>
            <span className="result-dot purple" />
            <strong>{quiz.mastered}</strong>
            <span>Mastered</span>
          </div>
          <div>
            <span className="result-dot yellow" />
            <strong>{quiz.learning}</strong>
            <span>Still learning</span>
          </div>
          <div>
            <span className="result-dot rose" />
            <strong>{quiz.needReview}</strong>
            <span>Need review</span>
          </div>
        </div>
        <div className="results-actions">
          {mistakes.length > 0 && (
            <button
              type="button"
              className="button secondary"
              aria-expanded={showMistakes}
              aria-controls="quiz-mistakes"
              onClick={() => setShowMistakes(!showMistakes)}
            >
              <RotateCcw size={17} />
              {showMistakes ? 'Hide mistakes' : 'Review mistakes'}
            </button>
          )}
          <Link
            className="button secondary"
            to={quiz.quizType === 'WEAK_WORDS' ? '/practice?type=WEAK_WORDS' : '/practice'}
          >
            Practice again <ArrowRight size={17} />
          </Link>
          <Link className="button primary" to="/">
            Back to my overview <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      {showMistakes && (
        <section className="card mistakes-card" id="quiz-mistakes">
          <div className="section-heading">
            <div>
              <h2>A closer look at your mistakes</h2>
              <p>Give these words another moment.</p>
            </div>
            <span className="count-pill">{mistakes.length}</span>
          </div>
          <div className="mistake-list">
            {mistakes.map((question) => (
              <div key={question.id}>
                <span className="mistake-icon">
                  <X size={17} />
                </span>
                <div>
                  <h3>{question.word || question.prompt}</h3>
                  <span className="mistake-mode">{modeLabels[question.mode]}</span>
                  <p>
                    Your answer: <span>{question.userAnswer}</span>
                  </p>
                  <p className="correct-answer">
                    Remember: <strong>{question.correctAnswer}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="results-tip">
        <Target size={20} />
        <p>
          Mastery grows from correct answers minus missed answers. Review a word again to help it
          move forward.
        </p>
      </div>
    </>
  )
}
