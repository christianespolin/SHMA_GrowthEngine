'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  ChevronRight, ArrowRight, AlertCircle,
} from 'lucide-react'

// Standard field targets for mapping
const FIELD_TARGETS = [
  { key: 'name', label: 'Company Name', required: true },
  { key: 'website', label: 'Website' },
  { key: 'country', label: 'Country' },
  { key: 'registration_number', label: 'Company Registration Number' },
  { key: 'segment', label: 'Industry / Segment' },
  { key: 'subsegment', label: 'Sub-segment' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'employees', label: 'Employees' },
  { key: 'ownership', label: 'Ownership Type' },
  { key: 'description', label: 'Description / Notes' },
  { key: 'headquarters', label: 'Headquarters / Location' },
  { key: 'source', label: 'Source' },
  { key: 'notes', label: 'Notes' },
  { key: 'ebitda', label: 'EBITDA' },
  { key: 'parent_company', label: 'Parent Company' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'linkedin_url', label: 'LinkedIn URL' },
  { key: 'reason_included', label: 'Reason Included' },
]

type Step = 'upload' | 'map' | 'validate' | 'confirm' | 'done'

interface PreviewResult {
  headers: string[]
  sample_rows: Record<string, unknown>[]
  total_rows: number
}

interface ValidateResult {
  batch_id: string
  total_rows: number
  valid_rows: number
  duplicate_rows: number
  error_rows: number
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export default function LongListImportPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [batchName, setBatchName] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFile = async (f: File) => {
    setFile(f)
    setError(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch('/api/long-list/import?step=preview', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
      // Auto-detect obvious column names
      const autoMap: Record<string, string> = {}
      for (const target of FIELD_TARGETS) {
        const match = data.headers.find((h: string) =>
          h.toLowerCase().includes(target.key) ||
          (target.key === 'name' && /company|selskap|name|firma/i.test(h)) ||
          (target.key === 'website' && /web|url|site|http/i.test(h)) ||
          (target.key === 'country' && /country|land|nation/i.test(h)) ||
          (target.key === 'segment' && /segment|industry|sector|bransje/i.test(h)) ||
          (target.key === 'revenue' && /revenue|turnover|omset|sales/i.test(h)) ||
          (target.key === 'employees' && /employ|ansatt|headcount|staff/i.test(h)) ||
          (target.key === 'registration_number' && /reg|org\.|orgnr|company.no|cvr/i.test(h)) ||
          (target.key === 'notes' && /note|comment|remark|notat/i.test(h))
        )
        if (match) autoMap[target.key] = match
      }
      setMapping(autoMap)
      setStep('map')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!file || !batchName.trim()) { setError('Please enter a batch name'); return }
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mapping', JSON.stringify(mapping))
      fd.append('batch_name', batchName)
      fd.append('source_name', sourceName)
      const res = await fetch('/api/long-list/import?step=validate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setValidateResult(data)
      setStep('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!validateResult) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('batch_id', validateResult.batch_id)
      const res = await fetch('/api/long-list/import?step=execute', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImportResult(data)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const StepIndicator = () => {
    const steps = [
      { id: 'upload', label: 'Upload' },
      { id: 'map', label: 'Map Columns' },
      { id: 'confirm', label: 'Review' },
      { id: 'done', label: 'Done' },
    ]
    const stepOrder = ['upload', 'map', 'validate', 'confirm', 'done']
    const currentIdx = stepOrder.indexOf(step)
    return (
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => {
          const sIdx = stepOrder.indexOf(s.id)
          const active = s.id === step || (s.id === 'confirm' && step === 'validate')
          const done = sIdx < currentIdx
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                done ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                'bg-slate-800 text-slate-600 border border-slate-700'
              }`}>
                {done && <CheckCircle2 className="w-3 h-3" />}
                {s.label}
              </div>
              {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700" />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <Header
        title="Long List Import"
        subtitle="Import companies from Excel or CSV into the Growth Engine"
      />
      <div className="flex-1 p-5 max-w-4xl">
        <StepIndicator />

        {/* Context note */}
        <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
          <p className="font-medium text-slate-300 mb-1">Long List import — what this does</p>
          <p>This imports your pre-filtered company list into the Growth Engine at <strong className="text-slate-300">Longlist</strong> stage.
            Companies will pass through AI qualification, human review, and outreach preparation before any contact is made.
            Duplicate detection runs automatically — existing active companies are protected from overwrite.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {/* ── Step: Upload ── */}
        {step === 'upload' && (
          <div
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-16 text-center cursor-pointer hover:border-slate-600 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <FileSpreadsheet className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Drop your Excel or CSV file here</p>
            <p className="text-xs text-slate-600 mt-1">Accepts .xlsx, .xls or .csv — any column structure</p>
            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
                Reading file…
              </div>
            )}
          </div>
        )}

        {/* ── Step: Map Columns ── */}
        {step === 'map' && preview && (
          <div className="space-y-6">
            {/* Batch info */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Import Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Batch Name *</label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={e => setBatchName(e.target.value)}
                    placeholder="e.g. German Robotics Q3 2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Source Name</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={e => setSourceName(e.target.value)}
                    placeholder="e.g. Manus AI export, Manual research"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-600">
                File: <span className="text-slate-400">{file?.name}</span> — {preview.total_rows} rows detected
              </p>
            </div>

            {/* Column mapping */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Column Mapping</h3>
                <p className="text-xs text-slate-600 mt-0.5">Match your spreadsheet columns to Growth Engine fields. Auto-detected where possible.</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {FIELD_TARGETS.map(target => (
                  <div key={target.key} className="flex items-center gap-2">
                    <div className="w-40 flex-shrink-0">
                      <span className="text-xs text-slate-300">{target.label}</span>
                      {target.required && <span className="text-xs text-rose-400 ml-0.5">*</span>}
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-700 flex-shrink-0" />
                    <select
                      value={mapping[target.key] || '__none__'}
                      onChange={e => setMapping(m => ({ ...m, [target.key]: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="__none__">— not mapped —</option>
                      {preview.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample preview */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sample rows (first 5)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {preview.headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/50">
                        {preview.headers.map(h => (
                          <td key={h} className="px-3 py-1.5 text-slate-400 max-w-32 truncate">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setStep('upload'); setFile(null); setPreview(null) }}>
                Back
              </Button>
              <Button variant="primary" onClick={handleValidate} loading={loading} disabled={!batchName.trim()}>
                Run Validation & Duplicate Check <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === 'confirm' && validateResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">{validateResult.valid_rows}</div>
                <div className="text-xs text-slate-500 mt-0.5">Valid rows ready to import</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className={`text-2xl font-bold ${validateResult.duplicate_rows > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {validateResult.duplicate_rows}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Duplicates detected (will be skipped or need review)</div>
              </div>
              {validateResult.error_rows > 0 && (
                <div className="bg-slate-800 border border-rose-500/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-rose-400">{validateResult.error_rows}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Invalid rows (will be skipped)</div>
                </div>
              )}
            </div>

            {validateResult.duplicate_rows > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Duplicates detected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {validateResult.duplicate_rows} companies matched existing records. They will be skipped on import.
                    You can review duplicates in the import detail page after import.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">
                <strong className="text-slate-200">{validateResult.valid_rows - validateResult.duplicate_rows} new companies</strong> will be
                added at <strong className="text-slate-200">Longlist</strong> stage.
                No outreach will be attempted until they pass AI qualification and human review.
                Existing active companies are fully protected.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep('map')}>Back</Button>
              <Button variant="primary" onClick={handleExecute} loading={loading}>
                <Upload className="w-3.5 h-3.5" /> Import {validateResult.valid_rows - validateResult.duplicate_rows} Companies
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === 'done' && importResult && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-300">Import complete</h3>
              </div>
              <div className="flex gap-6 text-sm">
                <div><span className="text-emerald-300 font-semibold text-xl">{importResult.imported}</span><span className="text-slate-500 ml-1">companies imported</span></div>
                <div><span className="text-amber-300 font-semibold text-xl">{importResult.skipped}</span><span className="text-slate-500 ml-1">skipped</span></div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3 text-xs text-rose-400 space-y-1">
                  {importResult.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400">
              <strong className="text-slate-200">Next steps:</strong> Companies are now in the pipeline at Longlist stage.
              Run AI qualification from the Companies page, or use Target Discovery for batch qualification.
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => router.push('/companies')}>View Companies</Button>
              <Button variant="ghost" onClick={() => { setStep('upload'); setFile(null); setPreview(null); setValidateResult(null); setImportResult(null); setBatchName(''); setSourceName('') }}>
                Import Another File
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
