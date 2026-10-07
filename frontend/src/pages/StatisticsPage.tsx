import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { learningApi } from '../lib/api'
import { formatDate, quizLabels } from '../lib/format'
import { useResource } from '../lib/useResource'
import { EmptyState, ErrorMessage, Loading, PageHeading, SectionHeading } from '../components/ui'

export default function StatisticsPage() {
  const resource = useResource(async () => {
    const [stats, quizzes] = await Promise.all([learningApi.statistics(), learningApi.history()])
    return { stats, quizzes }
  })
  if (resource.loading) return <Loading label="Gathering your progress…" />
  if (resource.error || !resource.data)
    return <ErrorMessage message={resource.error} onRetry={resource.reload} />
  const { stats, quizzes } = resource.data
  const levels = [
    { label: 'New', count: stats.new, color: 'lilac', description: 'Net score 0' },
    { label: 'Learning', count: stats.learning, color: 'peach', description: 'Net score 1–2' },
    { label: 'Familiar', count: stats.familiar, color: 'sage', description: 'Net score 3–4' },
    { label: 'Mastered', count: stats.mastered, color: 'green', description: 'Net score 5+' },
  ]
  const totalAnswers = stats.correctAnswers + stats.incorrectAnswers
  const trend = stats.wordsOverTime.slice(-14)
  const maxWords = Math.max(1, ...trend.map((point) => point.count))

  return (
    <>
      <PageHeading
        eyebrow="YOUR EFFORT, TAKING SHAPE"
        title="Every word is progress"
        description="A clear picture of what you’re learning and how it’s going."
        action={
          <Link className="button secondary" to="/practice">
            Keep practicing <ArrowRight size={17} />
          </Link>
        }
      />
      <div className="stat-grid statistics-stats">
        <div className="stat-card">
          <span className="stat-icon sage">
            <BookOpen size={21} />
          </span>
          <div>
            <span>Total vocabulary</span>
            <strong>{stats.totalVocabulary}</strong>
            <small>Your personal collection</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">
            <CheckCircle2 size={21} />
          </span>
          <div>
            <span>Overall accuracy</span>
            <strong>{stats.overallAccuracy}%</strong>
            <small>{totalAnswers} answers recorded</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach">
            <GraduationCap size={21} />
          </span>
          <div>
            <span>Quizzes completed</span>
            <strong>{stats.totalQuizzes}</strong>
            <small>Practice that adds up</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon lilac">
            <Target size={21} />
          </span>
          <div>
            <span>Words practiced today</span>
            <strong>
              {stats.todayPracticed}
              <em> / {stats.dailyGoal}</em>
            </strong>
            <small>A daily moment for your words</small>
          </div>
        </div>
      </div>
      <div className="statistics-chart-grid">
        <section className="card mastery-chart">
          <SectionHeading
            title="Your words, getting stronger"
            description="A little practice moves words along."
          />
          <div className="mastery-stacked-bar" aria-label="Vocabulary distribution by mastery">
            {stats.totalVocabulary ? (
              levels.map(
                (level) =>
                  level.count > 0 && (
                    <span
                      key={level.label}
                      className={level.color}
                      style={{ width: `${(level.count / stats.totalVocabulary) * 100}%` }}
                      title={`${level.label}: ${level.count}`}
                    />
                  ),
              )
            ) : (
              <span className="no-data-bar" />
            )}
          </div>
          <div className="mastery-legend">
            {levels.map((level) => (
              <div key={level.label}>
                <span className={`legend-dot ${level.color}`} />
                <div>
                  <strong>{level.label}</strong>
                  <small>{level.description}</small>
                </div>
                <span>
                  {level.count}
                  <small>
                    {stats.totalVocabulary
                      ? Math.round((level.count / stats.totalVocabulary) * 100)
                      : 0}
                    %
                  </small>
                </span>
              </div>
            ))}
          </div>
          <p className="chart-footnote">
            Net score = correct answers − missed answers, with a minimum of 0.
          </p>
        </section>
        <section className="card accuracy-chart">
          <SectionHeading
            title="How your practice adds up"
            description="All recorded answers, including flashcards."
          />
          <div className="accuracy-overview">
            <div className="accuracy-number">
              <strong>
                {stats.overallAccuracy}
                <small>%</small>
              </strong>
              <span>overall accuracy</span>
            </div>
            <div className="accuracy-bar">
              <div
                className="correct"
                style={{
                  width: `${totalAnswers ? (stats.correctAnswers / totalAnswers) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="answer-counts">
              <div>
                <span className="legend-dot green" />
                <strong>{stats.correctAnswers}</strong>
                <span>Correct answers</span>
              </div>
              <div>
                <span className="legend-dot peach" />
                <strong>{stats.incorrectAnswers}</strong>
                <span>Missed answers</span>
              </div>
            </div>
          </div>
          <div className="accuracy-note">
            <TrendingUp size={21} />
            <p>
              Missed answers are a useful clue. They help you see which words need another look.
            </p>
          </div>
        </section>
      </div>
      <section className="card word-trend-card">
        <SectionHeading
          title="New words along the way"
          description="Words added to your vocabulary over the last 14 days."
        />
        <div
          className="trend-chart"
          role="img"
          aria-label={trend
            .map((point) => `${formatDate(point.date)}: ${point.count} words`)
            .join(', ')}
        >
          <div className="trend-bars">
            {trend.map((point) => (
              <div className="trend-column" key={point.date}>
                <span className="trend-count">{point.count || ''}</span>
                <div className="trend-bar-space">
                  <span
                    className="trend-bar"
                    style={{
                      height: `${(point.count / maxWords) * 100}%`,
                      minHeight: point.count ? 8 : 3,
                    }}
                    title={`${formatDate(point.date)}: ${point.count} words`}
                  />
                </div>
                <span className="trend-date">{formatDate(point.date, { day: 'numeric' })}</span>
              </div>
            ))}
          </div>
          <div className="trend-months">
            <span>{trend[0] && formatDate(trend[0].date)}</span>
            <span>{trend.at(-1) && formatDate(trend.at(-1)!.date)}</span>
          </div>
        </div>
        {!trend.some((point) => point.count > 0) && (
          <p className="chart-footnote centered">
            New words you add will appear here. Start with one that matters to you.
          </p>
        )}
      </section>
      <section className="card quiz-history-card">
        <SectionHeading
          title="Your recent practice"
          description="Completed sessions and the steps you’ve taken."
        />
        {quizzes.length ? (
          <div className="quiz-history-list">
            {quizzes.slice(0, 10).map((quiz) => (
              <Link to={`/practice/${quiz.id}`} key={quiz.id}>
                <span className="history-icon">
                  <BarChart3 size={20} />
                </span>
                <div>
                  <strong>{quizLabels[quiz.quizType]}</strong>
                  <span>
                    {formatDate(quiz.completedAt || quiz.createdAt, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {quiz.totalQuestions} questions
                  </span>
                </div>
                <span className="history-score">
                  <strong>
                    {quiz.score} / {quiz.totalQuestions}
                  </strong>
                  <small>{Math.round((quiz.score / quiz.totalQuestions) * 100)}% accuracy</small>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your next step is waiting"
            description="Complete a practice session and your results will appear here."
            action={
              <Link className="button secondary" to="/practice">
                Start practice <ArrowRight size={17} />
              </Link>
            }
          />
        )}
      </section>
    </>
  )
}
