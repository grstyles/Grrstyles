'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Heart, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { toggleMobileMenu, closeMobileMenu } from '@/lib/redux/slices/uiSlice';
import SearchDropdown from './SearchDropdown';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state: RootState) => state.ui.mobileMenuOpen);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 60) {
        // Always show near the top (accounting for TopBar height)
        setIsVisible(true);
      } else {
        const diff = currentScrollY - lastScrollY.current;
        if (diff > scrollThreshold) {
          // Scrolled down enough
          setIsVisible(false);
          lastScrollY.current = currentScrollY;
        } else if (diff < -scrollThreshold) {
          // Scrolled up enough
          setIsVisible(true);
          lastScrollY.current = currentScrollY;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    dispatch(closeMobileMenu());
  }, [pathname, dispatch]);

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
      <nav 
        className={`sticky top-0 z-40 w-full bg-white border-b border-gray-200 transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 md:h-20 relative">
            
            {/* Mobile Hamburger (Left) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => dispatch(toggleMobileMenu())}
                className="p-1.5 sm:p-2 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-800"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Logo */}
            <Link 
              href="/" 
              className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              {/* Icon/Logo Image */}
              <div className="relative w-9 h-9 sm:w-[46px] sm:h-[46px] md:w-[54px] md:h-[54px]">
                <img
                  src="/images/image5.jpeg"
                  alt="GR Styles Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Text Section */}
              <div className="flex flex-col justify-center">
                <div className="text-[13.5px] sm:text-[17px] md:text-[20px] font-serif font-bold tracking-wider leading-tight whitespace-nowrap">GR STYLES</div>
                <div className="text-[7px] sm:text-[8.5px] md:text-[11.5px] text-gray-600 tracking-widest whitespace-nowrap">WEAR YOUR CONFIDENCE</div>
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
            <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-4 ml-auto">
              
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800"
                aria-label="Open Search"
              >
                <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-5 md:h-5" />
              </button>

              <Link href="/wishlist" className="hidden md:flex relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800">
                <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-5 md:h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 sm:w-5 sm:h-5 flex items-center justify-center font-semibold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link 
                href="/cart" 
                className={`hidden md:block relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-all duration-300 ${
                  wiggleCart ? 'animate-cart-wiggle scale-110 text-black bg-gray-50' : 'text-gray-800'
                }`}
              >
                <ShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-5 md:h-5 transition-transform" />
                {cartCount > 0 && (
                  <span 
                    key={cartCount} 
                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-cart-pop"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={handleUserClick}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800 -mr-1.5 sm:mr-0"
                aria-label="User Account"
              >
                <User className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-5 md:h-5" />
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
                onClick={() => dispatch(toggleMobileMenu())}
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
