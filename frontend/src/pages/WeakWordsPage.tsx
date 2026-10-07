import { ArrowRight, BookOpen, Heart, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { vocabularyApi } from '../lib/api'
import { formatDate, plural } from '../lib/format'
import { useResource } from '../lib/useResource'
import { EmptyState, ErrorMessage, Loading, MasteryBadge, PageHeading } from '../components/ui'

export default function WeakWordsPage() {
  const resource = useResource(() => vocabularyApi.list({ weakOnly: true }))
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE EXTRA ATTENTION"
        title="Words to review"
        description="Some words take a little more time. That’s part of learning."
        action={
          resource.data &&
          resource.data.length > 0 && (
            <Link className="button primary" to="/practice?type=WEAK_WORDS">
              <Target size={17} /> Practice weak words
              <ArrowRight size={17} />
            </Link>
          )
        }
      />
      <div className="review-explainer">
        <span>
          <Heart size={24} />
        </span>
        <div>
          <h3>Practice is how tricky becomes familiar</h3>
          <p>
            These words have at least two missed answers and at least as many misses as correct
            answers. Focused practice helps bring them back into balance.
          </p>
        </div>
      </div>
      {resource.loading ? (
        <Loading label="Finding words to review…" />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} onRetry={resource.reload} />
      ) : !resource.data?.length ? (
        <section className="card">
          <EmptyState
            title="A clean slate"
            description="No words need extra attention right now. Try a practice session to see what you know and what needs another look."
            action={
              <Link className="button primary" to="/practice">
                Start practice <ArrowRight size={17} />
              </Link>
            }
          />
        </section>
      ) : (
        <>
          <div className="library-meta">
            <span>{plural(resource.data.length, 'word')} for a closer look</span>
            <span className="muted">Only these words appear in weak-word practice</span>
          </div>
          <div className="weak-word-grid">
            {resource.data.map((word) => (
              <article className="card weak-word-card" key={word.id}>
                <div className="weak-word-top">
                  <span className="topic-label">{word.topicName || 'My vocabulary'}</span>
                  <MasteryBadge level={word.masteryLevel} />
                </div>
                <h2>{word.word}</h2>
                <p className="weak-meaning">{word.meaning}</p>
                {word.exampleSentence && <blockquote>{word.exampleSentence}</blockquote>}
                <div className="weak-word-stats">
                  <span>
                    <strong>{word.wrongCount}</strong> missed
                  </span>
                  <span>
                    <strong>{word.correctCount}</strong> correct
                  </span>
                </div>
                <div className="weak-word-footer">
                  <span>
                    {word.lastReviewed
                      ? `Reviewed ${formatDate(word.lastReviewed)}`
                      : 'Not reviewed yet'}
                  </span>
                  <Link to={`/vocabulary/${word.id}/edit`} className="text-link">
                    <BookOpen size={15} /> View word
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
