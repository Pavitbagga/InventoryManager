export interface Product {
  id: number
  name: string
  price: number
  color: string
  pluCode?: string | null
  stock: number
  categoryId: number
  category?: Category
}

export interface Category {
  id: number
  name: string
  color: string
  position: number
  products?: Product[]
}

export interface Clerk {
  id: number
  name: string
  pin: string
  email?: string | null
  phone?: string | null
  role: string
  active: boolean
  createdAt: string
}

export interface CartItem {
  product: Product
  quantity: number
  total: number
}

export interface Bill {
  id: number
  billNumber: string
  clerkId: string
  tableNumber?: string | null
  subtotal: number
  discount: number
  total: number
  paymentMode: string
  status: string
  items: BillItem[]
  createdAt: string
}

export interface BillItem {
  id: number
  billId: number
  productId: number
  name: string
  price: number
  quantity: number
  total: number
}
