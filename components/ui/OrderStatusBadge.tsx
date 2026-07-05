import React from 'react';
import { Clock, CheckCircle2, Package, Truck, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const getBadgeStyles = () => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Packed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Shipped':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Returned':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'Pending': return <Clock size={16} />;
      case 'Confirmed': return <CheckCircle2 size={16} />;
      case 'Packed': return <Package size={16} />;
      case 'Shipped': return <Truck size={16} />;
      case 'Delivered': return <CheckCircle size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      case 'Returned': return <RotateCcw size={16} />;
      default: return null;
    }
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all duration-300 hover:shadow-md ${getBadgeStyles()} ${className}`}
    >
      {getIcon()}
      {status}
    </span>
  );
}
