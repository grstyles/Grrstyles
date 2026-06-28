'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { repo, MockOrder, MockOrderItem } from '@/lib/repositories';
import { formatPrice } from '@/lib/utils/helpers';
import { OrderStatusBadge, OrderStatus } from '@/components/ui/OrderStatusBadge';
import { ArrowLeft, Copy, Mail, Printer, Download, Package, Edit, ExternalLink, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

const STATUS_TIMELINE: OrderStatus[] = [
  'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'
];

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const dispatch = useDispatch();

  const [order, setOrder] = useState<MockOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  
  // Shipping tracking state
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    courier_partner: '',
    tracking_id: '',
    tracking_url: '',
    dispatch_date: '',
    expected_delivery_date: '',
    delivered_date: '',
  });

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      const data = await repo.orders.getById(orderId);
      if (data) {
        setOrder(data);
        setShippingForm({
          courier_partner: data.courier_partner || '',
          tracking_id: data.tracking_id || '',
          tracking_url: data.tracking_url || '',
          dispatch_date: data.dispatch_date ? new Date(data.dispatch_date).toISOString().split('T')[0] : '',
          expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date).toISOString().split('T')[0] : '',
          delivered_date: data.delivered_date ? new Date(data.delivered_date).toISOString().split('T')[0] : '',
        });
        
        // Fetch full product details for each item
        const details: Record<string, any> = {};
        for (const item of data.items || []) {
          if (!details[item.productId]) {
            try {
              const prod = await repo.products.getById(item.productId);
              details[item.productId] = prod || { _missing: true };
            } catch (err) {
              details[item.productId] = { _missing: true };
            }
          }
        }
        setProductDetails(details);
      }
      setLoading(false);
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      const success = await repo.orders.updateStatus(order.id, newStatus);
      if (success) {
        setOrder({ ...order, status: newStatus });
        dispatch(addToast({ message: `Order status updated to ${newStatus}`, type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to update status', type: 'error' }));
    }
  };

  const handleShippingUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      const updateData = {
        courier_partner: shippingForm.courier_partner || undefined,
        tracking_id: shippingForm.tracking_id || undefined,
        tracking_url: shippingForm.tracking_url || undefined,
        dispatch_date: shippingForm.dispatch_date ? new Date(shippingForm.dispatch_date).toISOString() : undefined,
        expected_delivery_date: shippingForm.expected_delivery_date ? new Date(shippingForm.expected_delivery_date).toISOString() : undefined,
        delivered_date: shippingForm.delivered_date ? new Date(shippingForm.delivered_date).toISOString() : undefined,
      };
      const success = await repo.orders.updateShipping(order.id, updateData);
      if (success) {
        setOrder({ ...order, ...updateData });
        setIsEditingShipping(false);
        dispatch(addToast({ message: 'Shipping info updated', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to update shipping info', type: 'error' }));
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order?.orderNumber || order?.id || '');
    dispatch(addToast({ message: 'Order ID copied to clipboard', type: 'success' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">Order not found</h2>
        <button onClick={() => router.push('/admin/orders')} className="mt-4 text-blue-600 underline">Back to Orders</button>
      </div>
    );
  }

  const currentStatusIndex = STATUS_TIMELINE.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'Cancelled' || order.status === 'Returned';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/orders')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber || order.id}</h1>
            <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} className="scale-110" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <button onClick={copyOrderId} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          <Copy size={16} /> Copy Order ID
        </button>
        <button onClick={() => window.location.href = `mailto:${order.email}`} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          <Mail size={16} /> Contact Customer
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" onClick={() => dispatch(addToast({ message: 'Printing invoice...', type: 'info' }))}>
          <Printer size={16} /> Print Invoice
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" onClick={() => dispatch(addToast({ message: 'Downloading invoice...', type: 'info' }))}>
          <Download size={16} /> Download Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Tracking Timeline</h3>
            <div className="relative flex justify-between items-center mb-8">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-10 rounded-full" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black -z-10 rounded-full transition-all duration-500" 
                style={{ width: isCancelled ? '0%' : `${Math.max(0, (currentStatusIndex / (STATUS_TIMELINE.length - 1)) * 100)}%` }}
              />
              
              {STATUS_TIMELINE.map((s, idx) => {
                const isActive = !isCancelled && idx <= currentStatusIndex;
                const isCurrent = !isCancelled && idx === currentStatusIndex;
                return (
                  <div key={s} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleStatusUpdate(s)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isActive ? 'bg-black text-white scale-110' : 'bg-white border-2 border-gray-300 text-gray-300 group-hover:border-gray-500'}`}>
                      {isActive ? <CheckCircle size={16} /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-black' : 'text-gray-400'}`}>{s}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleStatusUpdate('Cancelled')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors border ${order.status === 'Cancelled' ? 'bg-red-500 text-white border-red-500' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
              >
                Mark Cancelled
              </button>
              <button 
                onClick={() => handleStatusUpdate('Returned')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors border ${order.status === 'Returned' ? 'bg-orange-500 text-white border-orange-500' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}
              >
                Mark Returned
              </button>
            </div>
          </div>

          {/* Ordered Products */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Ordered Products ({order.itemsCount})</h3>
            <div className="space-y-4">
              {order.items?.map((item: MockOrderItem, idx) => {
                const prod = productDetails[item.productId];
                const isMissing = !prod || prod._missing;
                
                // Determine image: Order snapshot color image -> product imageColors -> product images
                let displayImage = item.image; 
                if (!displayImage && !isMissing && prod.imageColors) {
                  const match = prod.imageColors.find((c: any) => c.color_name === item.color);
                  if (match) displayImage = match.image_url;
                }
                if (!displayImage && !isMissing && prod.images?.length > 0) {
                  displayImage = prod.images[0];
                }

                return (
                  <div key={idx} className="flex flex-col gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                      <div className="shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                        {displayImage ? (
                          <img src={displayImage} alt={item.productName} className="w-20 h-20 sm:w-24 sm:h-24 object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-gray-400"><Package size={24} /></div>
                        )}
                      </div>
                      
                      <div className="flex-1 w-full">
                        <p className="font-bold text-gray-900 text-sm md:text-base">{item.productName}</p>
                        {isMissing && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1 mt-0.5">Product no longer exists</p>}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 mt-3 text-xs text-gray-800">
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Product ID</p>
                            <p className="font-mono mt-0.5 truncate max-w-[120px]" title={item.productId}>{item.productId}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">SKU</p>
                            <p className="font-mono mt-0.5">{item.sku || prod?.sku || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Selected Color</p>
                            <p className="font-semibold mt-0.5">{item.color || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Selected Size</p>
                            <p className="font-semibold mt-0.5">{item.size}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right shrink-0 min-w-[100px] mt-2 sm:mt-0 w-full sm:w-auto">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 hidden sm:block">Amount</p>
                        <p className="text-sm text-gray-500 font-semibold">{formatPrice(item.price)} <span className="text-xs text-gray-400 font-normal">× {item.quantity}</span></p>
                        <p className="font-bold text-lg text-gray-900 mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50 mt-1">
                      {!isMissing ? (
                        <Link 
                          href={`/admin/products?edit=${item.productId}`} 
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} /> View Product
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-2 rounded-lg cursor-not-allowed">
                          Product Deleted
                        </span>
                      )}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.productId);
                          dispatch(addToast({ message: 'Product ID copied', type: 'success' }));
                        }} 
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 hover:text-black bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Copy size={14} /> Copy ID
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Customer & Shipping */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Mail size={16} /> Customer Info</h3>
              <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
              <p className="text-gray-600">{order.email}</p>
              {order.phone && <p className="text-gray-600">{order.phone}</p>}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin size={16} /> Shipping Address</h3>
              {order.shippingAddress ? (
                <div className="text-gray-700 space-y-1">
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No shipping details provided.</p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><CreditCard size={16} /> Payment Info</h3>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">Method</span>
                <span className="font-bold">{order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'card' ? 'Credit / Debit Card' : order.paymentMethod === 'razorpay' ? 'Razorpay' : order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">Status</span>
                <span className={`font-bold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
              </div>
              {order.gateway === 'razorpay' && (
                <>
                  <div className="flex flex-col py-2 border-b border-gray-50 gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider">Gateway</span>
                    <span className="font-mono text-sm">Razorpay</span>
                  </div>
                  <div className="flex flex-col py-2 border-b border-gray-50 gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider">Payment ID</span>
                    <span className="font-mono text-xs">{order.razorpay_payment_id || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col py-2 border-b border-gray-50 gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider">Order ID</span>
                    <span className="font-mono text-xs">{order.razorpay_order_id || 'N/A'}</span>
                  </div>
                  {order.transaction_time && (
                    <div className="flex flex-col py-2 border-b border-gray-50 gap-1">
                      <span className="text-gray-600 text-xs uppercase tracking-wider">Trans. Time</span>
                      <span className="font-mono text-xs">{new Date(order.transaction_time).toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.totalAmount + (order.discountAmount || 0) - 150)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{formatPrice(150)}</span>
                </div>
                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-gray-900 pt-4 border-t border-gray-100 mt-2">
                  <span>Grand Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information (Tracking) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Package size={16} /> Tracking Info</h3>
              {!isEditingShipping && (
                <button onClick={() => setIsEditingShipping(true)} className="text-xs text-blue-600 font-bold uppercase flex items-center gap-1 hover:underline">
                  <Edit size={12} /> Edit
                </button>
              )}
            </div>

            {isEditingShipping ? (
              <form onSubmit={handleShippingUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Courier Partner</label>
                  <select 
                    value={shippingForm.courier_partner} 
                    onChange={e => setShippingForm({...shippingForm, courier_partner: e.target.value})}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="">Select Partner</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="DTDC">DTDC</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="ExpressBees">ExpressBees</option>
                    <option value="India Post">India Post</option>
                    <option value="Shiprocket">Shiprocket</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tracking ID</label>
                  <input type="text" value={shippingForm.tracking_id} onChange={e => setShippingForm({...shippingForm, tracking_id: e.target.value})} className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black" placeholder="e.g. DTDC123456789" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tracking URL</label>
                  <input type="url" value={shippingForm.tracking_url} onChange={e => setShippingForm({...shippingForm, tracking_url: e.target.value})} className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black" placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Dispatch Date</label>
                  <input type="date" value={shippingForm.dispatch_date} onChange={e => setShippingForm({...shippingForm, dispatch_date: e.target.value})} className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Expected Delivery</label>
                  <input type="date" value={shippingForm.expected_delivery_date} onChange={e => setShippingForm({...shippingForm, expected_delivery_date: e.target.value})} className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Delivered Date</label>
                  <input type="date" value={shippingForm.delivered_date} onChange={e => setShippingForm({...shippingForm, delivered_date: e.target.value})} className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditingShipping(false)} className="px-3 py-1.5 text-xs text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-xs text-white bg-black font-bold rounded-lg hover:bg-gray-800">Save</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col py-1 gap-1 border-b border-gray-50">
                  <span className="text-gray-500 text-xs font-bold uppercase">Courier</span>
                  <span className="font-medium text-sm">{order.courier_partner || 'Not assigned'}</span>
                </div>
                <div className="flex flex-col py-1 gap-1 border-b border-gray-50">
                  <span className="text-gray-500 text-xs font-bold uppercase">Tracking ID</span>
                  <span className="font-mono text-sm">{order.tracking_id || 'N/A'}</span>
                </div>
                {order.tracking_url && (
                  <div className="flex flex-col py-1 gap-1 border-b border-gray-50">
                    <span className="text-gray-500 text-xs font-bold uppercase">Tracking Link</span>
                    <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1">
                      Track Shipment <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[10px] font-bold uppercase">Dispatched</span>
                    <span className="font-mono text-xs">{order.dispatch_date ? new Date(order.dispatch_date).toLocaleDateString() : '--'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[10px] font-bold uppercase">Expected</span>
                    <span className="font-mono text-xs">{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '--'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
