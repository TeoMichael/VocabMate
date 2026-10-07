import { useEffect, useState } from 'react'
import {
  FolderOpen,
  LoaderCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Vocabulary } from '../types'
import { errorMessage, topicApi, vocabularyApi } from '../lib/api'
import { useResource } from '../lib/useResource'
import { masteryLabels, plural } from '../lib/format'
import { Dialog, EmptyState, ErrorMessage, Loading, PageHeading } from '../components/ui'
import VocabularyTable from '../components/VocabularyTable'
import TopicManager from '../components/TopicManager'
import BulkImport from '../components/BulkImport'

export default function VocabularyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [topicId, setTopicId] = useState('')
  const [masteryLevel, setMasteryLevel] = useState('')
  const [topicsOpen, setTopicsOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleting, setDeleting] = useState<Vocabulary | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState<string>(() =>
    typeof location.state?.notice === 'string' ? location.state.notice : '',
  )
  useEffect(() => {
    if (typeof location.state?.notice === 'string') {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])
  const topics = useResource(topicApi.list)
  const selectedTopicId =
    topics.data && !topics.data.some((topic) => topic.id === topicId) ? '' : topicId
  const words = useResource(
    () =>
      vocabularyApi.list({
        search: debouncedSearch || undefined,
        topicId: selectedTopicId || undefined,
        masteryLevel: masteryLevel || undefined,
      }),
    [debouncedSearch, selectedTopicId, masteryLevel],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  async function remove() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await vocabularyApi.remove(deleting.id)
      setNotice(`“${deleting.word}” was removed from your vocabulary.`)
      setDeleting(null)
      words.reload()
      topics.reload()
    } catch (reason) {
      setDeleteError(errorMessage(reason))
    } finally {
      setDeleteBusy(false)
    }
  }

  const filtered = Boolean(search || selectedTopicId || masteryLevel)
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL WORD COLLECTION"
        title="My vocabulary"
        description="Words you choose. Knowledge you keep."
        action={
          <>
            <button type="button" className="button secondary" onClick={() => setImportOpen(true)}>
              <Upload size={17} /> Bulk import
            </button>
            <Link className="button primary" to="/vocabulary/new">
              <Plus size={18} /> Add word
            </Link>
          </>
        }
      />
      {notice && (
        <div className="notice success" role="status">
          {notice}
          <button type="button" className="text-button" onClick={() => setNotice('')}>
            Dismiss
          </button>
        </div>
      )}
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={18} />
          <label className="sr-only" htmlFor="word-search">
            Search vocabulary
          </label>
          <input
            id="word-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search words or meanings…"
          />
        </div>
        <div className="library-filters">
          <SlidersHorizontal size={17} className="filter-icon" />
          <label className="sr-only" htmlFor="topic-filter">
            Filter by topic
          </label>
          <select
            id="topic-filter"
            value={selectedTopicId}
            onChange={(event) => setTopicId(event.target.value)}
          >
            <option value="">All topics</option>
            {topics.data?.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="mastery-filter">
            Filter by progress
          </label>
          <select
            id="mastery-filter"
            value={masteryLevel}
            onChange={(event) => setMasteryLevel(event.target.value)}
          >
            <option value="">All progress</option>
            {Object.entries(masteryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="library-meta">
        <span>
          {words.loading ? 'Finding your words…' : plural(words.data?.length || 0, 'word')}
          {filtered && ' found'}
        </span>
        <button type="button" className="text-button" onClick={() => setTopicsOpen(true)}>
          <FolderOpen size={16} /> Manage topics
        </button>
      </div>
      <ErrorMessage message={topics.error} onRetry={topics.reload} />
      <section className="card library-card">
        {words.loading ? (
          <Loading label="Finding your words…" />
        ) : words.error ? (
          <div className="card-padding">
            <ErrorMessage message={words.error} onRetry={words.reload} />
          </div>
        ) : !words.data?.length ? (
          <EmptyState
            title={filtered ? 'No words match just yet' : 'Your next word starts here'}
            description={
              filtered
                ? 'Try another search or clear your filters to see more words.'
                : 'Add your first word, or paste a whole list with bulk import. Your learning journey starts with your own vocabulary.'
            }
            action={
              filtered ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setSearch('')
                    setTopicId('')
                    setMasteryLevel('')
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <Link className="button primary" to="/vocabulary/new">
                  <Plus size={17} /> Add your first word
                </Link>
              )
            }
          />
        ) : (
          <VocabularyTable
            words={words.data}
            onDelete={(word) => {
              setDeleteError('')
              setDeleting(word)
            }}
          />
        )}
      </section>
      <div className="library-tip">
        <span className="tip-icon">✦</span>
        <p>A useful example sentence gives a new word a familiar place to live.</p>
      </div>
      <TopicManager
        open={topicsOpen}
        onClose={() => setTopicsOpen(false)}
        onChanged={() => {
          topics.reload()
          words.reload()
        }}
      />
      <BulkImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        topics={topics.data || []}
        onImported={() => {
          words.reload()
          topics.reload()
        }}
      />
      <Dialog
        open={Boolean(deleting)}
        title="Remove this word?"
        onClose={() => {
          if (!deleteBusy) setDeleting(null)
        }}
      >
        <p className="dialog-description">
          “{deleting?.word}” and its learning progress will be removed from your vocabulary.
        </p>
        <ErrorMessage message={deleteError} />
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            disabled={deleteBusy}
            onClick={() => setDeleting(null)}
          >
            Keep word
          </button>
          <button
            type="button"
            className="button danger"
            disabled={deleteBusy}
            onClick={() => {
              void remove()
            }}
          >
            {deleteBusy ? <LoaderCircle size={17} className="spinner" /> : <Trash2 size={17} />}{' '}
            Remove word
          </button>
        </div>
      </Dialog>
    </>
  )
}
