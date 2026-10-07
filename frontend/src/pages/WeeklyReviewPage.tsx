import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Layers,
  Heart,
  LockKeyhole,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { learningApi } from '../lib/api'
import { dateRange, formatDate, plural } from '../lib/format'
import { useResource } from '../lib/useResource'
import { EmptyState, ErrorMessage, Loading, PageHeading } from '../components/ui'

export default function WeeklyReviewPage() {
  const resource = useResource(learningApi.weekly)
  return (
    <>
      <PageHeading
        eyebrow="MAKE THIS WEEK’S WORDS STICK"
        title="Your weekly review"
        description="A thoughtful look back. A stronger step forward."
      />
      {resource.loading ? (
        <Loading label="Preparing your week in words…" />
      ) : resource.error || !resource.data ? (
        <ErrorMessage message={resource.error} onRetry={resource.reload} />
      ) : (
        <>
          <section className="weekly-feature">
            <div className="weekly-feature-art" aria-hidden="true">
              <span className="weekly-calendar">
                <CalendarDays size={67} strokeWidth={1.25} />
                <small>
                  YOUR WEEK
                  <br />
                  IN WORDS
                </small>
              </span>
              <span className="weekly-art-leaf">
                <Heart size={44} strokeWidth={1.5} />
              </span>
            </div>
            <div className="weekly-feature-content">
              <span className={`status-pill ${resource.data.available ? 'ready' : ''}`}>
                {resource.data.available ? (
                  <>
                    <Check size={14} /> Ready when you are
                  </>
                ) : (
                  <>
                    <Clock3 size={14} /> Growing with you
                  </>
                )}
              </span>
              <h2>{dateRange(resource.data.windowStart, resource.data.windowEnd)}</h2>
              <p>
                A review built from your own vocabulary over the previous 7 days, with a little
                extra care for the words you find tricky.
              </p>
              <div className="weekly-numbers">
                <div>
                  <strong>{resource.data.wordsLearned}</strong>
                  <span>Words added this week</span>
                </div>
                <div>
                  <strong>{resource.data.questionCount}</strong>
                  <span>Questions in your review</span>
                </div>
              </div>
              {resource.data.activeQuizId ? (
                <Link className="button primary" to={`/practice/${resource.data.activeQuizId}`}>
                  Resume weekly review <ArrowRight size={18} />
                </Link>
              ) : resource.data.questionCount === 0 ? (
                <Link className="button primary" to="/vocabulary/new">
                  Add your first word <ArrowRight size={18} />
                </Link>
              ) : resource.data.available ? (
                <Link className="button primary" to="/practice?type=WEEKLY">
                  Start weekly test <ArrowRight size={18} />
                </Link>
              ) : (
                <div className="weekly-lock">
                  <LockKeyhole size={19} />
                  <div>
                    <strong>
                      Available{' '}
                      {formatDate(resource.data.availableAt, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </strong>
                    <span>
                      {resource.data.lastQuizId
                        ? 'Your next review opens 7 days after the last one.'
                        : 'Your first review opens 7 days after you join.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
          <div className="weekly-method">
            <h2>A review with a little intention</h2>
            <p>Your test selects up to 20 different words in this order.</p>
            <div className="weekly-method-grid">
              <div className="card">
                <span className="step-number">01</span>
                <span className="method-icon">
                  <CalendarDays size={22} />
                </span>
                <h3>This week’s new words</h3>
                <p>Words you added in the previous 7 days come first.</p>
              </div>
              <div className="card">
                <span className="step-number">02</span>
                <span className="method-icon">
                  <Target size={22} />
                </span>
                <h3>A little extra review</h3>
                <p>Tricky words get another chance to become familiar.</p>
              </div>
              <div className="card">
                <span className="step-number">03</span>
                <span className="method-icon">
                  <Layers size={22} />
                </span>
                <h3>Keep what you’ve learned</h3>
                <p>Older words round out the test when there’s room.</p>
              </div>
            </div>
          </div>
          <section className="card weekly-history">
            {resource.data.lastQuizId ? (
              <>
                <div>
                  <span className="soft-icon">
                    <Check size={20} />
                  </span>
                  <h3>Your last weekly review</h3>
                  <p>Your results and mistakes are here whenever you need them.</p>
                </div>
                <Link className="button secondary" to={`/practice/${resource.data.lastQuizId}`}>
                  See my results <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <EmptyState
                title="Your first chapter is still growing"
                description={
                  resource.data.questionCount
                    ? `Add words and practice this week. Your first weekly review will bring together ${plural(resource.data.questionCount, 'question')} from your collection.`
                    : 'Add some vocabulary and practice this week. Your first weekly review will bring together the words you choose.'
                }
                action={
                  <Link
                    className="button secondary"
                    to={resource.data.questionCount ? '/practice' : '/vocabulary/new'}
                  >
                    {resource.data.questionCount
                      ? 'Keep practicing this week'
                      : 'Add your first word'}
                    <ArrowRight size={16} />
                  </Link>
                }
              />
            )}
          </section>
        </>
      )}
    </>
  )
}
