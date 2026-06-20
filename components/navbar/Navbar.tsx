'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Search, Heart, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { toggleMobileMenu } from '@/lib/redux/slices/uiSlice';
import SearchDropdown from './SearchDropdown';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state: RootState) => state.ui.mobileMenuOpen);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  
  const { user, requireAuth } = useAuth();
  const router = useRouter();

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault();
    requireAuth((loggedInUser) => {
      const currentUser = loggedInUser || user;
      const dest = currentUser?.role === 'admin' ? '/admin' : '/profile';
      router.push(dest);
    });
  };

  const [wiggleCart, setWiggleCart] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (cartCount === 0) return;
    setWiggleCart(true);
    const timer = setTimeout(() => setWiggleCart(false), 600);
    return () => clearTimeout(timer);
  }, [cartCount]);

  const navLinks = [
    { name: 'NEW IN', href: '/new-in' },
    { name: 'MEN', href: '/men' },
    { name: 'COLLECTIONS', href: '/collections' },
    { name: 'SALE', href: '/sale' },
    { name: 'CONTACT', href: '/contact' },


   
  ];

  return (
    <>
      {/* Desktop/Tablet Navbar */}
      <nav className="sticky top-14 md:top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {/* Icon/Logo Image */}
              <div className="relative w-10 h-10 md:w-12 md:h-12">
                <img
                  src="/images/image5.jpeg"
                  alt="GR Styles Logo"
                  className="object-contain"
                  sizes="(max-width: 768px) 50px, 40px"
                />
              </div>
              
              {/* Text Section */}
              <div>
                <div className="text-sm md:text-lg font-serif font-bold tracking-wider">GR STYLES</div>
                <div className="text-[8px] md:text-[10px] text-gray-600 tracking-widest">WEAR YOUR CONFIDENCE</div>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs font-semibold tracking-wider uppercase hover:text-black text-gray-800 transition-colors border-b-2 border-transparent hover:border-black"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-3 md:gap-4">
              
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800"
                aria-label="Open Search"
              >
                <Search size={18} className="md:w-5 md:h-5" />
              </button>

              <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart size={18} className="md:w-5 md:h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link 
                href="/cart" 
                className={`relative p-2 hover:bg-gray-100 rounded-full transition-all duration-300 block ${
                  wiggleCart ? 'animate-cart-wiggle scale-110 text-black bg-gray-50' : 'text-gray-800'
                }`}
              >
                <ShoppingBag size={18} className="md:w-5 md:h-5 transition-transform" />
                {cartCount > 0 && (
                  <span 
                    key={cartCount} 
                    className="absolute top-1 right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-cart-pop"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleUserClick}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800"
                aria-label="User Account"
              >
                <User size={18} className="md:w-5 md:h-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => dispatch(toggleMobileMenu())}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        {searchOpen && <SearchDropdown onClose={() => setSearchOpen(false)} />}
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-white md:hidden">
          <div className="pt-20 pb-6 px-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block py-3 text-sm font-semibold tracking-widest uppercase hover:text-gray-600"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
