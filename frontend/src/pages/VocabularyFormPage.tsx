import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, BookOpen, Check, Lightbulb, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Topic, Vocabulary, VocabularyInput } from '../types'
import { errorMessage, topicApi, vocabularyApi } from '../lib/api'
import { useResource } from '../lib/useResource'
import { ErrorMessage, Loading, PageHeading } from '../components/ui'

const emptyWord: VocabularyInput = { word: '', meaning: '', exampleSentence: '', topicId: null }

export default function VocabularyFormPage() {
  const { id } = useParams()
  const resource = useResource(async () => {
    const [topics, word] = await Promise.all([
      topicApi.list(),
      id ? vocabularyApi.get(id) : Promise.resolve(null),
    ])
    return { topics, word }
  }, [id])
  if (resource.loading) return <Loading />
  if (resource.error || !resource.data)
    return <ErrorMessage message={resource.error} onRetry={resource.reload} />
  return (
    <VocabularyEditor
      key={id || 'new'}
      id={id}
      topics={resource.data.topics}
      item={resource.data.word}
    />
  )
}

function VocabularyEditor({
  id,
  topics,
  item,
}: {
  id?: string
  topics: Topic[]
  item: Vocabulary | null
}) {
  const navigate = useNavigate()
  const [fields, setFields] = useState<VocabularyInput>(() =>
    item
      ? {
          word: item.word,
          meaning: item.meaning,
          exampleSentence: item.exampleSentence || '',
          topicId: item.topicId,
        }
      : emptyWord,
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = {
      ...fields,
      word: fields.word.trim(),
      meaning: fields.meaning.trim(),
      exampleSentence: fields.exampleSentence.trim(),
    }
    try {
      if (id) await vocabularyApi.update(id, data)
      else await vocabularyApi.create(data)
      navigate('/vocabulary', {
        state: { notice: `“${data.word}” was ${id ? 'updated' : 'added to your vocabulary'}.` },
      })
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link className="back-link" to="/vocabulary">
        <ArrowLeft size={16} /> Back to my vocabulary
      </Link>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title={id ? 'Edit your word' : 'Meet your next word'}
        description={
          id
            ? 'Update your word, meaning, or example sentence.'
            : 'Add a word you want to remember. An example helps it stick.'
        }
      />
      <div className="word-form-layout">
        <section className="card card-padding">
          <div className="form-section-label">
            <BookOpen size={19} />
            <h2>{id ? 'Edit vocabulary' : 'Word details'}</h2>
          </div>
          <ErrorMessage message={error} />
          <form className="form-stack" onSubmit={submit}>
            <label className="field">
              English word
              <input
                value={fields.word}
                onChange={(event) => setFields({ ...fields, word: event.target.value })}
                required
                maxLength={120}
                placeholder="e.g. acquire"
                autoFocus
              />
            </label>
            <div className="field">
              <label htmlFor="word-meaning">Meaning</label>
              <textarea
                id="word-meaning"
                aria-describedby="word-meaning-hint"
                rows={2}
                value={fields.meaning}
                onChange={(event) => setFields({ ...fields, meaning: event.target.value })}
                required
                maxLength={500}
                placeholder="e.g. đạt được / có được"
              />
              <span className="field-hint" id="word-meaning-hint">
                For more than one acceptable meaning, separate them with / or ;.
              </span>
            </div>
            <label className="field">
              Example sentence <span className="optional">optional</span>
              <textarea
                rows={3}
                value={fields.exampleSentence}
                onChange={(event) => setFields({ ...fields, exampleSentence: event.target.value })}
                maxLength={1000}
                placeholder="e.g. She acquired new skills."
              />
            </label>
            <div className="field">
              <label htmlFor="word-topic">
                Topic <span className="optional">optional</span>
              </label>
              <select
                id="word-topic"
                aria-describedby="word-topic-hint"
                value={fields.topicId || ''}
                onChange={(event) => setFields({ ...fields, topicId: event.target.value || null })}
              >
                <option value="">No topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              <span className="field-hint" id="word-topic-hint">
                Create or rename topics from your vocabulary library.
              </span>
            </div>
            <div className="form-actions">
              <Link className="button secondary" to="/vocabulary">
                Cancel
              </Link>
              <button
                className="button primary"
                disabled={busy || !fields.word.trim() || !fields.meaning.trim()}
              >
                {busy ? <LoaderCircle size={17} className="spinner" /> : <Check size={18} />}
                {busy ? 'Saving…' : id ? 'Save changes' : 'Add to my vocabulary'}
              </button>
            </div>
          </form>
        </section>
        <aside className="word-form-aside">
          <div className="note-card">
            <span className="note-icon">
              <Lightbulb size={22} />
            </span>
            <h3>Make a connection</h3>
            <p>A sentence about your own life is easier to remember than a definition alone.</p>
            <div className="example-note">
              <strong>acquire</strong>
              <p>“I want to acquire a new skill this semester.”</p>
            </div>
          </div>
          <div className="small-note">
            <Check size={18} />
            <p>
              {id ? (
                'Your learning progress stays with this word. New quizzes use the updated details.'
              ) : (
                <>
                  Your new word starts at <strong>New</strong>. Practice it to build confidence and
                  track your progress.
                </>
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
