import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Edit3, FileJson, LayoutDashboard, Loader2, Trash2 } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminSection } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { Field, inputCls, Modal } from './CategoriesPage'
import { StatusPill } from './AppointmentsPage'

const PAGES = ['home', 'about', 'footer'] as const

export function CMSPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<AdminSection | null>(null)
  const [dataText, setDataText] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin/cms'],
    queryFn: async () => (await api.get<{ sections: AdminSection[] }>('/admin/cms')).sections,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin/cms'] })

  const save = useMutation({
    mutationFn: (section: AdminSection) =>
      api.put(`/admin/cms/${section.page}/${section.key}`, { data: JSON.parse(dataText), sortOrder, active }),
    onSuccess: () => {
      setEditing(null)
      invalidate()
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : err instanceof SyntaxError ? 'Invalid JSON in data payload' : 'Save failed')
    },
  })

  const remove = useMutation({
    mutationFn: (section: AdminSection) => api.delete(`/admin/cms/${section.page}/${section.key}`),
    onSuccess: invalidate,
  })

  const openEdit = (s: AdminSection) => {
    setEditing(s)
    setDataText(JSON.stringify(s.data, null, 2))
    setSortOrder(s.sortOrder)
    setActive(s.active)
    setError(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Content Sections CMS</h1>
          <p className="text-xs text-slate-500">Edit every editable block on the patient site — hero, search, stories, footer.</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {PAGES.map((page) => {
              const sections = (data || []).filter((s) => s.page === page)
              return (
                <div key={page}>
                  <h2 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <LayoutDashboard className="w-4 h-4 text-teal-600" /> {page} page
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sections.map((s) => (
                      <div key={`${s.page}/${s.key}`} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700">
                            <FileJson className="w-4 h-4" />
                          </div>
                          <StatusPill tone={s.active ? 'emerald' : 'slate'} label={s.active ? 'Live' : 'Hidden'} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900">{s.key}</h3>
                          <p className="text-[11px] text-slate-500 font-mono line-clamp-3">{JSON.stringify(s.data).slice(0, 120)}…</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                          <span className="font-bold text-teal-700">Order {s.sortOrder}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-700 border border-slate-200 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete section "${s.key}" on ${s.page}?`)) remove.mutate(s)
                              }}
                              className="p-2 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sections.length === 0 && <p className="text-sm text-slate-400">No sections on this page yet.</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <Modal title={`Edit ${editing.page} / ${editing.key}`} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="space-y-4 text-xs"
          >
            <Field label="Section Data (JSON)">
              <textarea rows={10} value={dataText} onChange={(e) => setDataText(e.target.value)} className={`${inputCls} resize-none font-mono`} />
            </Field>
            <Field label="Sort Order">
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-teal-600 w-4 h-4" />
              <span className="font-bold text-slate-600">Active (visible on site)</span>
            </label>
            <button
              type="submit"
              disabled={save.isPending}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white rounded-2xl shadow-lg shadow-teal-600/30 transition-all text-xs disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Section'}
            </button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
