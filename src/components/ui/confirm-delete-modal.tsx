'use client'
import { useState } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDeleteModal({
  open, title, description, confirmLabel = 'Delete', onConfirm, onClose,
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-500 border-red-500"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
