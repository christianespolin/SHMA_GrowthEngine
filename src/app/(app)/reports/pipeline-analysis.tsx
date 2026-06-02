'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw, Clock } from 'lucide-react'

const STORAGE_KEY = 'shma_pipeline_analysis'

interface StoredAnalysis {
  content: string
  model: string
  generatedAt: string // ISO string
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-slate-200 mt-4 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-semibold text-cyan-400 mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-cyan-300 mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
    .replace(/^[-•] (.*$)/gim, '<li class="ml-4 text-slate-400">$1</li>')
    .replace(/\n\n/g, '<br/>')
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) + ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function PipelineAnalysis() {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  // Load persisted analysis on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved: StoredAnalysis = JSON.parse(raw)
        setContent(saved.content)
        setModel(saved.model)
        setGeneratedAt(saved.generatedAt)
      }
    } catch { /* ignore corrupt storage */ }
  }, [])

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/pipeline-analysis', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      const now = new Date().toISOString()
      setContent(data.content)
      setModel(data.model)
      setGeneratedAt(now)
      // Persist so it survives navigation and page refresh
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        content: data.content,
        model: data.model,
        generatedAt: now,
      } satisfies StoredAnalysis))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">AI Pipeline Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">Weekly briefing — what to focus on, where the pipeline is stuck, bold recommendation</p>
        </div>
        <Button variant="primary" size="sm" onClick={run} disabled={loading}>
          {loading
            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analysing…</>
            : <><Sparkles className="h-3.5 w-3.5" /> {content ? 'Re-run' : 'Run Analysis'}</>
          }
        </Button>
      </div>

      <div className="p-4">
        {!content && !loading && !error && (
          <div className="text-center py-8 text-slate-600">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click Run Analysis to get a full AI briefing of your pipeline</p>
            <p className="text-xs mt-1 text-slate-700">Covers focus accounts, stale leads, bottlenecks, and one bold recommendation</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
            <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <span className="text-sm">Claude is analysing your pipeline…</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {content && !loading && (
          <>
            <div
              className="text-sm text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
            <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {generatedAt ? formatGeneratedAt(generatedAt) : 'Just now'}
                {model && <span className="text-slate-700">· {model}</span>}
              </span>
              <button onClick={run} disabled={loading} className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                <RefreshCw className="h-3 w-3" /> Re-run
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
