"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  X, 
  SlidersHorizontal, 
  RotateCcw, 
  Check,
  Search,
  Star,
  Tag,
  Package,
  Clock,
  Sparkles,
  Filter,
  ArrowUpDown,
  IndianRupee
} from "lucide-react";
import { useDispatch } from "react-redux";
import { closeFilterSidebar } from "@/lib/redux/slices/uiSlice";

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
  isOpen: boolean;
  totalProducts?: number;
  onApply?: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

export interface FilterState {
  categories: string[];
  subCategories: string[];
  sizes: string[];
  colors: string[];
  brands: string[];
  priceRange: [number, number];
  discount: number;
  rating: number;
  availability: string[];
  occasion: string[];
  fabric: string[];
  pattern: string[];
  sleeveLength: string[];
  neckStyle: string[];
  inStock: boolean;
  onSale: boolean;
  newArrivals: boolean;
  featured: boolean;
  searchTerm?: string;
  sortOption?: string;
}

// Extended Data
const categories = [
  { id: "all", label: "All", icon: "✨" },
  { id: "shirts", label: "Shirts", icon: "👔" },
  { id: "tshirts", label: "T-Shirts", icon: "👕" },
  { id: "jeans", label: "Denim Jeans", icon: "👖" },
  { id: "trousers", label: "Trousers & Pants", icon: "👖" },
  { id: "jackets", label: "Jackets & Blazers", icon: "🧥" },
  { id: "hoodies", label: "Hoodies & Sweats", icon: "🧥" },
  { id: "shoes", label: "Shoes & Sneakers", icon: "👟" },
  { id: "accessories", label: "Accessories", icon: "💼" },
];

const subCategories = {
  "shirts": ["Casual Shirts", "Formal Shirts", "Linen Shirts", "Printed Shirts", "Korean Shirts"],
  "tshirts": ["Crew Neck", "Polo Tees", "Oversized Tees", "Graphic Tees"],
  "jeans": ["Baggy Jeans", "Slim Fit", "Straight Fit", "Classic Jeans"],
  "trousers": ["Chinos", "Formal Trousers", "Korean Trousers", "Cargo Pants"],
  "jackets": ["Denim Jackets", "Bomber Jackets", "Puffer Jackets", "Blazers", "Utility Jackets"],
  "hoodies": ["Pullover Hoodies", "Zip-Up Hoodies", "Crewneck Sweatshirts", "Oversized Sweatshirts"],
  "shoes": ["Sneakers", "Loafers", "Chelsea Boots", "Formal Shoes", "Canvas Shoes"],
  "accessories": ["Leather Wallets", "Watches", "Leather Belts", "Sunglasses", "Ribbed Beanies", "Duffle Bags"],
};

const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const colors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy Blue", hex: "#1A2A3A" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Beige", hex: "#F5E6D3" },
  { name: "Red", hex: "#DC2626" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Green", hex: "#16A34A" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Gold", hex: "#D4AF37" },
];

const brands = [
  { id: "grstyles", label: "GR STYLES" },
  { id: "hm", label: "H&M" },
  { id: "zara", label: "ZARA" },
  { id: "levis", label: "Levi's" },
  { id: "nike", label: "Nike" },
  { id: "adidas", label: "Adidas" },
  { id: "puma", label: "Puma" },
  { id: "forever21", label: "Forever 21" },
];

const occasions = [
  "Casual", "Formal", "Party", "Wedding", "Festival", 
  "Office", "Date Night", "Vacation", "Athleisure"
];

const fabrics = [
  "Cotton", "Linen", "Denim", "Leather", "Wool", "Polyester", "Silk"
];

const patterns = [
  "Solid", "Striped", "Checked", "Printed", "Floral", 
  "Geometric", "Abstract", "Paisley", "Plaid", "Polka Dot"
];

const sleeveLengths = ["Sleeveless", "Short Sleeve", "3/4 Sleeve", "Full Sleeve", "Cuffed"];
const neckStyles = ["Round Neck", "V-Neck", "Spread Collar", "Mandarin Collar", "Turtleneck", "Polo Collar"];
const availability = ["In Stock", "Low Stock", "Coming Soon", "Pre-Order"];

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 100;

