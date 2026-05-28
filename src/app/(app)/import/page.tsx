'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react'

interface PreviewRow {
  name: string
  segment: string | null
  contact_name: string | null
  contact_role: string | null
  lead_source: string | null
  excel_s_score: number | null
  excel_t_score: number | null
  sweetspot_score: number | null
  notes: string | null
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors?: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (f: File) => {
    setFile(f)
    setPreview(null)
    setResult(null)
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', f)
      formData.append('preview', 'true')
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setPreview(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      handleFile(f)
    }
  }

  return (
    <>
      <Header title="Import" subtitle="Import companies from Excel lead pipeline" />

      <div className="flex-1 p-5 max-w-3xl">
        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center cursor-pointer hover:border-slate-600 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <FileSpreadsheet className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Drop your Excel file here or click to browse</p>
          <p className="text-xs text-slate-600 mt-1">Supports .xlsx and .xls files (SHMA Lead Pipeline format)</p>

          {file && (
            <div className="mt-3 inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5">
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-300">{file.name}</span>
              <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}>
                <X className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300" />
              </button>
            </div>
          )}
        </div>

        {/* Mapping Info */}
        <div className="mt-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Column Mapping</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {[
              ['Selskap', 'Company name'],
              ['Segment', 'Segment'],
              ['Reg. No.', 'Registration number'],
              ['S / T', 'SHMA scores'],
              ['Relasjon 1', 'Primary contact name'],
              ['Epost', 'Contact email'],
              ['Tlf', 'Contact phone'],
              ['Rolle', 'Contact role'],
              ['Leads kom igjennom?', 'Lead source'],
              ['1–11', 'Qualifying scores'],
              ['Sweetspot score', 'AI sweetspot score'],
              ['Notater', 'Notes'],
            ].map(([col, mapped]) => (
              <div key={col} className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">{col}</span>
                <span className="text-slate-700">→</span>
                <span className="text-slate-400">{mapped}</span>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
            {preview ? 'Importing…' : 'Previewing…'}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-300">Import complete</h3>
            </div>
            <div className="flex gap-4 text-sm">
              <div><span className="text-emerald-300 font-semibold">{result.imported}</span> <span className="text-slate-500">imported</span></div>
              <div><span className="text-amber-300 font-semibold">{result.skipped}</span> <span className="text-slate-500">skipped (duplicates)</span></div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-xs text-rose-400">
                {result.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <Button
              className="mt-3"
              size="sm"
              variant="primary"
              onClick={() => router.push('/companies')}
            >
              View Companies
            </Button>
          </div>
        )}

        {preview && !result && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-slate-200">Preview — {preview.length} companies found</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review before importing. Duplicates by name will be skipped.</p>
              </div>
              <Button variant="primary" onClick={confirmImport} loading={loading}>
                <Upload className="h-3.5 w-3.5" /> Import {preview.length} Companies
              </Button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900">
                    <th className="text-left text-slate-500 px-4 py-2.5">Company</th>
                    <th className="text-left text-slate-500 px-3 py-2.5">Segment</th>
                    <th className="text-left text-slate-500 px-3 py-2.5">Contact</th>
                    <th className="text-left text-slate-500 px-3 py-2.5">Lead Source</th>
                    <th className="text-left text-slate-500 px-3 py-2.5">S/T</th>
                    <th className="text-left text-slate-500 px-3 py-2.5">Sweet</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-4 py-2 font-medium text-slate-200">{row.name}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-32 truncate">{row.segment || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{row.contact_name || '—'}</td>
                      <td className="px-3 py-2 text-slate-500 max-w-28 truncate">{row.lead_source || '—'}</td>
                      <td className="px-3 py-2 text-slate-400">{row.excel_s_score ?? '—'}/{row.excel_t_score ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-400">{row.sweetspot_score ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
