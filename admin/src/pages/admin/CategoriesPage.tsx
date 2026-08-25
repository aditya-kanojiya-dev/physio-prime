import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Edit3, Layers, Loader2, Plus, Trash2, X } from 'lucide-react'
import { api, ApiError } from '../../lib/api'
import { AdminCategory } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { StatusPill } from './AppointmentsPage'
import { ImageUpload } from '../../components/admin/ImageUpload'

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  image: '',
  color: '#0EA5E9',
  conditions: '',
  sortOrder: 0,
  active: true,
}

export function CategoriesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin/categories'],
    queryFn: async () => (await api.get<{ categories: AdminCategory[] }>('/admin/categories')).categories,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin/categories'] })

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editing ? api.patch(`/admin/categories/${editing.id}`, body) : api.post('/admin/categories', body),
    onSuccess: () => {
      setModalOpen(false)
      invalidate()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: AdminCategory) => {
    setEditing(c)
    setForm({
      title: c.title,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      color: c.color || '#0EA5E9',
      conditions: (c.conditions || []).join(', '),
      sortOrder: c.sortOrder,
      active: c.active,
    })
    setModalOpen(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    save.mutate({
      title: form.title,
      slug: form.slug,
      description: form.description || null,
      image: form.image || null,
      color: form.color || null,
      conditions: form.conditions.split(',').map((s) => s.trim()).filter(Boolean),
      sortOrder: Number(form.sortOrder),
      active: form.active,
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Specialty Categories CMS</h1>
            <p className="text-xs text-slate-500">Manage physiotherapy treatment fields and specialization cards.</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
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
            {(data || []).map((c) => (
              <div key={c.id} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  {c.image ? (
                    <img src={c.image} alt={c.title} className="w-full h-36 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-full h-36 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Layers className="w-8 h-8 text-slate-500" style={{ color: c.color ?? undefined }} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">{c.title}</h3>
                    <StatusPill tone={c.active ? 'emerald' : 'slate'} label={c.active ? 'Active' : 'Hidden'} />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-teal-700">{c.conditions.length} Conditions</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.slug}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-700 border border-slate-200 transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this category?')) remove.mutate(c.id)
                    }}
                    className="p-2 rounded-xl bg-rose-100 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {(data || []).length === 0 && <p className="text-sm text-slate-400">No categories yet.</p>}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
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
              <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="categories" label="Category Image" />
              <Field label="Color">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-xl bg-white border border-slate-200" />
              </Field>
            </div>
            <Field label="Conditions (comma separated)">
              <input type="text" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} className={inputCls} placeholder="Knee Pain, Arthritis, ..." />
            </Field>
            <Field label="Sort Order">
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-teal-600 w-4 h-4" />
              <span className="font-bold text-slate-600">Active (visible on site)</span>
            </label>
            <button
              type="submit"
              disabled={save.isPending}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 font-extrabold text-white rounded-2xl shadow-lg shadow-teal-600/30 transition-all text-xs disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Category'}
            </button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const inputCls =
  'w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-teal-500 transition-colors'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-bold text-slate-600">{label}</label>
      {children}
    </div>
  )
}
