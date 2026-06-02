'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { FEEDBACK_TYPES } from '@/lib/types'
import { MessageSquarePlus, CheckCircle2 } from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const FEEDBACK_TYPE_OPTIONS = FEEDBACK_TYPES.map(t => ({ value: t, label: t }))

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    area: '',
    feedback_type: '',
    comment: '',
    priority: 'medium',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setOpen(false)
          setForm({ area: '', feedback_type: '', comment: '', priority: 'medium' })
        }, 2500)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 rounded-full shadow-lg transition-colors text-xs font-medium"
        title="Give feedback"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Give feedback" size="sm">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm text-emerald-300 font-medium">Feedback sent. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <Input
              label="Area"
              placeholder="Which part of the app?"
              value={form.area}
              onChange={set('area')}
            />
            <Select
              label="Type"
              value={form.feedback_type}
              onChange={set('feedback_type')}
              placeholder="Select type"
              options={FEEDBACK_TYPE_OPTIONS}
            />
            <Textarea
              label="Comment"
              placeholder="What did you notice? What should change?"
              required
              rows={4}
              value={form.comment}
              onChange={set('comment')}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={set('priority')}
              options={PRIORITY_OPTIONS}
            />
            <Button type="submit" variant="primary" className="w-full" loading={submitting}>
              Send feedback
            </Button>
          </form>
        )}
      </Modal>
    </>
  )
}
