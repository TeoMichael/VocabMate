import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Vocabulary } from '../types'
import { formatDate } from '../lib/format'
import { MasteryBadge } from './ui'

export default function VocabularyTable({
  words,
  onDelete,
  compact = false,
}: {
  words: Vocabulary[]
  onDelete?: (word: Vocabulary) => void
  compact?: boolean
}) {
  return (
    <>
      <div className="table-scroll vocabulary-desktop">
        <table className="vocabulary-table">
          <thead>
            <tr>
              <th scope="col">Word & meaning</th>
              <th scope="col">Topic</th>
              <th scope="col">Progress</th>
              {!compact && <th scope="col">Added</th>}
              {onDelete && (
                <th className="actions-heading" scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {words.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link className="word-link" to={`/vocabulary/${item.id}/edit`}>
                    {item.word}
                  </Link>
                  <span className="word-meaning">{item.meaning}</span>
                  {!compact && item.exampleSentence && (
                    <span className="word-example">{item.exampleSentence}</span>
                  )}
                </td>
                <td>
                  {item.topicName ? (
                    <span className="topic-label">{item.topicName}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <MasteryBadge level={item.masteryLevel} />
                  {!compact && (
                    <span className="review-tally">
                      {item.correctCount} correct · {item.wrongCount} missed
                    </span>
                  )}
                </td>
                {!compact && <td className="date-cell">{formatDate(item.createdAt)}</td>}
                {onDelete && (
                  <td>
                    <div className="row-actions">
                      <Link
                        className="icon-button"
                        to={`/vocabulary/${item.id}/edit`}
                        aria-label={`Edit ${item.word}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        className="icon-button danger-icon"
                        onClick={() => onDelete(item)}
                        aria-label={`Delete ${item.word}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="vocabulary-mobile-list">
        {words.map((item) => (
          <article key={item.id} className="vocabulary-mobile-card">
            <div className="vocabulary-mobile-heading">
              <Link className="word-link" to={`/vocabulary/${item.id}/edit`}>
                {item.word}
              </Link>
              <MasteryBadge level={item.masteryLevel} />
            </div>
            <p className="word-meaning">{item.meaning}</p>
            {!compact && item.exampleSentence && (
              <p className="word-example">{item.exampleSentence}</p>
            )}
            {!compact && (
              <p className="review-tally">
                {item.correctCount} correct · {item.wrongCount} missed
              </p>
            )}
            <div className="vocabulary-mobile-footer">
              <div className="vocabulary-mobile-meta">
                {item.topicName && <span className="topic-label">{item.topicName}</span>}
                {!compact && <span className="date-cell">Added {formatDate(item.createdAt)}</span>}
              </div>
              {onDelete && (
                <div className="row-actions">
                  <Link
                    className="icon-button"
                    to={`/vocabulary/${item.id}/edit`}
                    aria-label={`Edit ${item.word}`}
                  >
                    <Pencil size={17} />
                  </Link>
                  <button
                    type="button"
                    className="icon-button danger-icon"
                    onClick={() => onDelete(item)}
                    aria-label={`Delete ${item.word}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
