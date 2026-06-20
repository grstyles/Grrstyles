'use client';

import React, { useState, useEffect } from 'react';
import { repo, InventoryEntry } from '@/lib/repositories';
import { Package, Edit2, Save, X, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function AdminInventoryPage() {
  const dispatch = useDispatch();
  const [inventoryList, setInventoryList] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<{ [size: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const LOW_STOCK_THRESHOLD = 3;

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await repo.products.getInventory();
      setInventoryList(data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleStartEdit = (item: InventoryEntry) => {
    setEditingId(item.id);
    const stockMap: { [size: string]: number } = {};
    item.sizeStock.forEach((ss) => {
      stockMap[ss.size] = ss.stock;
    });
    setEditingStock(stockMap);
  };

  const handleStockValueChange = (size: string, value: number) => {
    setEditingStock((prev) => ({
      ...prev,
      [size]: Math.max(0, value),
    }));
  };

  const handleSaveStock = async (itemId: string) => {
    try {
      const promises = Object.entries(editingStock).map(([size, stock]) =>
        repo.products.updateStock(itemId, size, stock)
      );
      await Promise.all(promises);

      setInventoryList((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              sizeStock: item.sizeStock.map((ss) => ({
                size: ss.size,
                stock: editingStock[ss.size] !== undefined ? editingStock[ss.size] : ss.stock,
              })),
            };
          }
          return item;
        })
      );

      setEditingId(null);
      dispatch(addToast({ message: '✓ Stock levels updated!', type: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Failed to update stock.', type: 'error' }));
    }
  };

  const filteredList = inventoryList.filter((item) => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const aggregateStock = item.sizeStock.reduce((acc, ss) => acc + ss.stock, 0);
    const isLow = aggregateStock > 0 && aggregateStock <= (LOW_STOCK_THRESHOLD * item.sizeStock.length);

    return matchesSearch && (filterLowStock ? isLow : true);
  });

  const lowStockCount = inventoryList.filter((item) => {
    const total = item.sizeStock.reduce((acc, ss) => acc + ss.stock, 0);
    return total > 0 && total <= LOW_STOCK_THRESHOLD * item.sizeStock.length;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            {inventoryList.length} products · {lowStockCount > 0 && (
              <span className="text-red-500 font-semibold">{lowStockCount} low stock</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product..."
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black placeholder-gray-300"
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
              filterLowStock ? 'bg-red-50 text-red-500 border-red-200' : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            <AlertTriangle size={12} />
            Low Stock
          </button>
          <button
            onClick={loadInventory}
            className="p-2.5 border border-gray-200 hover:border-black rounded-xl text-gray-500 hover:text-black transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Levels</h3>
        </div>

        {filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Size Allocations</th>
                  <th className="p-4">Total Stock</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredList.map((item) => {
                  const isEditing = editingId === item.id;
                  const aggregateStock = item.sizeStock.reduce((acc, ss) => acc + ss.stock, 0);
                  const hasLowSize = item.sizeStock.some((ss) => ss.stock > 0 && ss.stock <= LOW_STOCK_THRESHOLD);
                  const isOutOfStock = aggregateStock === 0;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/30 transition-colors ${hasLowSize ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-bold text-gray-800 uppercase">{item.name}</p>
                          <p className="text-[10px] font-mono text-gray-400">{item.id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 uppercase font-semibold">{item.category}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.sizeStock.map((ss) => {
                            const isLow = ss.stock > 0 && ss.stock <= LOW_STOCK_THRESHOLD;
                            const isEmpty = ss.stock === 0;
                            return (
                              <div
                                key={ss.size}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold ${
                                  isEmpty
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : isLow
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-white text-gray-700 border-gray-200'
                                }`}
                              >
                                <span>{ss.size}:</span>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editingStock[ss.size] !== undefined ? editingStock[ss.size] : ss.stock}
                                    onChange={(e) => handleStockValueChange(ss.size, parseInt(e.target.value) || 0)}
                                    className="w-9 text-center font-bold border-b border-gray-300 focus:border-black focus:outline-none bg-transparent"
                                  />
                                ) : (
                                  <strong>{ss.stock}</strong>
                                )}
                                {isEmpty && <span className="text-red-400 ml-0.5">✕</span>}
                                {isLow && !isEmpty && <AlertTriangle size={8} className="text-amber-500 ml-0.5" />}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className={`font-bold text-sm ${isOutOfStock ? 'text-red-500' : hasLowSize ? 'text-amber-500' : 'text-gray-900'}`}>
                            {aggregateStock} Units
                          </span>
                          {isOutOfStock && <p className="text-[10px] text-red-400 font-semibold mt-0.5">OUT OF STOCK</p>}
                          {hasLowSize && !isOutOfStock && <p className="text-[10px] text-amber-500 font-semibold mt-0.5">LOW STOCK</p>}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveStock(item.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                              title="Save Changes"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                            title="Edit Stock"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Package size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No inventory entries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
