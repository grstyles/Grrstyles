'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { repo, MockOrder } from '@/lib/repositories';
import { formatPrice } from '@/lib/utils/helpers';
import { ArrowLeft, CreditCard, User, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;

  const [payment, setPayment] = useState<MockOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayment() {
      setLoading(true);
      try {
        const data = await repo.orders.getById(paymentId);
        setPayment(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (paymentId) loadPayment();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Payment record not found.</p>
        <button onClick={() => router.push('/admin/payments')} className="text-blue-600 hover:underline">
          Back to Payments
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href="/admin/payments" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black mb-6">
        <ArrowLeft size={16} /> Back to Payments
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Payment Details
            <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider border ${
              payment.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
              payment.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
              payment.paymentStatus === 'Refunded' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}>
              {payment.paymentStatus}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">{payment.razorpay_payment_id || payment.id}</p>
        </div>
        <Link 
          href={`/admin/orders/${payment.id}`}
          className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors"
        >
          View Related Order
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Info */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <CreditCard size={16} /> Transaction Info
          </h2>
          
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-gray-500">Amount</div>
            <div className="font-bold text-gray-900">{formatPrice(payment.totalAmount)}</div>
            
            <div className="text-gray-500">Gateway</div>
            <div className="font-mono text-gray-900">{payment.gateway || 'Razorpay'}</div>

            <div className="text-gray-500">Method</div>
            <div className="font-medium text-gray-900">{payment.paymentMethod || 'Prepaid'}</div>
            
            <div className="text-gray-500">Payment ID</div>
            <div className="font-mono text-gray-900">{payment.razorpay_payment_id || 'N/A'}</div>
            
            <div className="text-gray-500">Order ID (Razorpay)</div>
            <div className="font-mono text-gray-900">{payment.razorpay_order_id || 'N/A'}</div>
            
            <div className="text-gray-500">Transaction Time</div>
            <div className="font-mono text-gray-900">
              {payment.transaction_time ? new Date(payment.transaction_time).toLocaleString() : 'N/A'}
            </div>
            
            <div className="text-gray-500">Signature Verified</div>
            <div className="font-medium text-gray-900">
              {payment.payment_verified ? 'Yes' : (payment.payment_signature ? 'Assumed Yes' : 'No')}
            </div>
          </div>
        </div>

        {/* Customer & Reference */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <User size={16} /> Customer Details
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-bold text-gray-900 text-base">{payment.customerName}</p>
              <p className="text-gray-600">{payment.email}</p>
              {payment.phone && <p className="text-gray-600">{payment.phone}</p>}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <FileText size={16} /> Reference Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Website Order Ref:</span>
                <span className="font-mono font-medium">{payment.orderNumber || payment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date Created:</span>
                <span className="font-mono">{new Date(payment.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
