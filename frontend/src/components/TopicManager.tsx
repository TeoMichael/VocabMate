import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Topic } from '../types'
import { Check, FolderOpen, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { errorMessage, topicApi } from '../lib/api'
import { useResource } from '../lib/useResource'
import { plural } from '../lib/format'
import { Dialog, EmptyState, ErrorMessage, Loading } from './ui'

export default function TopicManager({
  open,
  onClose,
  onChanged,
}: {
  open: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const resource = useResource(topicApi.list, [open])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Topic | null>(null)

  async function mutate(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
      setName('')
      setEditing(null)
      setDeleting(null)
      resource.reload()
      onChanged()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  function create(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) void mutate(() => topicApi.create(name.trim()))
  }

  return (
    <Dialog
      open={open}
      title="Your topics"
      onClose={() => {
        if (!busy) {
          setDeleting(null)
          onClose()
        }
      }}
    >
      <p className="dialog-description">
        Give your words a home. Create topics for the things you’re learning.
      </p>
      <ErrorMessage message={error || resource.error} />
      <form className="inline-form" onSubmit={create}>
        <label className="sr-only" htmlFor="topic-name">
          New topic name
        </label>
        <input
          id="topic-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Travel, TOEIC, Daily English"
          maxLength={80}
          required
        />
        <button className="button primary" disabled={busy || !name.trim()}>
          <Plus size={17} /> Add
        </button>
      </form>
      {resource.loading ? (
        <Loading label="Loading topics…" />
      ) : !resource.data?.length ? (
        <EmptyState
          title="Room for your first topic"
          description="Organize your words around a class, interest, or goal."
        />
      ) : (
        <ul className="topic-manager-list">
          {resource.data.map((topic) => (
            <li key={topic.id}>
              {deleting?.id === topic.id ? (
                <div className="topic-delete-confirm" role="alert">
                  <div>
                    <strong>Remove “{topic.name}”?</strong>
                    <p>This empty topic will be permanently removed.</p>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={() => setDeleting(null)}
                    >
                      Keep topic
                    </button>
                    <button
                      type="button"
                      className="button danger"
                      disabled={busy}
                      onClick={() => {
                        void mutate(() => topicApi.remove(topic.id))
                      }}
                    >
                      {busy ? 'Removing…' : 'Remove topic'}
                    </button>
                  </div>
                </div>
              ) : editing === topic.id ? (
                <form
                  className="inline-form topic-edit"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void mutate(() => topicApi.update(topic.id, editName.trim()))
                  }}
                >
                  <label className="sr-only" htmlFor={`edit-topic-${topic.id}`}>
                    Rename topic
                  </label>
                  <input
                    id={`edit-topic-${topic.id}`}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                    maxLength={80}
                    autoFocus
                  />
                  <button
                    className="icon-button"
                    disabled={busy || !editName.trim()}
                    aria-label="Save topic name"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Cancel rename"
                    onClick={() => setEditing(null)}
                  >
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <>
                  <span className="topic-manager-icon">
                    <FolderOpen size={18} />
                  </span>
                  <div>
                    <strong>{topic.name}</strong>
                    <span>{plural(topic.vocabularyCount, 'word')}</span>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={busy}
                      aria-label={`Rename ${topic.name}`}
                      onClick={() => {
                        setEditing(topic.id)
                        setEditName(topic.name)
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button danger-icon"
                      disabled={busy || topic.vocabularyCount > 0}
                      title={
                        topic.vocabularyCount > 0
                          ? 'Move or delete the words in this topic first'
                          : `Delete ${topic.name}`
                      }
                      aria-label={`Delete ${topic.name}`}
                      onClick={() => {
                        setError('')
                        setDeleting(topic)
                      }}
                    >
                      {busy ? <LoaderCircle size={16} className="spinner" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="field-hint">To delete a topic, first move or remove all of its words.</p>
    </Dialog>
  )
}
