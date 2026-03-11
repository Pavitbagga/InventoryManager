'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Category, Product } from '@/types'
import ZoomControl from '@/components/ZoomControl'
import KeyboardHelp from '@/components/KeyboardHelp'
import { useGlobalZoomKeys } from '@/lib/useGlobalZoomKeys'

type Tab = 'products' | 'categories' | 'clerks' | 'bill-config' | 'settings'
type SortDir = 'asc' | 'desc'

interface Clerk {
  id: number; name: string; email?: string | null; phone?: string | null
  role: string; active: boolean; createdAt: string
}
interface BillConfig {
  id: number; shopName: string; shopAddress: string; shopPhone: string
  shopGST: string; footerMessage: string; showLogo: boolean; showGST: boolean
  showAddress: boolean; showPhone: boolean; showClerk: boolean; showTable: boolean
  showItemRate: boolean; showDiscount: boolean; paperWidth: number; currency: string
}
interface PendingChange {
  id: string
  entity: 'product' | 'category' | 'clerk'
  label: string
  sublabel: string
  color?: string
  execute: () => Promise<void>
}

const PRESET_COLORS = [
  '#2e7d32','#c2185b','#6a1b9a','#1565c0','#e65100',
  '#b71c1c','#00695c','#4527a0','#f57f17','#455a64',
]

// ─── Shared UI helpers ─────────────────────────────────────────────────────────
function StatusBadge({ msg, onClear }: { msg: string; onClear: () => void }) {
  if (!msg) return null
  const isError = msg.toLowerCase().startsWith('error') || msg.toLowerCase().includes('cannot')
  return (
    <div onClick={onClear} className={`cursor-pointer text-sm px-4 py-2 rounded-lg border ${
      isError ? 'bg-red-950 border-red-700 text-red-300' : 'bg-green-950 border-green-700 text-green-300'
    }`}>{msg}</div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="bg-gray-800 border border-gray-600 pl-8 pr-8 py-1.5 rounded-lg text-sm
                   focus:outline-none focus:border-blue-500 w-56 placeholder-gray-600"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>
      )}
    </div>
  )
}

