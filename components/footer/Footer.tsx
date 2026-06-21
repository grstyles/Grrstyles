"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Truck,
  RotateCcw,
  Shield,
  Gift,
  Phone,
  MapPin,
  ArrowRight,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";

// WhatsApp Popup Component
const WhatsAppPopup = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative transform animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageCircle size={36} className="text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Let's Connect! 🚀
          </h3>

          <p className="text-gray-600 text-sm mb-2">
            We'd love to hear from you! Our team is ready to help you grow your business.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 text-sm text-gray-700 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Average response time: <strong>15-30 minutes</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Sparkles size={16} className="text-green-600" />
              <span>We're excited to <strong>collaborate</strong> with you!</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all hover:border-gray-300"
            >
              Maybe Later
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <MessageCircle size={18} />
              Open WhatsApp
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            By continuing, you agree to our privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Footer() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsNavigating(true);

    setTimeout(() => {
      router.push(href);
      setIsNavigating(false);
    }, 400);
  };

  const handleWhatsAppRedirect = () => {
    setShowWhatsAppPopup(true);
  };

  const confirmWhatsAppRedirect = () => {
    const phoneNumber = "919392472134";
    const message = encodeURIComponent(
      "Hi Autofy.ai Team! 👋\n\n" +
      "I came across your amazing work and would love to connect with you.\n\n" +
      "I'm interested in learning more about:\n" +
      "✅ Your services and expertise\n" +
      "✅ How you can help my business grow\n" +
      "✅ Pricing and packages\n" +
      "✅ Collaboration opportunities\n\n" +
      "Looking forward to working with you! 🚀\n\n" +
      "Best regards"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setShowWhatsAppPopup(false);
  };

  const footerLinks = {
    explore: [
      { name: "New in", href: "/new-in" },
      { name: "Men", href: "/men" },
      { name: "Collections", href: "/collections" },
      { name: "Sale", href: "/sale" },
      { name: "Contact", href: "/contact" },
    ],
    policies: [
      { name: "Shipping & Returns", href: "/shipping-returns" },
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms & Conditions", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-[#f8f6f3] text-[#1a1a1a]">
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-[#8b7b6b] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#8b7b6b] rounded-full animate-pulse"></div>
                </div>
              </div>
              <span className="text-[#1a1a1a] font-medium text-sm tracking-wide">
                Loading...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trust Badges - Medium Size */}
      <div className="border-b border-[#e8e3dc]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center group">
              <Truck className="w-8 h-8 text-[#8b7b6b] mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold text-sm mb-1 text-[#1a1a1a]">
                FREE SHIPPING
              </h3>
              <p className="text-xs text-[#6b5b4b]">On orders over ₹999</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <RotateCcw className="w-8 h-8 text-[#8b7b6b] mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold text-sm mb-1 text-[#1a1a1a]">
                EASY RETURNS
              </h3>
              <p className="text-xs text-[#6b5b4b]">15 days return policy</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <Shield className="w-8 h-8 text-[#8b7b6b] mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold text-sm mb-1 text-[#1a1a1a]">
                PREMIUM QUALITY
              </h3>
              <p className="text-xs text-[#6b5b4b]">Best quality products</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <Gift className="w-8 h-8 text-[#8b7b6b] mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold text-sm mb-1 text-[#1a1a1a]">
                EXCLUSIVE OFFERS
              </h3>
              <p className="text-xs text-[#6b5b4b]">On all prepaid orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer - Medium Size */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-3xl font-light mb-3 tracking-wide text-[#1a1a1a]">
              GR STYLES
            </h2>
            <p className="text-[#6b5b4b] text-sm leading-relaxed mb-5 font-light italic">
              Premium Menswear Collection for Modern Men
            </p>

            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/grstyles_/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 text-[#1a1a1a] hover:scale-110"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://wa.me/919553422743"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all duration-300 text-[#1a1a1a] hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
              <a
                href="mailto:grstyles955@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 text-[#1a1a1a] hover:scale-110"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider mb-4 text-[#1a1a1a] border-b border-[#e8e3dc] pb-2">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="text-[#6b5b4b] hover:text-[#1a1a1a] transition-all duration-300 text-sm font-light hover:translate-x-1 inline-block group"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider mb-4 text-[#1a1a1a] border-b border-[#e8e3dc] pb-2">
              Policies
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.policies.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="text-[#6b5b4b] hover:text-[#1a1a1a] transition-all duration-300 text-sm font-light hover:translate-x-1 inline-block group"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Us */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider mb-4 text-[#1a1a1a] border-b border-[#e8e3dc] pb-2">
              Visit Us
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-[#6b5b4b] text-sm font-light">
                <MapPin size={16} className="text-[#8b7b6b] mt-0.5 flex-shrink-0" />
                <p>Afia Plaza, Masab Tank</p>
              </div>
              <div className="flex items-center gap-3 text-[#6b5b4b] text-sm font-light group">
                <Phone size={16} className="text-[#8b7b6b] group-hover:text-[#1a1a1a] transition-colors" />
                <a href="tel:+919553422743" className="hover:text-[#1a1a1a] transition-colors duration-300">
                  +91 95534 22743
                </a>
              </div>
              <div className="flex items-center gap-3 text-[#6b5b4b] text-sm font-light group">
                <Mail size={16} className="text-[#8b7b6b] group-hover:text-[#1a1a1a] transition-colors" />
                <a href="mailto:grstyles955@gmail.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1a1a] transition-colors duration-300">
                  grstyles955@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Medium Size Text */}
        <div className="border-t border-[#e8e3dc] pt-8 mt-6">
          <div className="flex flex-col items-center text-center">
            {/* "Designed and Developed by" - Medium */}
            <p className="text-[#6b5b4b] text-sm sm:text-base font-light flex items-center justify-center gap-2 flex-wrap">
              <span>Designed and Developed by</span>

              <span
                className="text-xl sm:text-2xl font-bold text-[#7c3aed] hover:text-[#6d28d9] transition-all duration-300 cursor-pointer group inline-flex items-center gap-1.5"
                onClick={handleWhatsAppRedirect}
              >
                Autofy.ai
                <ArrowRight
                  size={20}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1"
                />
              </span>
            </p>

            {/* Copyright - Medium */}
            <div className="mt-4 flex flex-col items-center gap-1">
              <p className="text-[#6b5b4b] text-lg sm:text-xl font-medium">
                © 2026 Autofy.ai
              </p>
              <p className="text-[#6b5b4b] text-sm sm:text-base font-light">
                All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Popup */}
      <WhatsAppPopup
        isOpen={showWhatsAppPopup}
        onClose={() => setShowWhatsAppPopup(false)}
        onConfirm={confirmWhatsAppRedirect}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-in-out; }
      `}</style>
    </footer>
  );
}