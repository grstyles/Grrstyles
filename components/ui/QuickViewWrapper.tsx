// components/ui/QuickViewWrapper.tsx

"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { closeQuickView } from "@/lib/redux/slices/uiSlice";
import QuickViewModal from "@/components/ui/QuickViewModal"; // Keep default import

export default function QuickViewWrapper() {
  const dispatch = useDispatch();
  const product = useSelector((state: RootState) => state.ui.quickViewProduct);

  if (!product) return null;

  return <QuickViewModal product={product} onClose={() => dispatch(closeQuickView())} />;
}