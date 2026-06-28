'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();
  const cartItemsCount = useSelector((state: RootState) => 
    state.cart.items.reduce((total, item) => total + item.quantity, 0)
  );
  const wishlistItemsCount = useSelector((state: RootState) => state.wishlist.items.length);

  // Hidden on admin pages or checkout
  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Shop', icon: Search, href: '/search' },
    { label: 'Wishlist', icon: Heart, href: '/wishlist', badge: wishlistItemsCount },
    { label: 'Cart', icon: ShoppingBag, href: '/cart', badge: cartItemsCount },
    { label: 'Account', icon: User, href: '/profile' },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed navbar */}
      <div className="h-16 md:hidden"></div>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl pb-safe">
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 group"
              >
                <div className="relative">
                  <Icon 
                    size={22} 
                    className={`transition-colors duration-200 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