export default function FilterSidebar({
  onFilterChange,
  isOpen,
  totalProducts = 49,
  onApply,
  initialFilters = {},
}: FilterSidebarProps) {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    subCategories: [],
    sizes: [],
    colors: [],
    brands: [],
    priceRange: [PRICE_MIN, PRICE_MAX],
    discount: 0,
    rating: 0,
    availability: [],
    occasion: [],
    fabric: [],
    pattern: [],
    sleeveLength: [],
    neckStyle: [],
    inStock: false,
    onSale: false,
    newArrivals: false,
    featured: false,
    searchTerm: "",
    sortOption: "newest",
    ...initialFilters,
  });

  const [expandedSections, setExpandedSections] = useState<string[]>([
    "categories",
    "price",
    "size",
  ]);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([
    filters.priceRange[0],
    filters.priceRange[1],
  ]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (Array.isArray(value)) return count + value.length;
    if (typeof value === "boolean") return count + (value ? 1 : 0);
    if (typeof value === "number" && key !== "priceRange" && value > 0) return count + 1;
    return count;
  }, 0);

  // Close handlers
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) dispatch(closeFilterSidebar());
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        window.innerWidth < 768
      ) {
        dispatch(closeFilterSidebar());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, dispatch]);

  // Notify parent of filter updates in a clean, React-approved lifecycle event
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleCheckboxChange = (
    type: keyof Omit<FilterState, "priceRange" | "discount" | "rating">,
    value: string
  ) => {
    setFilters((prev) => {
      const current = prev[type] as string[];
      const newFilters = {
        ...prev,
        [type]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
      return newFilters;
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const value = parseInt(e.target.value);
    setTempPriceRange((prev) => {
      const newRange: [number, number] = [...prev];
      newRange[index] = value;
      if (index === 0 && value > prev[1]) newRange[1] = value;
      if (index === 1 && value < prev[0]) newRange[0] = value;
      return newRange;
    });
  };

  const applyPriceRange = () => {
    setFilters((prev) => {
      const newFilters = { ...prev, priceRange: tempPriceRange };
      return newFilters;
    });
  };

  const handleToggleFilter = (type: "inStock" | "onSale" | "newArrivals" | "featured") => {
    setFilters((prev) => {
      const newFilters = { ...prev, [type]: !prev[type] };
      return newFilters;
    });
  };

  const handleRatingChange = (rating: number) => {
    setFilters((prev) => {
      const newFilters = { ...prev, rating };
      return newFilters;
    });
  };

  const handleDiscountChange = (discount: number) => {
    setFilters((prev) => {
      const newFilters = { ...prev, discount };
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    const resetFilters: FilterState = {
      categories: [],
      subCategories: [],
      sizes: [],
      colors: [],
      brands: [],
      priceRange: [PRICE_MIN, PRICE_MAX],
      discount: 0,
      rating: 0,
      availability: [],
      occasion: [],
      fabric: [],
      pattern: [],
      sleeveLength: [],
      neckStyle: [],
      inStock: false,
      onSale: false,
      newArrivals: false,
      featured: false,
    };
    setFilters(resetFilters);
    setTempPriceRange([PRICE_MIN, PRICE_MAX]);
  };

  const handleApply = () => {
    if (onApply) onApply(filters);
    if (window.innerWidth < 768) dispatch(closeFilterSidebar());
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-40"
          onClick={() => dispatch(closeFilterSidebar())}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed md:relative md:w-80 w-full max-w-sm h-full md:h-auto overflow-y-auto bg-white shadow-2xl md:shadow-none md:border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } z-50`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-700" />
              <h3 className="font-bold text-lg">Refine</h3>
              <span className="text-sm text-gray-500 ml-1">{totalProducts} pieces</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-black text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  Clear All
                </button>
              )}
              <button
                onClick={() => dispatch(closeFilterSidebar())}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors md:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sort Option */}
          <div className="mt-3 flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-600">Sort</span>
            <select
              value={filters.sortOption || "newest"}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOption: e.target.value }))}
              className="text-xs bg-transparent border-none focus:ring-0 font-medium text-gray-800 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price-low">Price (Low → High)</option>
              <option value="price-high">Price (High → Low)</option>
              <option value="rating">Rating</option>
              <option value="discount">Discount</option>
            </select>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <button
              onClick={() => handleToggleFilter("newArrivals")}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                filters.newArrivals
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              <Sparkles size={12} className="inline mr-1" />
              New Arrivals
            </button>
            <button
              onClick={() => handleToggleFilter("onSale")}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                filters.onSale
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              <Tag size={12} className="inline mr-1" />
              On Sale
            </button>
            <button
              onClick={() => handleToggleFilter("featured")}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                filters.featured
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              ⭐ Featured
            </button>
            <button
              onClick={() => handleToggleFilter("inStock")}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                filters.inStock
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              <Package size={12} className="inline mr-1" />
              In Stock
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Search Categories */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, style, or category..."
              value={filters.searchTerm || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          {/* Categories */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("categories")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Categories</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("categories") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("categories") && (
              <div className="mt-2 space-y-0.5">
                {categories
                  .filter((cat) =>
                    cat.label.toLowerCase().includes((filters.searchTerm || "").toLowerCase())
                  )
                  .map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat.id)}
                        onChange={() => handleCheckboxChange("categories", cat.id)}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">
                        {cat.icon} {cat.label}
                      </span>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("price")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Price (₹)</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("price") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("price") && (
              <div className="mt-3 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Lower</label>
                    <div className="flex items-center gap-1">
                      <IndianRupee size={12} className="text-gray-400" />
                      <span className="font-medium">{tempPriceRange[0]}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Upper</label>
                    <div className="flex items-center gap-1">
                      <IndianRupee size={12} className="text-gray-400" />
                      <span className="font-medium">{tempPriceRange[1]}</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={PRICE_STEP}
                    value={tempPriceRange[0]}
                    onChange={(e) => handlePriceChange(e, 0)}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={PRICE_STEP}
                    value={tempPriceRange[1]}
                    onChange={(e) => handlePriceChange(e, 1)}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black mt-0.5"
                  />
                </div>
                <button
                  onClick={applyPriceRange}
                  className="w-full py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply Price
                </button>
              </div>
            )}
          </div>

          {/* Size */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("size")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Size</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("size") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("size") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleCheckboxChange("sizes", size)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.sizes.includes(size)
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("color")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Color</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("color") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("color") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleCheckboxChange("colors", color.name)}
                    className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                      filters.colors.includes(color.name)
                        ? "border-black shadow-lg scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{
                      backgroundColor: color.hex,
                      borderColor: ["White", "Beige"].includes(color.name) 
                        ? "#D1D5DB" 
                        : undefined,
                    }}
                    title={color.name}
                  >
                    {filters.colors.includes(color.name) && (
                      <Check
                        size={12}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                          ["White", "Beige", "Yellow"].includes(color.name)
                            ? "text-black"
                            : "text-white"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Brand */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("brand")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Brand</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("brand") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("brand") && (
              <div className="mt-2 space-y-0.5">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand.id)}
                      onChange={() => handleCheckboxChange("brands", brand.id)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {brand.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("discount")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Discount</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("discount") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("discount") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[10, 20, 30, 40, 50, 60, 70].map((discount) => (
                  <button
                    key={discount}
                    onClick={() => handleDiscountChange(discount)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.discount === discount
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {discount}%+
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("rating")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Rating</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("rating") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("rating") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      filters.rating === rating
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    <Star size={12} fill={filters.rating === rating ? "white" : "#F59E0B"} />
                    {rating}+
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Occasion */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("occasion")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Occasion</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("occasion") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("occasion") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {occasions.map((occasion) => (
                  <button
                    key={occasion}
                    onClick={() => handleCheckboxChange("occasion", occasion)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.occasion.includes(occasion)
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {occasion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fabric */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("fabric")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Fabric</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("fabric") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("fabric") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {fabrics.map((fabric) => (
                  <button
                    key={fabric}
                    onClick={() => handleCheckboxChange("fabric", fabric)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.fabric.includes(fabric)
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {fabric}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pattern */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("pattern")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Pattern</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("pattern") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("pattern") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patterns.map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => handleCheckboxChange("pattern", pattern)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.pattern.includes(pattern)
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sleeve Length */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("sleeve")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Sleeve Length</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("sleeve") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("sleeve") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sleeveLengths.map((sleeve) => (
                  <button
                    key={sleeve}
                    onClick={() => handleCheckboxChange("sleeveLength", sleeve)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.sleeveLength.includes(sleeve)
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {sleeve}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Neck Style */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("neck")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Neck Style</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("neck") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("neck") && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {neckStyles.map((neck) => (
                  <button
                    key={neck}
                    onClick={() => handleCheckboxChange("neckStyle", neck)}
                    className={`px-3 py-1 border-2 rounded-md text-xs font-medium transition-all ${
                      filters.neckStyle.includes(neck)
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50"
                    }`}
                  >
                    {neck}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection("availability")}
              className="flex items-center justify-between w-full font-semibold text-sm py-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
            >
              <span>Availability</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  expandedSections.includes("availability") ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.includes("availability") && (
              <div className="mt-2 space-y-0.5">
                {availability.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.availability.includes(status)}
                      onChange={() => handleCheckboxChange("availability", status)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Apply Button - Mobile */}
          <div className="md:hidden pt-2 sticky bottom-0 bg-white py-3 border-t border-gray-200">
            <button
              onClick={handleApply}
              className="w-full py-3.5 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}