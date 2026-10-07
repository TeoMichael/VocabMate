import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, BookOpen, LoaderCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MasteryLevel } from '../types'
import { masteryLabels } from '../lib/format'

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </header>
  )
}

export function Loading({ label = 'Loading your learning space…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spinner" size={25} />
      <span>{label}</span>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={19} />
      <div>
        {message}
        {onRetry && (
          <button type="button" className="text-button" onClick={onRetry}>
            Try again <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <BookOpen size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function MasteryBadge({ level }: { level: MasteryLevel }) {
  return (
    <span className={`badge mastery-${level.toLowerCase()}`}>
      <span className="badge-dot" />
      {masteryLabels[level]}
    </span>
  )
}

export function SectionHeading({
  title,
  description,
  link,
  linkLabel,
}: {
  title: string
  description?: string
  link?: string
  linkLabel?: string
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && (
        <Link className="text-link" to={link}>
          {linkLabel || 'View all'} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) dialog.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function ProgressRing({ value, total }: { value: number; total: number }) {
  const percent = total ? Math.min(100, (value / total) * 100) : 0
  return (
    <div className="progress-ring" aria-label={`${value} of ${total} words practiced`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r="42" />
        <circle
          className="ring-value"
          cx="50"
          cy="50"
          r="42"
          strokeDasharray={`${percent * 2.639} 263.9`}
        />
      </svg>
      <div>
        <strong>
          {value}
          <small> / {total}</small>
        </strong>
        <span>words today</span>
      </div>
    </div>
  )
}
