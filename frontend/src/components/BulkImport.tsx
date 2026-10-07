import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, LoaderCircle, Upload } from 'lucide-react'
import type { ImportResult, Topic } from '../types'
import { errorMessage, vocabularyApi } from '../lib/api'
import { plural } from '../lib/format'
import { Dialog, ErrorMessage } from './ui'

export default function BulkImport({
  open,
  topics,
  onClose,
  onImported,
}: {
  open: boolean
  topics: Topic[]
  onClose: () => void
  onImported: () => void
}) {
  const [text, setText] = useState('')
  const [topicId, setTopicId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const selectedTopicId = topics.some((topic) => topic.id === topicId) ? topicId : ''

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await vocabularyApi.import(text, selectedTopicId || null)
      setResult(response)
      setText(response.invalidLines.map((line) => line.text).join('\n'))
      onImported()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      title="Add a handful of words"
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <p className="dialog-description">
        Paste up to 500 entries, one per line: word - meaning. Leave a space on each side of the
        hyphen.
      </p>
      <ErrorMessage message={error} />
      {result && (
        <div className={`notice ${result.importedCount > 0 ? 'success' : 'error'}`} role="status">
          <CheckCircle2 size={20} />
          <span>
            {result.importedCount > 0
              ? `${plural(result.importedCount, 'word')} added to your vocabulary.`
              : 'No words added yet.'}
            {result.invalidLines.length > 0 && ' Correct the remaining lines below and try again.'}
          </span>
        </div>
      )}
      {result && result.invalidLines.length > 0 && (
        <div className="import-errors">
          <strong>These lines need a little attention</strong>
          <ul>
            {result.invalidLines.map((line) => (
              <li key={line.lineNumber}>
                <span>
                  Line {line.lineNumber}: {line.text || '(empty line)'}
                </span>
                <small>{line.reason}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form className="form-stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="bulk-vocabulary">Vocabulary</label>
          <textarea
            id="bulk-vocabulary"
            aria-describedby="bulk-vocabulary-hint"
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            rows={8}
            maxLength={320000}
            placeholder={
              'acquire - đạt được\npurchase - mua\navailable - có sẵn\nemployee - nhân viên'
            }
          />
          <span id="bulk-vocabulary-hint" className="field-hint">
            Valid lines are saved. Invalid lines are shown for you to correct.
          </span>
        </div>
        <label className="field">
          Topic <span className="optional">optional</span>
          <select value={selectedTopicId} onChange={(event) => setTopicId(event.target.value)}>
            <option value="">No topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
            Done
          </button>
          <button className="button primary" disabled={busy || !text.trim()}>
            {busy ? <LoaderCircle size={17} className="spinner" /> : <Upload size={17} />}
            {busy ? 'Adding words…' : 'Import words'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
