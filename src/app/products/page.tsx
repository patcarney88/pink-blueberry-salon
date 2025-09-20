import { ShopProvider } from '@/contexts/ShopContext'
import ProductGrid from '@/components/products/ProductGrid'
import CartDrawer from '@/components/cart/CartDrawer'

export default function ProductsPage() {
  return (
    <ShopProvider>
      <main>
        <ProductGrid
          title="Luxury Salon Products"
          subtitle="Discover our curated collection of professional-grade products for all your beauty needs"
        />
        <CartDrawer />
      </main>
    </ShopProvider>
  )
}