function SortBtn({ label, field, current, dir, onSort }: {
  label: string; field: string; current: string; dir: SortDir; onSort: (f: string) => void
}) {
  const active = current === field
  return (
    <button onClick={() => onSort(field)}
      className={`flex items-center gap-1 group transition-colors ${active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>
      {label}
      <span className="text-[10px] w-3 text-center">
        {active ? (dir === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-40">↕</span>}
      </span>
    </button>
  )
}

// ─── Review & Apply Modal ──────────────────────────────────────────────────────
function ReviewModal({
  changes, onRemove, onApply, onClose,
}: {
  changes: PendingChange[]
  onRemove: (id: string) => void
  onApply: () => void
  onClose: () => void
}) {
  const [applying, setApplying] = useState(false)

  const grouped = {
    product:  changes.filter(c => c.entity === 'product'),
    category: changes.filter(c => c.entity === 'category'),
    clerk:    changes.filter(c => c.entity === 'clerk'),
  }
  const entityLabel = { product: 'Products', category: 'Categories', clerk: 'Clerks' } as const

  const apply = async () => {
    setApplying(true)
    await onApply()
    setApplying(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Review Pending Changes</h2>
            <p className="text-xs text-gray-500 mt-0.5">{changes.length} deletion{changes.length !== 1 ? 's' : ''} queued</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
          {(Object.entries(grouped) as [keyof typeof grouped, PendingChange[]][])
            .filter(([, items]) => items.length > 0)
            .map(([entity, items]) => (
              <div key={entity}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {entityLabel[entity]} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(change => (
                    <div key={change.id}
                      className="flex items-center gap-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
                      {change.color && (
                        <span className="w-4 h-4 rounded shrink-0 border border-white/20"
                          style={{ backgroundColor: change.color }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium line-through opacity-60 truncate">
                          {change.label}
                        </div>
                        {change.sublabel && (
                          <div className="text-red-400 text-xs mt-0.5">{change.sublabel}</div>
                        )}
                      </div>
                      <button onClick={() => onRemove(change.id)}
                        className="shrink-0 text-gray-500 hover:text-white text-xs px-2 py-1
                                   rounded hover:bg-gray-700 transition-colors">
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center gap-3 shrink-0">
          <button onClick={apply} disabled={applying}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold
                       px-6 py-2.5 rounded-xl transition-colors flex-1">
            {applying ? 'Deleting…' : `Apply ${changes.length} Deletion${changes.length !== 1 ? 's' : ''}`}
          </button>
          <button onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab({
  categories,
  pendingIds,
  onQueueDelete,
}: {
  categories: Category[]
  pendingIds: Set<string>
  onQueueDelete: (change: PendingChange) => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({ name: '', price: '', color: '#2e7d32', pluCode: '', stock: '100', categoryId: '' })
  const [editing, setEditing] = useState<Product | null>(null)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock' | 'category'>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [status, setStatus] = useState('')

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(''), 3500) }
  const load = () => fetch('/api/products').then(r => r.json()).then(setProducts)
  useEffect(() => { load() }, [])

  // Reload when a pending delete is applied (pendingIds shrinks)
  const prevPendingSize = pendingIds.size
  useEffect(() => { if (pendingIds.size < prevPendingSize) load() }, [pendingIds.size])

  const toggleSort = (field: string) => {
    const f = field as typeof sortField
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name, price: parseFloat(form.price), color: form.color,
      pluCode: form.pluCode || null, stock: parseInt(form.stock), categoryId: parseInt(form.categoryId),
    }
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      flash(editing ? 'Product updated!' : 'Product added!')
      load(); setEditing(null)
      setForm({ name: '', price: '', color: '#2e7d32', pluCode: '', stock: '100', categoryId: form.categoryId })
    } else {
      const d = await res.json(); flash('Error: ' + (d.error || 'failed'))
    }
  }

  const startEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, price: String(p.price), color: p.color, pluCode: p.pluCode || '', stock: String(p.stock), categoryId: String(p.categoryId) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const queueDelete = (p: Product) => {
    const key = `product-${p.id}`
    onQueueDelete({
      id: key,
      entity: 'product',
      label: p.name,
      sublabel: `Rs.${p.price.toFixed(2)} · ${p.category?.name ?? ''}`,
      color: p.color,
      execute: async () => {
        await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
        load()
      },
    })
  }

  // Filter → search → sort
  let visible = filterCat ? products.filter(p => p.categoryId === parseInt(filterCat)) : products
  if (search) {
    const q = search.toLowerCase()
    visible = visible.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.pluCode ?? '').toLowerCase().includes(q) ||
      (p.category?.name ?? '').toLowerCase().includes(q)
    )
  }
  visible = [...visible].sort((a, b) => {
    let cmp = 0
    if (sortField === 'name')     cmp = a.name.localeCompare(b.name)
    if (sortField === 'price')    cmp = a.price - b.price
    if (sortField === 'stock')    cmp = a.stock - b.stock
    if (sortField === 'category') cmp = (a.category?.name ?? '').localeCompare(b.category?.name ?? '')
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-5">
      {/* Form */}
      <form onSubmit={save} className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-200">{editing ? `Editing: ${editing.name}` : 'Add Product'}</h2>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ name:'',price:'',color:'#2e7d32',pluCode:'',stock:'100',categoryId:'' }) }}
              className="text-xs text-gray-400 hover:text-white">Cancel</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input required placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          <input required type="number" step="0.01" min="0" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
            className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          <input placeholder="PLU Code (optional)" value={form.pluCode} onChange={e => setForm({...form, pluCode: e.target.value})}
            className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
            className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
            className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 shrink-0">Color</label>
            <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
              className="h-9 w-10 rounded cursor-pointer bg-transparent border-0" />
            <div className="flex gap-1 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})} style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded border transition-transform ${form.color === c ? 'border-white scale-125' : 'border-transparent'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="bg-blue-700 hover:bg-blue-600 px-6 py-2 rounded-lg font-bold text-sm">
            {editing ? 'Update Product' : 'Add Product'}
          </button>
          {form.name && (
            <span className="text-xs text-gray-400">
              Preview: <span style={{ backgroundColor: form.color }} className="px-3 py-1 rounded text-white text-xs font-bold ml-1">{form.name}</span>
            </span>
          )}
          <StatusBadge msg={status} onClear={() => setStatus('')} />
        </div>
      </form>

      {/* Toolbar: search + filter + sort + count */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, PLU, category…" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-gray-800 border border-gray-600 px-3 py-1.5 rounded-lg text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {visible.length} of {products.length} products
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700 text-gray-300 text-xs">
              <th className="p-3 text-left">
                <SortBtn label="Name" field="name" current={sortField} dir={sortDir} onSort={toggleSort} />
              </th>
              <th className="p-3 text-right">
                <div className="flex justify-end">
                  <SortBtn label="Price" field="price" current={sortField} dir={sortDir} onSort={toggleSort} />
                </div>
              </th>
              <th className="p-3 text-center uppercase tracking-wider">PLU</th>
              <th className="p-3 text-center">
                <SortBtn label="Stock" field="stock" current={sortField} dir={sortDir} onSort={toggleSort} />
              </th>
              <th className="p-3 text-center">
                <SortBtn label="Category" field="category" current={sortField} dir={sortDir} onSort={toggleSort} />
              </th>
              <th className="p-3 text-center uppercase tracking-wider">Color</th>
              <th className="p-3 text-center uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No products match your search</td></tr>
            )}
            {visible.map(p => {
              const isQueued = pendingIds.has(`product-${p.id}`)
              return (
                <tr key={p.id} className={`border-t border-gray-700 transition-colors ${
                  isQueued ? 'bg-red-950/30 opacity-50' :
                  editing?.id === p.id ? 'bg-blue-950/30' :
                  'hover:bg-gray-750'
                }`}>
                  <td className={`p-3 font-medium ${isQueued ? 'line-through text-red-400' : ''}`}>{p.name}</td>
                  <td className="p-3 text-right font-mono text-green-400">Rs.{p.price.toFixed(2)}</td>
                  <td className="p-3 text-center text-gray-500 font-mono text-xs">{p.pluCode || '—'}</td>
                  <td className="p-3 text-center">{p.stock}</td>
                  <td className="p-3 text-center text-xs text-gray-400">{p.category?.name}</td>
                  <td className="p-3 text-center">
                    <span className="inline-block w-6 h-6 rounded border border-gray-600" style={{ backgroundColor: p.color }} />
                  </td>
                  <td className="p-3 text-center">
                    {isQueued ? (
                      <span className="text-xs text-red-400 bg-red-950 px-2 py-1 rounded">Queued for deletion</span>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => startEdit(p)} className="bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded text-xs">Edit</button>
                        <button onClick={() => queueDelete(p)} className="bg-red-900 hover:bg-red-800 px-3 py-1 rounded text-xs">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab({
  categories,
  onReload,
  pendingIds,
  onQueueDelete,
}: {
  categories: Category[]
  onReload: () => void
  pendingIds: Set<string>
  onQueueDelete: (change: PendingChange) => void
}) {
  const [form, setForm] = useState({ name: '', color: '#1a1a2e', position: '0' })
  const [editing, setEditing] = useState<Category | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'name' | 'position' | 'products'>('position')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [status, setStatus] = useState('')

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(''), 3500) }

  const toggleSort = (field: string) => {
    const f = field as typeof sortField
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: form.name.toUpperCase(), color: form.color, position: parseInt(form.position) }
    const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      flash(editing ? 'Category updated!' : 'Category added!')
      onReload(); setEditing(null)
      setForm({ name: '', color: '#1a1a2e', position: '0' })
    } else {
      const d = await res.json(); flash('Error: ' + (d.error || 'failed'))
    }
  }

  const queueDelete = (c: Category) => {
    const count = c.products?.length || 0
    if (count > 0) { flash(`Error: Cannot delete — ${count} products exist in this category`); return }
    onQueueDelete({
      id: `category-${c.id}`,
      entity: 'category',
      label: c.name,
      sublabel: 'No products',
      color: c.color,
      execute: async () => {
        await fetch(`/api/categories/${c.id}`, { method: 'DELETE' })
        onReload()
      },
    })
  }

  let visible = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : [...categories]
  visible = [...visible].sort((a, b) => {
    let cmp = 0
    if (sortField === 'name')     cmp = a.name.localeCompare(b.name)
    if (sortField === 'position') cmp = a.position - b.position
    if (sortField === 'products') cmp = (a.products?.length ?? 0) - (b.products?.length ?? 0)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-200">{editing ? `Editing: ${editing.name}` : 'Add Category'}</h2>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ name:'',color:'#1a1a2e',position:'0' }) }}
              className="text-xs text-gray-400 hover:text-white">Cancel</button>
          )}
        </div>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Category Name</label>
            <input required placeholder="e.g. MENU 2" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 uppercase" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Sort Order</label>
            <input type="number" min="0" value={form.position} onChange={e => setForm({...form, position: e.target.value})}
              className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm w-24 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Color</label>
            <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
              className="h-9 w-10 rounded cursor-pointer bg-transparent border-0" />
          </div>
          <button type="submit" className="bg-blue-700 hover:bg-blue-600 px-6 py-2 rounded-lg font-bold text-sm">
            {editing ? 'Update' : 'Add Category'}
          </button>
          <StatusBadge msg={status} onClear={() => setStatus('')} />
        </div>
      </form>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />
        <span className="text-sm text-gray-500 ml-auto">{visible.length} of {categories.length} categories</span>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700 text-gray-300 text-xs">
              <th className="p-3 text-left">
                <SortBtn label="Name" field="name" current={sortField} dir={sortDir} onSort={toggleSort} />
              </th>
              <th className="p-3 text-center">
                <SortBtn label="Order" field="position" current={sortField} dir={sortDir} onSort={toggleSort} />
              </th>
              <th className="p-3 text-center uppercase tracking-wider">Color</th>
              <th className="p-3 text-center">
                <SortBtn label="Products" field="products" current={sortField} dir={sortDir} onSort={toggleSort} />
              </th>
              <th className="p-3 text-center uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No categories match</td></tr>
            )}
            {visible.map(c => {
              const isQueued = pendingIds.has(`category-${c.id}`)
              const hasProducts = (c.products?.length || 0) > 0
              return (
                <tr key={c.id} className={`border-t border-gray-700 transition-colors ${
                  isQueued ? 'bg-red-950/30 opacity-50' : 'hover:bg-gray-750'
                }`}>
                  <td className={`p-3 font-bold ${isQueued ? 'line-through text-red-400' : ''}`}>{c.name}</td>
                  <td className="p-3 text-center text-gray-400">{c.position}</td>
                  <td className="p-3 text-center">
                    <span className="inline-block w-6 h-6 rounded border border-gray-600" style={{ backgroundColor: c.color }} />
                  </td>
                  <td className="p-3 text-center">{c.products?.length ?? 0}</td>
                  <td className="p-3 text-center">
                    {isQueued ? (
                      <span className="text-xs text-red-400 bg-red-950 px-2 py-1 rounded">Queued for deletion</span>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setEditing(c); setForm({ name: c.name, color: c.color, position: String(c.position) }) }}
                          className="bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded text-xs">Rename</button>
                        <button onClick={() => queueDelete(c)}
                          disabled={hasProducts}
                          title={hasProducts ? 'Move or delete products first' : 'Queue for deletion'}
                          className="bg-red-900 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1 rounded text-xs">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Clerks Tab ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', pin: '', confirmPin: '', email: '', phone: '', role: 'clerk' }

function ClerksTab({
  pendingIds,
  onQueueDelete,
}: {
  pendingIds: Set<string>
  onQueueDelete: (change: PendingChange) => void
}) {
  const [clerks, setClerks] = useState<Clerk[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<Clerk | null>(null)
  const [showPin, setShowPin] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'name' | 'role'>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(''), 3500) }
  const load = () => fetch('/api/clerks').then(r => r.json()).then(setClerks)
  useEffect(() => { load() }, [])
  useEffect(() => { if (pendingIds.size === 0) load() }, [pendingIds.size])

  const resetForm = () => { setEditing(null); setForm(EMPTY_FORM); setShowPin(false); setShowConfirm(false) }

  const toggleSort = (field: string) => {
    const f = field as typeof sortField
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || form.pin) {
      if (!form.pin) { flash('Error: PIN is required'); return }
      if (form.pin.length < 4) { flash('Error: PIN must be at least 4 digits'); return }
      if (form.pin !== form.confirmPin) { flash('Error: PINs do not match'); return }
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(), email: form.email.trim() || null,
      phone: form.phone.trim() || null, role: form.role,
    }
    if (form.pin) payload.pin = form.pin

    const url = editing ? `/api/clerks/${editing.id}` : '/api/clerks'
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      flash(editing ? 'Clerk updated!' : 'Clerk added!')
      load(); resetForm()
    } else {
      const d = await res.json(); flash('Error: ' + (d.error || 'failed'))
    }
  }

  const startEdit = (c: Clerk) => {
    setEditing(c)
    setForm({ name: c.name, pin: '', confirmPin: '', email: c.email || '', phone: c.phone || '', role: c.role })
    setExpandedId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleActive = async (c: Clerk) => {
    await fetch(`/api/clerks/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !c.active }) })
    load()
  }

  const queueDelete = (c: Clerk) => {
    onQueueDelete({
      id: `clerk-${c.id}`,
      entity: 'clerk',
      label: c.name,
      sublabel: `${c.role.replace('_', ' ')}${c.email ? ` · ${c.email}` : ''}`,
      execute: async () => {
        await fetch(`/api/clerks/${c.id}`, { method: 'DELETE' })
        load()
      },
    })
    setExpandedId(null)
  }

  let visible = search
    ? clerks.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone ?? '').toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase())
      )
    : [...clerks]
  visible = [...visible].sort((a, b) => {
    const cmp = sortField === 'name'
      ? a.name.localeCompare(b.name)
      : a.role.localeCompare(b.role)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={save} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-100 text-lg">{editing ? 'Edit Clerk' : 'Add New Clerk'}</h2>
            {editing && <p className="text-xs text-gray-500 mt-0.5">Leave PIN blank to keep existing PIN unchanged</p>}
          </div>
          {editing && <button type="button" onClick={resetForm} className="text-sm text-gray-400 hover:text-white">✕ Cancel</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Full Name *</label>
            <input required placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="bg-gray-700 border border-gray-600 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="bg-gray-700 border border-gray-600 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500">
              <option value="clerk">Clerk</option>
              <option value="senior_clerk">Senior Clerk</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Email</label>
            <input type="email" placeholder="rahul@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="bg-gray-700 border border-gray-600 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Phone Number</label>
            <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="bg-gray-700 border border-gray-600 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">{editing ? 'New PIN (blank = keep)' : 'PIN *'}</label>
            <div className="relative">
              <input type={showPin ? 'text' : 'password'} inputMode="numeric" placeholder="Min 4 digits"
                value={form.pin} onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g, '').slice(0, 8)})}
                required={!editing}
                className="w-full bg-gray-700 border border-gray-600 px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-mono tracking-widest" />
              <button type="button" onClick={() => setShowPin(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">{showPin ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Confirm PIN {!editing && '*'}</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} inputMode="numeric" placeholder="Re-enter PIN"
                value={form.confirmPin} onChange={e => setForm({...form, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 8)})}
                required={!editing || !!form.pin}
                className={`w-full bg-gray-700 border px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-1 font-mono tracking-widest ${
                  form.pin && form.confirmPin && form.pin !== form.confirmPin ? 'border-red-500 focus:ring-red-500/30' :
                  form.pin && form.confirmPin && form.pin === form.confirmPin ? 'border-green-500 focus:ring-green-500/30' :
                  'border-gray-600 focus:border-blue-500 focus:ring-blue-500/30'
                }`} />
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">{showConfirm ? 'Hide' : 'Show'}</button>
            </div>
            {form.pin && form.confirmPin && form.pin !== form.confirmPin && <span className="text-red-400 text-xs">PINs do not match</span>}
            {form.pin && form.confirmPin && form.pin === form.confirmPin && <span className="text-green-400 text-xs">PINs match ✓</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-700">
          <button type="submit" className="bg-blue-700 hover:bg-blue-600 px-8 py-2.5 rounded-lg font-bold text-sm">
            {editing ? 'Update Clerk' : 'Add Clerk'}
          </button>
          {editing && <button type="button" onClick={resetForm} className="bg-gray-700 hover:bg-gray-600 px-6 py-2.5 rounded-lg text-sm">Cancel</button>}
          <StatusBadge msg={status} onClear={() => setStatus('')} />
        </div>
      </form>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone, role…" />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Sort:</span>
          <SortBtn label="Name" field="name" current={sortField} dir={sortDir} onSort={toggleSort} />
          <span className="text-gray-700">·</span>
          <SortBtn label="Role" field="role" current={sortField} dir={sortDir} onSort={toggleSort} />
        </div>
        <span className="text-sm text-gray-500">{visible.length} of {clerks.length}</span>
      </div>

      {/* Clerk cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-10 text-center text-gray-500 border border-gray-700">
            {search ? 'No clerks match your search' : 'No clerks yet — add one above'}
          </div>
        )}
        {visible.map(c => {
          const isQueued = pendingIds.has(`clerk-${c.id}`)
          return (
            <div key={c.id} className={`bg-gray-800 rounded-xl border transition-colors ${
              isQueued ? 'border-red-700 bg-red-950/20' :
              editing?.id === c.id ? 'border-blue-500' : 'border-gray-700'
            }`}>
              <div className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isQueued ? 'bg-red-900 text-red-300' :
                  c.active ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-500'
                }`}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold ${isQueued ? 'line-through text-red-400' : 'text-white'}`}>{c.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                      c.role === 'manager' ? 'bg-purple-900 text-purple-300' :
                      c.role === 'senior_clerk' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-700 text-gray-400'
                    }`}>{c.role.replace('_', ' ')}</span>
                    {isQueued && <span className="text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded-full">Queued for deletion</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {c.email && <span className="text-xs text-gray-400">✉ {c.email}</span>}
                    {c.phone && <span className="text-xs text-gray-400">📞 {c.phone}</span>}
                    {!c.email && !c.phone && <span className="text-xs text-gray-600">No contact info</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isQueued && (
                    <button onClick={() => toggleActive(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        c.active ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}>{c.active ? 'Active' : 'Inactive'}</button>
                  )}
                  {!isQueued && (
                    <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors">
                      {expandedId === c.id ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>
              {expandedId === c.id && !isQueued && (
                <div className="border-t border-gray-700 px-4 py-3 flex gap-2 rounded-b-xl">
                  <button onClick={() => startEdit(c)} className="bg-blue-800 hover:bg-blue-700 px-4 py-1.5 rounded-lg text-xs font-medium">Edit / Change PIN</button>
                  <button onClick={() => toggleActive(c)} className="bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded-lg text-xs font-medium">{c.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => queueDelete(c)} className="bg-red-900 hover:bg-red-800 px-4 py-1.5 rounded-lg text-xs font-medium ml-auto">Delete</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Bill Config Tab ───────────────────────────────────────────────────────────
function BillConfigTab() {
  const [config, setConfig] = useState<BillConfig | null>(null)
  const [status, setStatus] = useState('')

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(''), 3000) }
  useEffect(() => { fetch('/api/bill-config').then(r => r.json()).then(setConfig) }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/bill-config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
    if (res.ok) { const d = await res.json(); setConfig(d); flash('Bill settings saved!') }
    else flash('Error saving settings')
  }

  if (!config) return <div className="text-gray-500 text-center py-10">Loading…</div>
  const set = (key: keyof BillConfig, val: string | boolean | number) => setConfig(prev => prev ? { ...prev, [key]: val } : prev)

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <h2 className="font-bold text-gray-200 mb-4">Shop Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([['shopName','Shop Name'],['shopAddress','Address'],['shopPhone','Phone Number'],['shopGST','GST Number'],['currency','Currency Symbol'],['footerMessage','Footer Message']] as [keyof BillConfig, string][]).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
              <input type="text" value={String(config[key])} onChange={e => set(key, e.target.value)}
                className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Paper Width (mm)</label>
            <select value={config.paperWidth} onChange={e => set('paperWidth', parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
              <option value={58}>58mm (small thermal)</option>
              <option value={80}>80mm (standard thermal)</option>
              <option value={210}>A4 (210mm)</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <h2 className="font-bold text-gray-200 mb-4">Show / Hide on Bill</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([['showAddress','Address'],['showPhone','Phone'],['showGST','GST Number'],['showClerk','Clerk Name'],['showTable','Table Number'],['showItemRate','Item Rate'],['showDiscount','Discount Line'],['showLogo','Logo (coming soon)']] as [keyof BillConfig, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => set(key, !config[key])} className={`w-10 h-5 rounded-full transition-colors relative ${config[key] ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <h2 className="font-bold text-gray-200 mb-4">Bill Preview</h2>
        <div className="bg-white text-black p-4 rounded-lg font-mono text-xs max-w-xs mx-auto shadow-lg">
          <div className="text-center font-bold text-sm mb-1">{config.shopName}</div>
          {config.showAddress && config.shopAddress && <div className="text-center text-[10px] text-gray-600">{config.shopAddress}</div>}
          {config.showPhone && config.shopPhone && <div className="text-center text-[10px] text-gray-600">Ph: {config.shopPhone}</div>}
          {config.showGST && config.shopGST && <div className="text-center text-[10px] text-gray-600">GST: {config.shopGST}</div>}
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="text-[10px] text-gray-500">Bill No: BILL-20260311-123456</div>
          {config.showClerk && <div className="text-[10px] text-gray-500">Clerk: CLERK 001</div>}
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="grid grid-cols-4 text-[9px] font-bold border-b border-gray-300 pb-1">
            <span>Item</span><span className="text-center">Qty</span>{config.showItemRate && <span className="text-right">Rate</span>}<span className="text-right">Amt</span>
          </div>
          <div className="text-[9px] mt-1 grid grid-cols-4">
            <span>Sample Oil</span><span className="text-center">x2</span>{config.showItemRate && <span className="text-right">90.00</span>}<span className="text-right">180.00</span>
          </div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex justify-between text-[10px]"><span>Subtotal</span><span>{config.currency} 180.00</span></div>
          {config.showDiscount && <div className="flex justify-between text-[10px] text-red-600"><span>Discount</span><span>- {config.currency} 10.00</span></div>}
          <div className="flex justify-between font-bold text-xs mt-1"><span>TOTAL</span><span>{config.currency} 170.00</span></div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="text-center text-[10px] text-gray-500">{config.footerMessage}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="bg-blue-700 hover:bg-blue-600 px-8 py-3 rounded-xl font-bold">Save Bill Settings</button>
        <StatusBadge msg={status} onClear={() => setStatus('')} />
      </div>
    </form>
  )
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const router = useRouter()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [status, setStatus] = useState('')

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(''), 4000) }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { flash('Error: Passwords do not match'); return }
    const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) })
    if (res.ok) { flash('Password changed!'); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
    else { const d = await res.json(); flash('Error: ' + d.error) }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div className="space-y-5 max-w-md">
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <h2 className="font-bold text-gray-200 mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map(field => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} required minLength={4}
                className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="bg-blue-700 hover:bg-blue-600 px-6 py-2 rounded-lg font-bold text-sm">Change Password</button>
            <StatusBadge msg={status} onClear={() => setStatus('')} />
          </div>
        </form>
      </div>
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <h2 className="font-bold text-gray-200 mb-2">Session</h2>
        <p className="text-gray-400 text-sm mb-4">Sessions expire after 8 hours.</p>
        <button onClick={logout} className="bg-red-800 hover:bg-red-700 px-6 py-2 rounded-lg font-bold text-sm">Sign Out</button>
      </div>
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
const TAB_KEYS: Tab[] = ['products', 'categories', 'clerks', 'bill-config', 'settings']

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('products')
  const [categories, setCategories] = useState<Category[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [showReview, setShowReview] = useState(false)

  useGlobalZoomKeys()

  const loadCategories = useCallback(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [])
  useEffect(() => { loadCategories() }, [loadCategories])

  const pendingIds = new Set(pendingChanges.map(c => c.id))

  const onQueueDelete = useCallback((change: PendingChange) => {
    setPendingChanges(prev => {
      // Toggle: if already queued, remove it
      if (prev.some(c => c.id === change.id)) return prev.filter(c => c.id !== change.id)
      return [...prev, change]
    })
  }, [])

  const onRemoveFromQueue = (id: string) => {
    setPendingChanges(prev => prev.filter(c => c.id !== id))
  }

  const onApplyAll = async () => {
    for (const change of pendingChanges) {
      await change.execute()
    }
    setPendingChanges([])
    setShowReview(false)
    loadCategories()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault(); setShowHelp(p => !p); return
      }
      if (e.key === 'Escape') { setShowHelp(false); setShowReview(false); return }
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault()
          const form = (e.target as HTMLElement).closest('form') as HTMLFormElement | null
          form?.requestSubmit()
        }
        return
      }
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const n = parseInt(e.key)
        if (n >= 1 && n <= TAB_KEYS.length) { e.preventDefault(); setTab(TAB_KEYS[n - 1]) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const tabs: { key: Tab; label: string; icon: string; hint: string }[] = [
    { key: 'products',    label: 'Products',    icon: '📦', hint: '1' },
    { key: 'categories',  label: 'Categories',  icon: '📂', hint: '2' },
    { key: 'clerks',      label: 'Clerks',      icon: '👤', hint: '3' },
    { key: 'bill-config', label: 'Bill Config', icon: '🧾', hint: '4' },
    { key: 'settings',    label: 'Settings',    icon: '⚙️', hint: '5' },
  ]

  return (
    <div className="page-scroll bg-gray-950 text-white">
      {showHelp && <KeyboardHelp mode="admin" onClose={() => setShowHelp(false)} />}
      {showReview && (
        <ReviewModal
          changes={pendingChanges}
          onRemove={onRemoveFromQueue}
          onApply={onApplyAll}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-gray-900 border-b border-gray-700">
        <div className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Admin Portal</h1>
            <p className="text-gray-500 text-xs">Inventory Manager POS</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pending changes pill */}
            {pendingChanges.length > 0 && (
              <button onClick={() => setShowReview(true)}
                className="flex items-center gap-2 bg-red-900 hover:bg-red-800 border border-red-700
                           text-red-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors animate-pulse">
                <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold not-italic">
                  {pendingChanges.length}
                </span>
                Review Deletions
              </button>
            )}
            <ZoomControl />
            <button onClick={() => setShowHelp(true)}
              className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-600">
              ⌨ Shortcuts
            </button>
            <a href="/bills" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Bill History</a>
            <a href="/" className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">POS Screen</a>
          </div>
        </div>
        {/* Tab bar */}
        <div className="px-6 overflow-x-auto">
          <div className="flex gap-0.5 min-w-max">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key ? 'border-blue-500 text-white bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                }`}>
                <span>{t.icon}</span> {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${tab === t.key ? 'bg-blue-900 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto pb-16">
        {tab === 'products' && (
          <ProductsTab categories={categories} pendingIds={pendingIds} onQueueDelete={onQueueDelete} />
        )}
        {tab === 'categories' && (
          <CategoriesTab categories={categories} onReload={loadCategories} pendingIds={pendingIds} onQueueDelete={onQueueDelete} />
        )}
        {tab === 'clerks' && (
          <ClerksTab pendingIds={pendingIds} onQueueDelete={onQueueDelete} />
        )}
        {tab === 'bill-config' && <BillConfigTab />}
        {tab === 'settings'    && <SettingsTab />}
      </div>

      <ScrollToTop />
    </div>
  )
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-30 bg-blue-700 hover:bg-blue-600 text-white
                 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-lg
                 transition-all hover:scale-110" title="Back to top">
      ↑
    </button>
  )
}
