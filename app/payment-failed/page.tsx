import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <XCircle size={64} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-8">
          We couldn't process your payment. Your order has not been placed and no money was deducted.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/checkout"
            className="block w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
          >
            Retry Payment
          </Link>
          <Link
            href="/cart"
            className="block w-full py-4 bg-gray-100 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
