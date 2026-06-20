'use client';

import { Truck, RotateCcw, Award, Shield, Gift } from 'lucide-react';

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: <Truck size={32} />,
    title: 'FREE SHIPPING',
    description: 'On orders over ₹999',
  },
  {
    icon: <RotateCcw size={32} />,
    title: 'EASY RETURNS',
    description: '15 days return policy',
  },
  {
    icon: <Award size={32} />,
    title: 'PREMIUM QUALITY',
    description: 'Best quality products',
  },
  {
    icon: <Shield size={32} />,
    title: 'SECURE PAYMENT',
    description: '100% secure checkout',
  },
  {
    icon: <Gift size={32} />,
    title: 'EXCLUSIVE OFFERS',
    description: 'On all prepaid orders',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-12 md:py-16 bg-white border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-6">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="text-gray-900 mb-3">{benefit.icon}</div>
              <h3 className="text-xs md:text-sm font-semibold tracking-widest uppercase mb-1 text-gray-900">
                {benefit.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
