import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Cookie,
  Users,
  UserCheck,
  RefreshCw,
  Mail,
  ArrowRight,
  CheckCircle2,
  FileText
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | GR STYLES",
  description:
    "Learn how GR STYLES collects, protects, uses, and safeguards your personal data and payment security with Razorpay.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#1a1a1a]">
      {/* Header Banner */}
      <section className="bg-[#f8f6f3] border-b border-[#e8e3dc] py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#8b7b6b]/10 text-[#8b7b6b]">
              <ShieldCheck size={14} />
              Privacy & Trust
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#1a1a1a] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm md:text-base text-[#6b5b4b] max-w-2xl mx-auto font-light">
              Your privacy is paramount to us. This policy outlines how we handle, store, and protect your personal information at GR STYLES.
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

          {/* Core Guarantees Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Encrypted Data</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                All communications and order transactions are encrypted using SSL/TLS security.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">Razorpay Secured</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                Payment data is handled by Razorpay's PCI-DSS compliant payment gateways.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e8e3dc] shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[#1a1a1a]">No Data Sale</h3>
              <p className="text-xs text-[#6b5b4b] leading-relaxed">
                We never sell, trade, or rent your personal information to third parties.
              </p>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-[#e8e3dc] shadow-sm">

            {/* 1. Information We Collect */}
            <div id="info-collect" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Database size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">1. Information We Collect</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                When you visit, register, or make a purchase on GR STYLES, we collect necessary personal details to process your request and enhance your shopping experience:
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Contact Information:</strong> Full name, email address, phone number, shipping and billing address.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Account Details:</strong> Login credentials, saved addresses, wishlist items, and order history.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span><strong>Device & Technical Data:</strong> IP address, browser type, operating system, and browsing activity via standard cookies and analytics.</span>
                </li>
              </ul>
            </div>

            {/* 2. How We Use Information */}
            <div id="how-we-use" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Eye size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">2. How We Use Information</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We utilize your personal information strictly for legitimate commercial and customer service purposes:
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Processing and fulfilling orders, shipping packages, and handling returns or exchanges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Sending order updates, tracking links, invoices, and customer support communications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Improving site performance, optimizing product layout, and tailoring user experience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Preventing fraudulent activity, securing account logins, and maintaining platform integrity.</span>
                </li>
              </ul>
            </div>

            {/* 3. Payment Security (Razorpay) */}
            <div id="payment-security" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Lock size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">3. Payment Security (Razorpay)</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                All online payments on GR STYLES are securely routed through <strong>Razorpay</strong>, India's leading PCI-DSS compliant payment gateway provider.
              </p>
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#e8e3dc] space-y-2 text-sm text-[#6b5b4b]">
                <p className="font-medium text-[#1a1a1a]">Card & Credentials Protection:</p>
                <p className="text-xs sm:text-sm">
                  GR STYLES does <strong>NOT</strong> store or retain sensitive financial information such as credit/debit card numbers, CVVs, expiry dates, or UPI PINs on our servers. All transaction processing occurs directly within Razorpay's end-to-end encrypted payment infrastructure.
                </p>
              </div>
            </div>

            {/* 4. Cookies */}
            <div id="cookies" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Cookie size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">4. Cookies & Tracking Technologies</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We use cookies and similar browser storage techniques to keep you logged in, save your shopping cart contents, and remember your preferences. You can disable cookies in your browser settings, though certain interactive store features may become unavailable.
              </p>
            </div>

            {/* 5. Data Protection */}
            <div id="data-protection" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <ShieldCheck size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">5. Data Protection & Storage</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We employ industry-standard technical, administrative, and physical safety measures to guard your data against unauthorized access, loss, or alteration. Access to personal data is strictly limited to authorized personnel handling fulfillment and customer service.
              </p>
            </div>

            {/* 6. Third-party Services */}
            <div id="third-party" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Users size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">6. Third-party Services</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We share essential details with select third-party service partners strictly to complete your orders:
              </p>
              <ul className="space-y-2 text-sm text-[#6b5b4b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Logistics and courier partners (Bluedart, Delhivery, DTDC) for shipping addresses and phone contacts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Payment processors (Razorpay) for transaction execution.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#8b7b6b] mt-0.5 shrink-0" />
                  <span>Communication gateways for transactional SMS/Email notifications.</span>
                </li>
              </ul>
            </div>

            {/* 7. User Rights */}
            <div id="user-rights" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <UserCheck size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">7. Your Privacy Rights</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                You have the right to access, update, or request deletion of your personal account information at any time. You can manage stored addresses via your account profile or contact customer care to request account data removal.
              </p>
            </div>

            {/* 8. Policy Updates */}
            <div id="policy-updates" className="scroll-mt-24 space-y-3 border-b border-[#e8e3dc] pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <RefreshCw size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">8. Policy Updates</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                We reserve the right to modify this Privacy Policy periodically to reflect legal requirements or operational changes. Any updates will be posted on this page with a revised "Last Updated" timestamp.
              </p>
            </div>

            {/* 9. Contact Information */}
            <div id="contact-info" className="scroll-mt-24 space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f6f3] flex items-center justify-center text-[#8b7b6b]">
                  <Mail size={18} />
                </div>
                <h2 className="text-xl font-serif text-[#1a1a1a]">9. Privacy Contact Information</h2>
              </div>
              <p className="text-sm text-[#6b5b4b] leading-relaxed">
                If you have questions, concerns, or inquiries regarding our privacy practices, please contact our privacy compliance officer:
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
                  Get in Touch
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
