import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Star, Trash2, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminReview } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'

export function TestimonialsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin/reviews', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      return api.get<{ reviews: AdminReview[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>(`/admin/reviews?${params}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...patch }: { id: number; featured?: boolean; status?: string }) =>
      api.patch(`/admin/reviews/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin/reviews'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin/reviews'] }),
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Testimonials</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Moderate patient reviews and testimonials.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Reviews</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin/reviews'] })}
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
              {(data?.reviews || []).map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onApprove={() => updateMutation.mutate({ id: review.id, status: 'approved' })}
                  onReject={() => updateMutation.mutate({ id: review.id, status: 'rejected' })}
                  onToggleFeatured={() => updateMutation.mutate({ id: review.id, featured: !review.featured })}
                  onDelete={() => { if (confirm('Delete this review?')) deleteMutation.mutate(review.id) }}
                />
              ))}
              {!data?.reviews.length && (
                <div className="text-center py-16 text-slate-400">
                  <Star className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold">No reviews found</p>
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

function ReviewCard({ review, onApprove, onReject, onToggleFeatured, onDelete }: {
  review: AdminReview
  onApprove: () => void
  onReject: () => void
  onToggleFeatured: () => void
  onDelete: () => void
}) {
  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{review.patientName}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[review.status] || ''}`}>
              {review.status}
            </span>
            {review.featured && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Featured</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            for Dr. {review.doctorName} · {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-slate-600 leading-relaxed">"{review.comment}"</p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {review.status !== 'approved' && (
          <button onClick={onApprove} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all">
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
        )}
        {review.status !== 'rejected' && (
          <button onClick={onReject} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-all">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        )}
        <button onClick={onToggleFeatured} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${review.featured ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <Star className={`w-3.5 h-3.5 ${review.featured ? 'fill-blue-600' : ''}`} />
          {review.featured ? 'Unfeature' : 'Feature'}
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-red-600 text-xs font-bold hover:bg-red-50 transition-all ml-auto">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  )
}
