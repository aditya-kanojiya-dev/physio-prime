import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Edit3, FileText, Loader2, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminSymptom } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'
import { Field, Modal, inputCls } from './CategoriesPage'
import { ImageUpload } from '../../components/admin/ImageUpload'

const emptyForm = {
  title: '',
  slug: '',
  iconName: '',
  description: '',
  recoveryEstimate: '',
  image: '',
  sortOrder: 0,
  active: true,
}

export function SymptomsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminSymptom | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin/symptoms'],
    queryFn: async () => (await api.get<{ symptoms: AdminSymptom[] }>('/admin/symptoms')).symptoms,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin/symptoms'] })

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editing ? api.patch(`/admin/symptoms/${editing.id}`, body) : api.post('/admin/symptoms', body),
    onSuccess: () => {
      setModalOpen(false)
      invalidate()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/symptoms/${id}`),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (s: AdminSymptom) => {
    setEditing(s)
    setForm({
      title: s.title,
      slug: s.slug,
      iconName: s.iconName || '',
      description: s.description || '',
      recoveryEstimate: s.recoveryEstimate || '',
      image: s.image || '',
      sortOrder: s.sortOrder,
      active: s.active,
    })
    setModalOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    save.mutate({
      title: form.title,
      slug: form.slug,
      iconName: form.iconName || null,
      description: form.description || null,
      recoveryEstimate: form.recoveryEstimate || null,
      image: form.image || null,
      sortOrder: Number(form.sortOrder),
      active: form.active,
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Symptoms & Conditions Library</h1>
            <p className="text-xs text-slate-500">Manage patient symptoms, recovery estimates, and condition cards.</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Symptom
          </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(data || []).map((s) => {
              const popularFor = Object.values(s.popularFor || {}).filter(Boolean).join(', ')
              return (
                <div key={s.id} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    {s.image ? (
                      <img src={s.image} alt={s.title} className="w-full h-36 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-full h-36 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">{s.title}</h3>
                      <StatusPill tone={s.active ? 'emerald' : 'slate'} label={s.active ? 'Active' : 'Hidden'} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    {popularFor ? (
                      <span className="font-bold text-blue-700">Popular for: {popularFor}</span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">{s.slug}</span>
                    )}
                    {s.recoveryEstimate && <span className="text-teal-700 font-bold">Est. {s.recoveryEstimate}</span>}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-700 border border-slate-200 transition-all"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this symptom?')) remove.mutate(s.id)
                      }}
                      className="p-2 rounded-xl bg-rose-100 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
            {(data || []).length === 0 && <p className="text-sm text-slate-400">No symptoms yet.</p>}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Symptom' : 'Add Symptom'} onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title *">
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Slug *">
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Icon Name">
                <input type="text" value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} className={inputCls} placeholder="lucide icon name (e.g. Bone)" />
              </Field>
              <Field label="Recovery Estimate">
                <input type="text" value={form.recoveryEstimate} onChange={(e) => setForm({ ...form, recoveryEstimate: e.target.value })} className={inputCls} placeholder="e.g. 2–4 weeks" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="symptoms" label="Symptom Image" />
              <Field label="Sort Order">
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputCls} />
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-teal-600 w-4 h-4" />
              <span className="font-bold text-slate-600">Active (visible on site)</span>
            </label>
            <button
              type="submit"
              disabled={save.isPending}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white rounded-2xl shadow-lg shadow-teal-600/30 transition-all text-xs disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Symptom'}
            </button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
