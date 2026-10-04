import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FlameCursor from './components/FlameCursor';
import { CartProvider } from './lib/CartContext';
import StoreNav from './components/StoreNav';
import { Outlet } from 'react-router-dom';

const AdminApp = lazy(() => import('./admin/AdminApp'));
const CategoryPage = lazy(() => import('./components/CategoryPage'));
const CartPage = lazy(() => import('./components/CartPage'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const OrderConfirmation = lazy(() => import('./components/OrderConfirmation'));

const StoreLoading = () => <><StoreNav /><p role="status" className="pt-32 text-center text-gray-500">Loading…</p></>;

const HomePage: React.FC = () => {
  React.useEffect(() => {
    const saved = sessionStorage.getItem('galleryScrollY');
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
      sessionStorage.removeItem('galleryScrollY');
    }
  }, []);

  return (
  <div className="min-h-screen bg-white">
    <StoreNav />

    <main>
      <Hero />
      <Gallery />
      <Contact />
    </main>

    <Footer />
  </div>
  );
};

const App: React.FC = () => (
  <>
    <FlameCursor />
    <BrowserRouter>
      <Routes>
        <Route element={<CartProvider><Suspense fallback={<StoreLoading />}><Outlet /></Suspense></CartProvider>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        </Route>
        <Route path="/admin/*" element={<Suspense fallback={<p role="status" className="p-8">Loading admin…</p>}><AdminApp /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
