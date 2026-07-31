import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  RotateCcw,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Returns Policy | GR STYLES",
  description:
    "Everything you need to know about order shipping, delivery timelines, tracking, returns, exchanges, and refund processes at GR STYLES.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#1a1a1a]">
      {/* Header Banner */}
      <section className="bg-[#f8f6f3] border-b border-[#e8e3dc] py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#8b7b6b]/10 text-[#8b7b6b]">
              <Truck size={14} />
              Customer Support & Care
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#1a1a1a] tracking-tight">
              Shipping & Returns Policy
            </h1>
            <p className="text-sm md:text-base text-[#6b5b4b] max-w-2xl mx-auto font-light">
              We aim to deliver your orders promptly and hassle-free. Review our shipping details, return procedures, and refund timelines below.
            </p>
            <div className="inline-block pt-2 text-xs text-[#8b7b6b] border-t border-[#e8e3dc]">
              Last Updated: <span className="font-semibold text-[#1a1a1a]">July 31, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-12">
          
          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Dispatch & Delivery</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                Orders are processed within 24–48 hours. Standard delivery takes 3–7 business days across India.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Free Shipping</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                Enjoy free standard shipping on all prepaid orders across India.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">7-Day Easy Returns</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                Request returns or size exchanges within 7 days of receiving your package.
              </p>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-[#e8e3dc] shadow-sm">

            {/* 1. Order Processing */}
            <div id="order-processing" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Package size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">1. Order Processing</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                All orders are processed and queued for shipping Monday through Saturday, excluding public holidays.
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Orders placed before 2:00 PM IST are usually prepared for dispatch on the same working day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>You will receive an instant confirmation email and WhatsApp message (if enabled) upon order placement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Customized or high-demand items may require an extra 24–48 hours for quality check before dispatch.</span>
                </li>
              </ul>
            </div>

            {/* 2. Shipping Time */}
            <div id="shipping-time" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Clock size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">2. Shipping Time</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We partner with India's top courier logistics (Bluedart, Delhivery, DTDC, Xpressbees) to ensure speedy delivery.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#e8e3dc]">
                  <span className="text-xs font-semibold text-[#8b7b6b] uppercase tracking-wider block mb-1">Metro Cities</span>
                  <p className="text-sm font-medium text-[#1a1a1a]">2 – 4 Business Days</p>
                  <p className="text-xs text-[#6b5b4b] mt-1">Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune.</p>
                </div>
                <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#e8e3dc]">
                  <span className="text-xs font-semibold text-[#8b7b6b] uppercase tracking-wider block mb-1">Rest of India</span>
                  <p className="text-sm font-medium text-[#1a1a1a]">4 – 7 Business Days</p>
                  <p className="text-xs text-[#6b5b4b] mt-1">Tier 2, Tier 3 cities, and special delivery regions.</p>
                </div>
              </div>
            </div>

            {/* 3. Shipping Charges & 4. Free Shipping */}
            <div id="shipping-charges" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <CreditCard size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">3. Shipping Charges & Free Shipping</h2>
              </div>
              <div className="space-y-3 text-sm text-[#6b5b4b] leading-relaxed">
                <p>
                  We keep our shipping simple and transparent with zero hidden fees:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded-lg border border-[#e8e3dc]">
                    <span className="font-medium text-[#1a1a1a]">Prepaid Orders (UPI / Cards / NetBanking)</span>
                    <span className="text-emerald-700 font-bold uppercase text-xs tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Free Shipping</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded-lg border border-[#e8e3dc]">
                    <span className="font-medium text-[#1a1a1a]">Cash on Delivery (COD)</span>
                    <span className="text-[#1a1a1a] font-semibold text-xs">Standard Nominal COD Fee Applies</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Order Tracking */}
            <div id="order-tracking" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Truck size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">5. Order Tracking</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                As soon as your package is dispatched, we send an AWB Tracking number and direct tracking link to your registered email and phone number.
              </p>
              <p className="text-sm text-[#6b5b4b]">
                You can also log in to your <Link href="/account" className="text-[#1a1a1a] underline font-medium hover:text-[#8b7b6b]">Account Dashboard</Link> or visit the <Link href="/orders" className="text-[#1a1a1a] underline font-medium hover:text-[#8b7b6b]">My Orders</Link> section to track real-time parcel updates.
              </p>
            </div>

            {/* 6. Returns & 7. Exchanges */}
            <div id="returns-exchanges" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <RotateCcw size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">6. Returns & Exchanges Policy</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We want you to love what you wear. If the size isn't right or you're unsatisfied with your purchase, you can return or exchange the product within <strong>7 days</strong> of delivery.
              </p>

              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#e8e3dc] space-y-3 text-sm text-[#6b5b4b]">
                <h4 className="font-semibold text-[#1a1a1a] text-sm">Return Eligibility Criteria:</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li>Items must be unused, unwashed, undamaged, and in original condition.</li>
                  <li>All original brand tags, labels, packaging, and invoices must be intact.</li>
                  <li>Combos or promotional items must be returned with all constituent pieces.</li>
                </ul>
              </div>

              <div className="pt-2">
                <h4 className="font-semibold text-[#1a1a1a] text-sm mb-2">How to Request an Exchange:</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[#6b5b4b]">
                  <li>Navigate to your account profile or contact support at <a href="mailto:grstyles955@gmail.com" className="text-[#1a1a1a] underline font-medium">grstyles955@gmail.com</a>.</li>
                  <li>Specify your Order ID, product details, and requested replacement size or reason.</li>
                  <li>Our reverse logistics partner will arrange a doorstep pickup within 2–3 days.</li>
                </ol>
              </div>
            </div>

            {/* 8. Refund Process */}
            <div id="refund-process" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <RefreshCw size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">8. Refund Process</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                Once your returned package reaches our warehouse and passes quality verification:
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Prepaid Orders:</strong> Refund will be credited back to your original payment method (Bank Account, Credit/Debit Card, UPI) within <strong>5–7 business days</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>COD Orders:</strong> Refund will be processed via direct UPI transfer or Bank Account Transfer after collecting account details from you.</span>
                </li>
              </ul>
            </div>

            {/* 9. Cancellation Policy */}
            <div id="cancellation-policy" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <AlertCircle size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">9. Cancellation Policy</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                You can cancel your order anytime before it has been dispatched from our warehouse.
              </p>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                If the order has already been handed over to the courier, cancellation cannot be processed directly, but you may refuse delivery or request a return after delivery.
              </p>
            </div>

            {/* 10. Contact Support */}
            <div id="contact-support" className="scroll-mt-24 space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <HelpCircle size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">10. Need Assistance?</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                Our support team is here to assist you with any questions regarding shipping, returns, or product inquiries.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="mailto:grstyles955@gmail.com"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-[#8b7b6b] transition-colors"
                >
                  <Mail size={16} />
                  Email: grstyles955@gmail.com
                </a>
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#f8f6f3] text-[#1a1a1a] border border-[#e8e3dc] rounded-xl text-sm font-medium hover:bg-[#e8e3dc] transition-colors"
                >
                  Contact Page
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
