import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  CheckSquare,
  Tag,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Copyright,
  UserCheck,
  AlertTriangle,
  Scale,
  Mail,
  ArrowRight,
  CheckCircle2,
  DollarSign
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | GR STYLES",
  description:
    "Review the Terms and Conditions governing your use of GR STYLES, product purchases, payments, shipping, intellectual property, and governing law.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#1a1a1a]">
      {/* Header Banner */}
      <section className="bg-[#f8f6f3] border-b border-[#e8e3dc] py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#8b7b6b]/10 text-[#8b7b6b]">
              <FileText size={14} />
              Legal & Usage Terms
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#1a1a1a] tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-sm md:text-base text-[#6b5b4b] max-w-2xl mx-auto font-light">
              Welcome to GR STYLES. Please read these terms carefully before accessing or using our platform and making purchases.
            </p>
            <div className="inline-block pt-2 text-xs text-[#8b7b6b] border-t border-[#e8e3dc]">
              Last Updated: <span className="font-semibold text-[#1a1a1a]">July 31, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-12">

          {/* Quick Key Highlights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Binding Agreement</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                By using GR STYLES, you agree to comply with all terms set forth on this site.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <Copyright className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Intellectual Property</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                All store designs, graphics, branding, and content are protected under copyright laws.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Governing Law</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                Subject to jurisdiction and laws of India for all legal rights and disputes.
              </p>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-[#e8e3dc] shadow-sm">

            {/* 1. Acceptance of Terms */}
            <div id="acceptance" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <CheckSquare size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">1. Acceptance of Terms</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                By browsing, accessing, or making a purchase on <strong>GR STYLES</strong> (the "Website"), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions and our associated Privacy Policy and Shipping & Returns Policy. If you do not agree to these terms, please do not use the website.
              </p>
            </div>

            {/* 2. Products & Pricing */}
            <div id="products-pricing" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Tag size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">2. Products & Pricing</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We make every effort to display the colors, fabrics, and descriptions of our menswear collections as accurately as possible.
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Pricing Currency:</strong> All prices listed on the site are in Indian Rupees (INR) and are inclusive of applicable GST taxes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Price Modifications:</strong> Prices and item availability are subject to change without prior notice.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Errors:</strong> In the event of a typographical error in pricing or specifications, GR STYLES reserves the right to correct the error or cancel any affected orders.</span>
                </li>
              </ul>
            </div>

            {/* 3. Orders */}
            <div id="orders" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <ShoppingBag size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">3. Orders & Placement</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                Placing an order on GR STYLES constitutes an offer to purchase the specified items. All orders are subject to stock availability and acceptance by GR STYLES. We reserve the right to decline or limit order quantities at our sole discretion.
              </p>
            </div>

            {/* 4. Payment Methods & 5. Cash on Delivery */}
            <div id="payment-methods" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <CreditCard size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">4. Payment Methods & Cash on Delivery</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We support multiple convenient digital and offline payment modes:
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Online Payments:</strong> UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, and Net Banking via Razorpay.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Cash on Delivery (COD):</strong> Available for eligible PIN codes across India. Order verification via SMS/WhatsApp may be requested prior to dispatch.</span>
                </li>
              </ul>
            </div>

            {/* 6. Shipping & Delivery */}
            <div id="shipping-terms" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Truck size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">6. Shipping & Delivery</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                Delivery timelines provided during checkout are estimates. While we strive to fulfill orders promptly, GR STYLES is not liable for minor courier delays caused by weather conditions, remote region logistics, or unforeseen transport interruptions. Detailed information is provided in our <Link href="/shipping-returns" className="text-[#1a1a1a] underline font-medium">Shipping & Returns Policy</Link>.
              </p>
            </div>

            {/* 7. Returns & Refunds */}
            <div id="returns-terms" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <RotateCcw size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">7. Returns & Refunds</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                Returns and exchanges are governed strictly by our 7-day return window. Items returned without tags or showing signs of wear, washing, or alteration will be rejected during quality inspection.
              </p>
            </div>

            {/* 8. Intellectual Property */}
            <div id="intellectual-property" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Copyright size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">8. Intellectual Property Rights</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                All content published on this website—including images, product photographs, logos, brand titles, text descriptions, graphics, code, and UI design elements—is the exclusive intellectual property of <strong>GR STYLES</strong> and protected by trademark and copyright laws of India. Any unauthorized reproduction, copying, distribution, or commercial exploitation is strictly prohibited.
              </p>
            </div>

            {/* 9. User Responsibilities */}
            <div id="user-responsibilities" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <UserCheck size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">9. User Responsibilities & Prohibitions</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                As a user of the site, you agree not to:
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Provide inaccurate, fraudulent, or incomplete information during checkout or registration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Attempt to bypass website security controls, tamper with APIs, or introduce malicious software.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Engage in unauthorized scraping, automated data harvesting, or copying of store listings.</span>
                </li>
              </ul>
            </div>

            {/* 10. Limitation of Liability */}
            <div id="limitation-liability" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <AlertTriangle size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">10. Limitation of Liability</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                To the maximum extent permitted by applicable Indian laws, GR STYLES shall not be liable for any indirect, incidental, special, or consequential damages arising out of the use or inability to use the site or products purchased.
              </p>
            </div>

            {/* 11. Governing Law (India) */}
            <div id="governing-law" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Scale size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">11. Governing Law & Jurisdiction</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising out of or related to these terms or transactions on the website shall fall under the exclusive jurisdiction of the competent courts in India.
              </p>
            </div>

            {/* 12. Contact Information */}
            <div id="terms-contact" className="scroll-mt-24 space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Mail size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">12. Contact Information</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                For questions regarding these Terms & Conditions or legal inquiries, please contact our support team:
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
