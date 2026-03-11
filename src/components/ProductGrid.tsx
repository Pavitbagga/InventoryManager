'use client'
import { Category, Product } from '@/types'

interface Props {
  categories: Category[]
  activeCategory: number
  onCategoryChange: (id: number) => void
  onProductClick: (product: Product) => void
}

export default function ProductGrid({
  categories,
  activeCategory,
  onCategoryChange,
  onProductClick,
}: Props) {
  const active = categories.find((c) => c.id === activeCategory)
  const products = active?.products || []

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-1.5 px-3 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-5 py-1.5 text-sm font-bold rounded uppercase tracking-widest transition-colors ${
              cat.id === activeCategory
                ? 'bg-white text-gray-900 shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <div className="grid grid-cols-5 gap-1.5">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              style={{ backgroundColor: product.color }}
              className="min-h-[72px] rounded p-1.5 text-white font-bold leading-tight
                         hover:brightness-110 active:scale-95 transition-all duration-75
                         shadow-md border border-white/10 flex flex-col items-center
                         justify-center text-center gap-0.5"
            >
              <span className="text-[10px] leading-tight">{product.name}</span>
              <span className="text-[9px] text-white/70 font-normal">
                Rs.{product.price.toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
