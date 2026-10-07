import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CircleCheck,
  Heart,
  Leaf,
  Plus,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { learningApi, vocabularyApi } from '../lib/api'
import { dateRange, formatDate, plural } from '../lib/format'
import { useResource } from '../lib/useResource'
import {
  EmptyState,
  ErrorMessage,
  Loading,
  MasteryBadge,
  PageHeading,
  ProgressRing,
  SectionHeading,
} from '../components/ui'
import VocabularyTable from '../components/VocabularyTable'

export default function DashboardPage() {
  const { user } = useAuth()
  const resource = useResource(async () => {
    const [stats, words, weekly] = await Promise.all([
      learningApi.statistics(),
      vocabularyApi.list(),
      learningApi.weekly(),
    ])
    return { stats, words, weekly }
  })
  if (resource.loading) return <Loading />
  if (resource.error || !resource.data)
    return <ErrorMessage message={resource.error} onRetry={resource.reload} />
  const { stats, words, weekly } = resource.data
  const weakWords = words
    .filter((word) => word.wrongCount >= 2 && word.wrongCount >= word.correctCount)
    .slice(0, 3)
  const recentWords = [...words]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 4)
  const firstName = user?.name.split(' ')[0]

  return (
    <>
      <PageHeading
        eyebrow="A LITTLE PROGRESS, EVERY DAY"
        title={`Welcome back, ${firstName}`}
        description="Let’s make a few more words feel familiar."
        action={
          <Link className="button secondary" to="/vocabulary/new">
            <Plus size={17} /> Add a word
          </Link>
        }
      />
      <div className="dashboard-hero-grid">
        <section className="daily-practice-card">
          <div className="hero-spark">
            <Sparkles size={22} />
          </div>
          <div className="hero-copy">
            <span className="hero-tag">YOUR DAILY MOMENT</span>
            <h2>
              Small practice.
              <br />
              Lasting confidence.
            </h2>
            <p>
              {stats.totalVocabulary
                ? 'Give your words a little attention today.'
                : 'Start by adding a few words you want to learn.'}
            </p>
            <div className="practice-counts">
              <span>
                <Target size={16} />
                <strong>{stats.reviewCount}</strong> to review
              </span>
              <span>
                <Sprout size={16} />
                <strong>{stats.newPracticeCount}</strong> new words
              </span>
            </div>
            <Link
              className="button primary"
              to={stats.totalVocabulary ? '/practice' : '/vocabulary/new'}
            >
              {stats.totalVocabulary ? 'Start today’s practice' : 'Add your first word'}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-ring" />
            <div className="hero-word-card">
              <Heart size={20} />
              <span>little by little</span>
              <small>từng chút một</small>
              <div>
                <Check size={12} /> You’re growing
              </div>
            </div>
            <span className="hero-art-leaf">
              <Sparkles size={65} strokeWidth={1.3} />
            </span>
          </div>
        </section>
        <section className="card daily-goal-card">
          <div className="daily-goal-heading">
            <span className="eyebrow">YOUR DAILY GOAL</span>
            <span className="soft-icon">
              <Target size={17} />
            </span>
          </div>
          <ProgressRing value={stats.todayPracticed} total={stats.dailyGoal} />
          <h3>
            {stats.todayPracticed >= stats.dailyGoal
              ? 'A little win for today!'
              : 'A few words go a long way'}
          </h3>
          <p>
            {stats.todayPracticed >= stats.dailyGoal
              ? 'You reached your daily goal. Keep going if you feel like it.'
              : `${Math.max(0, stats.dailyGoal - stats.todayPracticed)} more to reach today’s goal.`}
          </p>
        </section>
      </div>
      <div className="stat-grid dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon rose">
            <BookOpen size={21} />
          </span>
          <div>
            <span>Total vocabulary</span>
            <strong>{stats.totalVocabulary}</strong>
            <small>Words in your collection</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon fuchsia">
            <CircleCheck size={21} />
          </span>
          <div>
            <span>Mastered</span>
            <strong>{stats.mastered}</strong>
            <small>Ready to use with confidence</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach">
            <TrendingUp size={21} />
          </span>
          <div>
            <span>Learning & familiar</span>
            <strong>{stats.learning + stats.familiar}</strong>
            <small>Getting a little stronger</small>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon lavender">
            <Sprout size={21} />
          </span>
          <div>
            <span>New words</span>
            <strong>{stats.new}</strong>
            <small>Fresh possibilities</small>
          </div>
        </div>
      </div>
      <div className="dashboard-bottom-grid">
        <div>
          <section className="card recent-words-card">
            <SectionHeading
              title="Recently added"
              description="The newest words in your collection."
              link="/vocabulary"
              linkLabel="My vocabulary"
            />
            {recentWords.length ? (
              <VocabularyTable words={recentWords} compact />
            ) : (
              <EmptyState
                title="A fresh page for your words"
                description="Add vocabulary from your classes, books, or everyday life."
                action={
                  <Link className="button secondary" to="/vocabulary/new">
                    <Plus size={17} /> Add vocabulary
                  </Link>
                }
              />
            )}
          </section>
          <section className="weekly-preview">
            <span className="weekly-preview-icon">
              <CalendarDays size={25} />
            </span>
            <div>
              <p className="eyebrow">YOUR WEEK IN WORDS</p>
              <h3>Make it stick with a weekly review</h3>
              <p>
                {dateRange(weekly.windowStart, weekly.windowEnd)} ·{' '}
                {plural(weekly.wordsLearned, 'new word')}
              </p>
            </div>
            <Link className="button secondary" to="/weekly-review">
              {weekly.activeQuizId
                ? 'Resume review'
                : weekly.questionCount === 0
                  ? 'Your weekly review'
                  : weekly.available
                    ? 'Take a look'
                    : `Ready ${formatDate(weekly.availableAt)}`}
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
        <section className="card review-preview-card">
          <SectionHeading
            title="A little extra attention"
            description="Revisit the words that need you."
            link="/weak-words"
            linkLabel="View all"
          />
          {weakWords.length ? (
            <>
              <div className="weak-preview-list">
                {weakWords.map((word) => (
                  <Link to={`/vocabulary/${word.id}/edit`} key={word.id}>
                    <div>
                      <strong>{word.word}</strong>
                      <span>{word.meaning}</span>
                    </div>
                    <MasteryBadge level={word.masteryLevel} />
                  </Link>
                ))}
              </div>
              <Link className="button secondary full-width" to="/practice?type=WEAK_WORDS">
                <Target size={16} /> Practice these words
              </Link>
            </>
          ) : (
            <div className="gentle-empty">
              <span>
                <Leaf size={29} />
              </span>
              <h3>Nothing needs extra review yet</h3>
              <p>Keep practicing. Words you find tricky will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
