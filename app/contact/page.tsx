"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Copy,
  Check,
  Send,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Handshake,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Custom Social SVGs to prevent dependency mismatches
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a2.96 2.96 0 0 0-2.08-2.1C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.42.6A2.96 2.96 0 0 0 .5 6.2 30.6 30.6 0 0 0 0 12a30.6 30.6 0 0 0 .5 5.8 2.96 2.96 0 0 0 2.08 2.1c1.86.6 9.42.6 9.42.6s7.56 0 9.42-.6a2.96 2.96 0 0 0 2.08-2.1A30.6 30.6 0 0 0 24 12a30.6 30.6 0 0 0-.5-5.8zM9.75 15.5v-7l6 3.5-6 3.5z" />
  </svg>
);

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// Animation variants with proper typing
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function ContactPage() {
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Help",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Newsletter states
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Copy email state
  const [copied, setCopied] = useState(false);

  // FAQ states
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@grstyles.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setFormLoading(true);
    setFormError("");

    // Simulate API request
    setTimeout(() => {
      setFormLoading(false);
      setFormSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Order Help",
        message: "",
      });
      setTimeout(() => setFormSubmitted(false), 5000);
    }, 1500);
  };

  const faqs = [
    {
      question: "How long does standard and express shipping take?",
      answer:
        "Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. Orders placed before 1 PM IST are dispatched the same day.",
    },
    {
      question: "What is your return & exchange policy?",
      answer:
        "We offer a hassle-free 15-day return and exchange policy on all unworn items with tags intact. Returns are completely free, and reverse pickup is organized by us.",
    },
    {
      question: "How do I find the correct size for premium shirts?",
      answer:
        "We recommend checking our detailed Size Guide on each product page or contacting our concierge sizing support with your height, weight, and shoulder measurements.",
    },
    {
      question: "Can I cancel or modify my order after placing it?",
      answer:
        "To ensure fast shipping, orders enter processing immediately. You can modify shipping details or cancel your order within 1 hour of placement by calling our helpline.",
    },
  ];

  return (
    <div className="bg-[#FAF9F6] text-[#111111] font-sans overflow-x-hidden min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative py-20 md:py-28 bg-white border-b border-gray-100 flex flex-col justify-center items-center text-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="max-w-3xl relative z-10"
        >
          <span className="text-xs tracking-[0.25em] text-[#D4AF37] uppercase font-semibold mb-3 block">
            CONCIERGE & SUPPORT
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-gray-900 mb-6">
            Get in Touch
          </h1>
          <div className="w-16 h-[2px] bg-[#D4AF37] mx-auto mb-6" />
          <p className="text-base md:text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            We're here to help with orders, sizing, products, and general
            inquiries. Experience premium luxury assistance.
          </p>
        </motion.div>
      </section>

      {/* 2. Quick Contact & Info Grid */}

      {/* 4. Interactive Contact Form & Image Section */}
      <section
        id="contact-form-section"
        className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* Form Column */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="lg:col-span-7 bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="mb-6">
                <span className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase font-bold mb-2 block">
                  CONTACT FORM
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
                  Send Us a Message
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill out the form below and our response team will review it
                  immediately.
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Input */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="name"
                      className="text-xs font-semibold text-gray-700 mb-2"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-[#FAF9F6]/40"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold text-gray-700 mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="e.g. john@example.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-[#FAF9F6]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone Input */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="phone"
                      className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between"
                    >
                      <span>Phone Number</span>
                      <span className="text-gray-400 font-normal text-[10px]">
                        Optional
                      </span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-[#FAF9F6]/40"
                    />
                  </div>

                  {/* Subject Selector */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="subject"
                      className="text-xs font-semibold text-gray-700 mb-2"
                    >
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="subject"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-[#FAF9F6]/40 appearance-none cursor-pointer"
                      >
                        <option value="Order Help">
                          Order Help & Shipping
                        </option>
                        <option value="Sizing Advice">
                          Sizing & Fabric Details
                        </option>
                        <option value="Returns & Refunds">
                          Returns & Exchanges
                        </option>
                        <option value="Business & Wholesale">
                          Wholesale & Collaborations
                        </option>
                        <option value="General Inquiry">
                          General Inquiries
                        </option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="flex flex-col">
                  <label
                    htmlFor="message"
                    className="text-xs font-semibold text-gray-700 mb-2"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Provide details about your query..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-[#FAF9F6]/40 resize-y"
                  />
                </div>

                {/* Error Banner */}
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 bg-[#111111] hover:bg-[#222222] active:bg-black text-white text-xs tracking-[0.2em] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Success state message */}
            <AnimatePresence>
              {formSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center"
                >
                  <h4 className="font-semibold text-green-900 text-sm mb-1">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-xs text-green-700">
                    Our support team will reach out to you within 12-24 business
                    hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Decorative Styling Visual Image Column */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:flex-1 shadow-lg group">
              <img
                src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80"
                alt="Premium Men's Clothing Brand Editorial"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-2 block">
                  BRAND ETHOS
                </span>
                <h3 className="text-2xl font-serif font-bold mb-3 tracking-wide">
                  Wear Your Confidence
                </h3>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  Every product is crafted with premium fabrics and
                  architectural precision. Our concierge is dedicated to
                  ensuring your shopping experience is as perfect as our
                  clothing.
                </p>
              </div>
            </div>

            {/* Guarantee Cards */}
            <div className="bg-[#111111] text-white p-6 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg shrink-0 mt-0.5">
                <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1 text-white">
                  24-Hour Reply Pledge
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We guarantee a detailed, personalized solution to all customer
                  emails and forms within one business day.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. FAQ Preview Section */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <span className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase font-bold mb-2 block">
              COMMON INQUIRIES
            </span>
            <h2 className="text-3xl font-serif font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="w-12 h-1 bg-[#D4AF37] mx-auto mt-4" />
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeIn}
                  className="border border-gray-100 rounded-xl overflow-hidden bg-[#FAF9F6]/30 hover:border-gray-200 transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-800 text-sm md:text-base hover:text-black transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-black" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-500 leading-relaxed border-t border-gray-50/50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="text-center mt-10"
          >
            <Link
              href="/faqs"
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase border-b border-black pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all"
            >
              <span>View All FAQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 6. Social Media Section */}
      <section className="bg-[#111111] border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
          >
            <span className="text-xs tracking-[0.25em] text-gray-400 uppercase font-semibold mb-3 block">
              STAY CONNECTED
            </span>
            <h2 className="text-1xl md:text-3xl font-serif font-bold text-white mb-8">
              Follow Our Style Journey
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            <motion.a
              variants={fadeIn}
              href="https://www.instagram.com/gully_boy_ram?igsh=eWlsemp0Mjl4d2Nm"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm hover:text-[#D4AF37] transition-all duration-300 flex items-center gap-3 font-semibold text-xs uppercase tracking-wider text-gray-700"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Instagram</span>
            </motion.a>
            <motion.a
              variants={fadeIn}
              
               href="https://www.youtube.com/@gullyboyram"

              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm hover:text-[#D4AF37] transition-all duration-300 flex items-center gap-3 font-semibold text-xs uppercase tracking-wider text-gray-700"
            >
              <YoutubeIcon className="w-4 h-4" />
              <span>Youtube</span>
            </motion.a>
            <motion.a
              variants={fadeIn}
             href="https://wa.me/919553422743"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm hover:text-[#D4AF37] transition-all duration-300 flex items-center gap-3 font-semibold text-xs uppercase tracking-wider text-gray-700"
            >
              <WhatsappIcon className="w-4 h-4" />
              <span>Whatsapp</span>
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
