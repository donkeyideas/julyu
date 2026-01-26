'use client'

import { useState, useEffect } from 'react'

interface DeliveryPartner {
  id: string
  name: string
  display_name: string | null
  slug: string
  description: string | null
  logo_url: string | null
  icon_letter: string | null
  brand_color: string | null
  base_url: string
  deep_link_template: string | null
  affiliate_base_url: string | null
  affiliate_id: string | null
  commission_type: 'percentage' | 'flat' | 'per_order'
  commission_rate: number | null
  flat_commission: number | null
  supports_deep_linking: boolean
  supports_cart_api: boolean
  supports_search_url: boolean
  requires_partnership: boolean
  sort_order: number
  is_active: boolean
  show_in_modal: boolean
  supported_retailers: string[]
  created_at: string
  updated_at: string
  stats?: {
    clicks: number
    conversions: number
    revenue: number
  }
}

const defaultFormData: {
  name: string
  display_name: string
  slug: string
  description: string
  logo_url: string
  icon_letter: string
  brand_color: string
  base_url: string
  deep_link_template: string
  affiliate_base_url: string
  affiliate_id: string
  commission_type: 'percentage' | 'flat' | 'per_order'
  commission_rate: number
  flat_commission: number
  supports_deep_linking: boolean
  supports_cart_api: boolean
  supports_search_url: boolean
  requires_partnership: boolean
  sort_order: number
  is_active: boolean
  show_in_modal: boolean
  supported_retailers: string[]
} = {
  name: '',
  display_name: '',
  slug: '',
  description: '',
  logo_url: '',
  icon_letter: '',
  brand_color: '#22C55E',
  base_url: '',
  deep_link_template: '',
  affiliate_base_url: '',
  affiliate_id: '',
  commission_type: 'percentage',
  commission_rate: 0,
  flat_commission: 0,
  supports_deep_linking: false,
  supports_cart_api: false,
  supports_search_url: true,
  requires_partnership: false,
  sort_order: 999,
  is_active: true,
  show_in_modal: true,
  supported_retailers: []
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'integration' | 'revenue' | 'display'>('basic')
  const [retailerInput, setRetailerInput] = useState('')

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    try {
      const response = await fetch('/api/admin/delivery-partners')
      if (response.ok) {
        const data = await response.json()
        setPartners(data.partners || [])
      }
    } catch (error) {
      console.error('Failed to load delivery partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingPartner(null)
    setFormData(defaultFormData)
    setActiveTab('basic')
    setShowModal(true)
  }

  const openEditModal = (partner: DeliveryPartner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      display_name: partner.display_name || '',
      slug: partner.slug,
      description: partner.description || '',
      logo_url: partner.logo_url || '',
      icon_letter: partner.icon_letter || '',
      brand_color: partner.brand_color || '#22C55E',
      base_url: partner.base_url,
      deep_link_template: partner.deep_link_template || '',
      affiliate_base_url: partner.affiliate_base_url || '',
      affiliate_id: partner.affiliate_id || '',
      commission_type: partner.commission_type,
      commission_rate: partner.commission_rate || 0,
      flat_commission: partner.flat_commission || 0,
      supports_deep_linking: partner.supports_deep_linking,
      supports_cart_api: partner.supports_cart_api,
      supports_search_url: partner.supports_search_url,
      requires_partnership: partner.requires_partnership,
      sort_order: partner.sort_order,
      is_active: partner.is_active,
      show_in_modal: partner.show_in_modal,
      supported_retailers: partner.supported_retailers || []
    })
    setActiveTab('basic')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        commission_rate: formData.commission_type === 'percentage' ? formData.commission_rate / 100 : null,
        flat_commission: formData.commission_type !== 'percentage' ? formData.flat_commission : null
      }

      if (editingPartner) {
        const response = await fetch('/api/admin/delivery-partners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPartner.id, ...payload })
        })

        if (response.ok) {
          await loadPartners()
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to update partner')
        }
      } else {
        const response = await fetch('/api/admin/delivery-partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          await loadPartners()
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to create partner')
        }
      }

      setShowModal(false)
    } catch (error) {
      console.error('Failed to save delivery partner:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePartnerActive = async (partner: DeliveryPartner) => {
    try {
      const response = await fetch('/api/admin/delivery-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, is_active: !partner.is_active })
      })

      if (response.ok) {
        await loadPartners()
      }
    } catch (error) {
      console.error('Failed to toggle partner:', error)
    }
  }

  const deletePartner = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this delivery partner? Click history will be preserved.')) return

    try {
      const response = await fetch(`/api/admin/delivery-partners?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadPartners()
      }
    } catch (error) {
      console.error('Failed to delete partner:', error)
    }
  }

  const addRetailer = () => {
    if (retailerInput.trim() && !formData.supported_retailers.includes(retailerInput.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        supported_retailers: [...prev.supported_retailers, retailerInput.toLowerCase().trim()]
      }))
      setRetailerInput('')
    }
  }

  const removeRetailer = (retailer: string) => {
    setFormData(prev => ({
      ...prev,
      supported_retailers: prev.supported_retailers.filter(r => r !== retailer)
    }))
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Calculate stats
  const activePartners = partners.filter(p => p.is_active).length
  const totalClicks = partners.reduce((sum, p) => sum + (p.stats?.clicks || 0), 0)
  const totalRevenue = partners.reduce((sum, p) => sum + (p.stats?.revenue || 0), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Delivery Partners</h1>
          <p className="text-gray-500 mt-2">Manage delivery partner integrations and monetization</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/admin-v2/delivery-partners/analytics"
            className="px-6 py-3 border border-gray-700 rounded-lg hover:border-green-500 hover:text-green-500 transition"
          >
            View Analytics
          </a>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
          >
            + Add Partner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Total Partners</div>
          <div className="text-3xl font-bold">{partners.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-3xl font-bold text-green-500">{activePartners}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Clicks (30 days)</div>
          <div className="text-3xl font-bold text-blue-500">{totalClicks.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Revenue (30 days)</div>
          <div className="text-3xl font-bold text-yellow-500">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Partners List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
            Loading delivery partners...
          </div>
        ) : partners.length > 0 ? (
          partners.map((partner, index) => (
            <div
              key={partner.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition"
            >
              <div className="flex items-center gap-6">
                {/* Partner Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: partner.brand_color || '#22C55E' }}
                >
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {partner.icon_letter || partner.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Partner Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold">{partner.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      partner.is_active
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      {partner.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-2 truncate">{partner.description || partner.base_url}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      Commission: {partner.commission_type === 'percentage'
                        ? `${((partner.commission_rate || 0) * 100).toFixed(1)}%`
                        : `$${partner.flat_commission?.toFixed(2) || '0.00'} per order`}
                    </span>
                    {partner.supports_deep_linking && (
                      <span className="px-2 py-0.5 bg-blue-500/15 text-blue-500 rounded text-xs">
                        Deep Linking
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold">{partner.stats?.clicks || 0}</div>
                    <div className="text-xs text-gray-500">Clicks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{partner.stats?.conversions || 0}</div>
                    <div className="text-xs text-gray-500">Conversions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      ${(partner.stats?.revenue || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={() => togglePartnerActive(partner)}
                    className="relative"
                    title={partner.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <div className={`w-14 h-8 rounded-full transition ${
                      partner.is_active ? 'bg-green-500' : 'bg-gray-700'
                    }`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow ${
                        partner.is_active ? 'left-7' : 'left-1'
                      }`} />
                    </div>
                  </button>
                  <button
                    onClick={() => openEditModal(partner)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500 hover:text-green-500 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePartner(partner.id)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:border-red-500 hover:text-red-500 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              No delivery partners configured
            </div>
            <p className="text-gray-600 mb-6">Add delivery partners to monetize your shop referrals</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Add Your First Partner
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingPartner ? 'Edit Delivery Partner' : 'Add Delivery Partner'}
            </h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
              {(['basic', 'integration', 'revenue', 'display'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg capitalize transition ${
                    activeTab === tab
                      ? 'bg-green-500 text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">Partner Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            name: e.target.value,
                            slug: prev.slug || generateSlug(e.target.value),
                            icon_letter: prev.icon_letter || e.target.value.charAt(0).toUpperCase()
                          }))
                        }}
                        placeholder="e.g., Instacart"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Slug *</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        placeholder="e.g., instacart"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Display Name (Optional)</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="e.g., Instacart - Fast Delivery"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description shown to users"
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Base URL *</label>
                    <input
                      type="url"
                      value={formData.base_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
                      placeholder="https://www.instacart.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Supported Retailers</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={retailerInput}
                        onChange={(e) => setRetailerInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRetailer())}
                        placeholder="e.g., kroger"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-green-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addRetailer}
                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.supported_retailers.map(r => (
                        <span key={r} className="px-3 py-1 bg-gray-800 rounded-full text-sm flex items-center gap-2">
                          {r}
                          <button type="button" onClick={() => removeRetailer(r)} className="text-gray-500 hover:text-red-500">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave empty to support all retailers</p>
                  </div>
                </div>
              )}

              {/* Integration Tab */}
              {activeTab === 'integration' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium mb-2">Deep Link Template</label>
                    <input
                      type="text"
                      value={formData.deep_link_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, deep_link_template: e.target.value }))}
                      placeholder="https://www.instacart.com/store/{retailer}/storefront?search={search}"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Placeholders: {'{retailer}'}, {'{search}'}, {'{items}'}, {'{zipCode}'}, {'{affiliateId}'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">Affiliate Base URL</label>
                      <input
                        type="url"
                        value={formData.affiliate_base_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, affiliate_base_url: e.target.value }))}
                        placeholder="https://affiliate.example.com/redirect"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Affiliate ID</label>
                      <input
                        type="text"
                        value={formData.affiliate_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, affiliate_id: e.target.value }))}
                        placeholder="Your affiliate ID"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span>Supports Deep Linking</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, supports_deep_linking: !prev.supports_deep_linking }))}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition ${formData.supports_deep_linking ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${formData.supports_deep_linking ? 'left-6' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span>Supports Search URL</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, supports_search_url: !prev.supports_search_url }))}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition ${formData.supports_search_url ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${formData.supports_search_url ? 'left-6' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span>Supports Cart API</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, supports_cart_api: !prev.supports_cart_api }))}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition ${formData.supports_cart_api ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${formData.supports_cart_api ? 'left-6' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span>Requires Partnership</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, requires_partnership: !prev.requires_partnership }))}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition ${formData.requires_partnership ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${formData.requires_partnership ? 'left-6' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium mb-2">Commission Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['percentage', 'flat', 'per_order'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, commission_type: type }))}
                          className={`px-4 py-3 rounded-lg border transition capitalize ${
                            formData.commission_type === type
                              ? 'border-green-500 bg-green-500/15 text-green-500'
                              : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.commission_type === 'percentage' ? (
                    <div>
                      <label className="block font-medium mb-2">Commission Rate (%)</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={formData.commission_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.commission_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                          className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-center focus:border-green-500 focus:outline-none"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-medium mb-2">Flat Commission Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.flat_commission}
                        onChange={(e) => setFormData(prev => ({ ...prev, flat_commission: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="bg-gray-800 rounded-xl p-4 mt-4">
                    <h4 className="font-semibold mb-2">Revenue Preview</h4>
                    <p className="text-gray-400 text-sm">
                      {formData.commission_type === 'percentage'
                        ? `For a $100 order, you earn $${(100 * formData.commission_rate / 100).toFixed(2)}`
                        : `For each order, you earn $${formData.flat_commission.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Display Tab */}
              {activeTab === 'display' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">Icon Letter</label>
                      <input
                        type="text"
                        value={formData.icon_letter}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon_letter: e.target.value.slice(0, 2).toUpperCase() }))}
                        placeholder="I"
                        maxLength={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none text-center text-2xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Brand Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.brand_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                          className="w-16 h-12 rounded-lg cursor-pointer border border-gray-700"
                        />
                        <input
                          type="text"
                          value={formData.brand_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                          placeholder="#22C55E"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Sort Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>

                  {/* Preview */}
                  <div className="border-t border-gray-800 pt-4">
                    <label className="block font-medium mb-3">Preview</label>
                    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: formData.brand_color }}
                      >
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-white text-xl font-bold">{formData.icon_letter || 'X'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{formData.display_name || formData.name || 'Partner Name'}</div>
                        <div className="text-sm text-gray-500">{formData.description || 'Partner description'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span>Active</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition ${formData.is_active ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${formData.is_active ? 'left-6' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span>Show in Modal</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, show_in_modal: !prev.show_in_modal }))}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition ${formData.show_in_modal ? 'bg-green-500' : 'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${formData.show_in_modal ? 'left-6' : 'left-0.5'}`} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-700 rounded-lg hover:border-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingPartner ? 'Update Partner' : 'Add Partner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
