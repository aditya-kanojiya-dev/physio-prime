import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, RefreshCw, Save, Globe, Phone, Mail, MapPin } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

interface SettingsData {
  siteName: string
  contactEmail: string
  contactPhone: string
  address: string
  logo: string
  socialLinks: { facebook: string; instagram: string; twitter: string; linkedin: string }
}

const defaultSettings: SettingsData = {
  siteName: 'PhysioPrime',
  contactEmail: '',
  contactPhone: '',
  address: '',
  logo: '',
  socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '' },
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SettingsData>(defaultSettings)
  const [message, setMessage] = useState('')

  const { data: sections, isLoading } = useQuery({
    queryKey: ['admin/cms/settings'],
    queryFn: async () => {
      const res = await api.get<{ sections: { key: string; page: string; data: Record<string, unknown> }[] }>('/admin/cms')
      return res.sections.filter((s) => s.page === 'settings')
    },
  })

  useEffect(() => {
    if (!sections) return
    const merged = { ...defaultSettings }
    for (const s of sections) {
      if (s.key === 'general') {
        merged.siteName = (s.data.siteName as string) || merged.siteName
        merged.contactEmail = (s.data.contactEmail as string) || merged.contactEmail
        merged.contactPhone = (s.data.contactPhone as string) || merged.contactPhone
        merged.address = (s.data.address as string) || merged.address
        merged.logo = (s.data.logo as string) || merged.logo
      }
      if (s.key === 'social') {
        merged.socialLinks = { ...merged.socialLinks, ...(s.data as Record<string, string>) }
      }
    }
    setForm(merged)
  }, [sections])

  const saveGeneral = useMutation({
    mutationFn: async () => api.put('/admin/cms/settings/general', {
      data: { siteName: form.siteName, contactEmail: form.contactEmail, contactPhone: form.contactPhone, address: form.address, logo: form.logo },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/cms'] })
      setMessage('Settings saved')
      setTimeout(() => setMessage(''), 3000)
    },
  })

  const saveSocial = useMutation({
    mutationFn: async () => api.put('/admin/cms/settings/social', { data: form.socialLinks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/cms'] })
      setMessage('Social links saved')
      setTimeout(() => setMessage(''), 3000)
    },
  })

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const updateSocial = (key: string, value: string) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }))

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Configure platform settings and contact information.</p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-bold">{message}</div>
        )}

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* General */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-700"><Globe className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">General</h2>
                  <p className="text-xs text-slate-500">Basic platform configuration.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Site Name</label>
                <input type="text" value={form.siteName} onChange={(e) => update('siteName', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Logo URL</label>
                <input type="url" value={form.logo} onChange={(e) => update('logo', e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5"><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Contact Email</span></label>
                  <input type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5"><span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact Phone</span></label>
                  <input type="tel" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</span></label>
                <textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none" />
              </div>

              <button onClick={() => saveGeneral.mutate()} disabled={saveGeneral.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50">
                {saveGeneral.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save General
              </button>
            </div>

            {/* Social Links */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="p-3 rounded-2xl bg-purple-100 text-purple-700"><Settings className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Social Links</h2>
                  <p className="text-xs text-slate-500">Your social media profiles.</p>
                </div>
              </div>

              {(['facebook', 'instagram', 'twitter', 'linkedin'] as const).map((platform) => (
                <div key={platform}>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 capitalize">{platform}</label>
                  <input type="url" value={form.socialLinks[platform]} onChange={(e) => updateSocial(platform, e.target.value)} placeholder={`https://${platform}.com/...`} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              ))}

              <button onClick={() => saveSocial.mutate()} disabled={saveSocial.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-50">
                {saveSocial.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Social Links
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
