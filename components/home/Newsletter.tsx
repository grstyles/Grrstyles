'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="bg-black text-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Mail size={32} />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-3">STAY IN STYLE</h2>
          <p className="text-gray-400 mb-8">
            Get the latest fashion drops, exclusive offers and style tips straight to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-6 py-3 rounded-l-full md:rounded-none text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-black px-8 py-3 rounded-r-full md:rounded-full font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              SUBSCRIBE
            </button>
          </form>

          {submitted && <p className="text-green-400 mt-4">Thanks for subscribing!</p>}
        </div>
      </div>
    </section>
  );
}
