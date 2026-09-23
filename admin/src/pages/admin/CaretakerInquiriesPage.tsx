import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Phone, RefreshCw, Trash2, UserRound } from 'lucide-react'
import { api } from '../../lib/api'
import { CaretakerInquiry } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { confirmDialog } from '../../components/admin/ConfirmDialog'

export function CaretakerInquiriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('all')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin/caretaker-inquiries', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (status !== 'all') params.set('status', status)
      return api.get<{ inquiries: CaretakerInquiry[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/caretaker-inquiries?${params}`)
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => api.patch(`/admin/caretaker-inquiries/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin/caretaker-inquiries'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/caretaker-inquiries/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin/caretaker-inquiries'] }),
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Caretaker Inquiries</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Home care requests from the website.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin/caretaker-inquiries'] })}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {(data?.inquiries || []).map((inquiry) => (
                <div key={inquiry.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{inquiry.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">{inquiry.serviceType}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(inquiry.status)}`}>{inquiry.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{inquiry.phone}</span>
                        <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {inquiry.status !== 'contacted' && (
                        <button onClick={() => statusMutation.mutate({ id: inquiry.id, status: 'contacted' })} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all">Mark contacted</button>
                      )}
                      {inquiry.status !== 'closed' && (
                        <button onClick={() => statusMutation.mutate({ id: inquiry.id, status: 'closed' })} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all">Close</button>
                      )}
                      <button onClick={async () => { if (await confirmDialog({ title: 'Delete Inquiry', message: `Delete this inquiry?` })) deleteMutation.mutate(inquiry.id) }} className="p-2 rounded-lg bg-slate-100 text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {inquiry.message && <p className="text-sm text-slate-600 leading-relaxed">{inquiry.message}</p>}
                </div>
              ))}
              {!data?.inquiries.length && (
                <div className="text-center py-16 text-slate-400">
                  <UserRound className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold">No inquiries yet</p>
                </div>
              )}
            </div>

            {data && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    new: 'bg-amber-100 text-amber-700 border-amber-200',
    contacted: 'bg-blue-100 text-blue-700 border-blue-200',
    closed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'
}