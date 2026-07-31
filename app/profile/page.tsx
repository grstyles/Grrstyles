"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  repo,
  MockOrder,
  UserAddress,
  UserScratchCard,
} from "@/lib/repositories";
import { formatPrice } from "@/lib/utils/helpers";
import {
  User,
  Mail,
  MapPin,
  ClipboardList,
  LogOut,
  ArrowRight,
  Clock,
  Plus,
  Trash2,
  Edit,
  X,
  ShoppingBag,
  Heart,
  Star,
  Award,
  Truck,
  RefreshCw,
  Headphones,
  Settings,
  Shield,
  Bell,
  Camera,
  Calendar,
  Package,
  Gift,
  CreditCard,
  Globe,
  Moon,
  FileText,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Lock,
  Ticket,
  Sparkles,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { addToast } from "@/lib/redux/slices/uiSlice";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ScratchCardModal from "@/components/ui/ScratchCardModal";

import { getClient } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, requireAuth, logout } = useAuth();

  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Supabase addresses state

  const [scratchCards, setScratchCards] = useState<UserScratchCard[]>([]);
  const [loadingScratchCards, setLoadingScratchCards] = useState(true);
  const [activeModalCard, setActiveModalCard] =
    useState<UserScratchCard | null>(null);

  const loadScratchCards = async () => {
    if (!user) return;
    setLoadingScratchCards(true);
    try {
      const list = await repo.scratchCards.getUserCards(user.id, user.email);
      setScratchCards(list);
    } catch (err) {
      console.error("Failed to load scratch cards:", err);
    } finally {
      setLoadingScratchCards(false);
    }
  };

  useEffect(() => {
    requireAuth(
      () => {
        setAuthChecked(true);
      },
      () => {
        router.push("/login");
      },
    );
  }, [requireAuth, router]);

  useEffect(() => {
    if (user) {
      setAuthChecked(true);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked || !user) return;

    async function loadOrders() {
      if (!user) {
        setLoadingOrders(false);
        return;
      }
      try {
        const userOrders = await repo.orders.getAll();
        setOrders(userOrders);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
    loadScratchCards();

    // Supabase Realtime subscription for instant order status sync
    const sb = getClient();
    if (!sb) return;

    const channel = sb
      .channel(`profile-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [authChecked, user]);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      dispatch(addToast({ message: "Logged out successfully.", type: "info" }));
      router.push("/");
    }
  };

  // Helper function to get member since date safely
  const getMemberSince = (): string => {
    if (!user) return "Recently";

    // Try different possible date fields
    const date = (user as any)?.created_at || (user as any)?.createdAt;
    if (!date) return "Recently";

    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "Recently";
    }
  };

  const memberSince = getMemberSince();

  // Helper function to render icons safely
  const renderIcon = (IconComponent: any, className: string) => {
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  if (!authChecked || !user) {
    return (
      <>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#fcfbfa]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading your profile...</p>
          </div>
        </div>
        <BottomNavigation />
      </>
    );
  }

  const quickStats = [
    { icon: Package, label: "Orders", value: orders.length },
    { icon: Heart, label: "Wishlist", value: 0 },
  ];

  const menuSections = [
    {
      title: "Order Management",
      icon: ClipboardList,
      items: [
        {
          icon: Package,
          label: "Order History",
          href: "/orders",
          description: "Track all your orders",
          badge: orders.length.toString(),
        },
        {
          icon: Truck,
          label: "Track Orders",
          href: "/orders",
          description: "Real-time delivery updates",
        },
        {
          icon: RefreshCw,
          label: "Returns & Exchanges",
          href: "/returns",
          description: "Manage returns and refunds",
        },
      ],
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] pb-24">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 px-6 pt-12 pb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-20 -mb-20"></div>

          <div className="max-w-5xl mx-auto relative z-10">
            {/* Profile Header */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-2 border-white/20 shadow-xl ring-4 ring-black/20 overflow-hidden">
                  <img
                    src={
                      user?.avatar ||
                      `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || "user"}`
                    }
                    alt={user?.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">
                    {user?.fullName || "User"}
                  </h1>
                  {user?.role === "admin" && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-semibold rounded-full border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/60 text-sm">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/40 text-xs">
                    Member since {memberSince}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              {quickStats.map((stat, idx) => (
                <div key={idx} className="text-center group cursor-pointer">
                  <div className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors mx-auto mb-1.5">
                    {renderIcon(
                      stat.icon,
                      "w-4 h-4 text-white/70 group-hover:text-white transition-colors",
                    )}
                  </div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/40 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Profile Summary Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-black/5 bg-gray-50">
                    <img
                      src={
                        user?.avatar ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || "user"}`
                      }
                      alt={user?.fullName || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {user?.fullName || "User"}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full inline-block mt-1">
                      {user?.role || "Customer"}
                    </span>
                  </div>
                  <div className="w-full border-t border-gray-100 pt-3 text-left space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      <span>ID: {user?.id?.slice(-8) || "N/A"}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 mt-2 py-3 border border-red-100 hover:border-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider text-red-500 rounded-xl transition-all"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-3">
                  Quick Navigation
                </h4>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/orders"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ClipboardList size={14} />
                      Order History
                    </span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={14} />
                      Shopping Cart
                    </span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Heart size={14} />
                      Wishlist
                    </span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList size={15} className="text-gray-400" />
                    Recent Orders
                  </h3>
                  <Link
                    href="/orders"
                    className="text-[10px] font-bold text-black hover:underline uppercase tracking-wider flex items-center gap-0.5"
                  >
                    View All ({orders.length}) <ArrowRight size={10} />
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {orders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-xl gap-3 hover:border-gray-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900">
                            {order.orderNumber}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                            <span>{order.date}</span>
                            <span>•</span>
                            <span>
                              {order.itemsCount} Item
                              {order.itemsCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                          <span className="text-xs font-bold text-gray-950">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              order.status === "Delivered"
                                ? "bg-green-50 text-green-600"
                                : order.status === "Cancelled"
                                  ? "bg-red-50 text-red-500"
                                  : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <Clock size={20} className="mx-auto text-gray-300" />
                    <p className="text-xs text-gray-400">
                      You haven't placed any orders yet.
                    </p>
                    <Link
                      href="/search"
                      className="inline-block text-[10px] font-bold text-black hover:underline uppercase tracking-wider"
                    >
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>

              {/* My Scratch Cards */}
              <div
                id="scratch-cards"
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <Ticket size={16} className="text-amber-500" />
                    My Scratch Cards ({scratchCards.length})
                  </h3>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Scratch & Win
                  </span>
                </div>

                {loadingScratchCards ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : scratchCards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {scratchCards.map((sc) => (
                      <div
                        key={sc.id}
                        onClick={() => setActiveModalCard(sc)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                          sc.is_claimed
                            ? "bg-gray-50 border-gray-200 opacity-90"
                            : sc.is_scratched
                              ? "bg-amber-50/60 border-amber-200"
                              : "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              sc.is_claimed
                                ? "bg-emerald-100 text-emerald-700"
                                : sc.is_scratched
                                  ? "bg-amber-200 text-amber-800"
                                  : "bg-black/30 text-white backdrop-blur"
                            }`}
                          >
                            {sc.is_claimed
                              ? "Claimed"
                              : sc.is_scratched
                                ? "Scratched"
                                : "Tap to Scratch ✨"}
                          </span>
                          {!sc.is_claimed && !sc.is_scratched && (
                            <Sparkles
                              size={16}
                              className="text-amber-200 animate-pulse"
                            />
                          )}
                        </div>

                        <div>
                          <h4
                            className={`font-bold text-sm leading-tight ${sc.is_claimed ? "text-gray-900" : sc.is_scratched ? "text-amber-900" : "text-white"}`}
                          >
                            {sc.card_title || "Scratch & Win Discount"}
                          </h4>
                          <p
                            className={`text-xs mt-1 ${sc.is_claimed ? "text-gray-500" : sc.is_scratched ? "text-amber-700" : "text-white/80"}`}
                          >
                            {sc.is_claimed
                              ? `Code: ${sc.coupon_code}`
                              : "Unveil your instant shopping reward"}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-xs font-semibold">
                          <span
                            className={
                              sc.is_claimed
                                ? "text-emerald-600 font-mono"
                                : sc.is_scratched
                                  ? "text-amber-800"
                                  : "text-amber-200"
                            }
                          >
                            {sc.reward_type === "percentage_discount"
                              ? `${sc.reward_value}% OFF`
                              : `₹${sc.reward_value} OFF`}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold flex items-center gap-1 ${sc.is_claimed ? "text-gray-400" : sc.is_scratched ? "text-amber-700" : "text-white"}`}
                          >
                            {sc.is_claimed ? "Claimed" : "Scratch Now"}{" "}
                            <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <Ticket size={24} className="mx-auto text-gray-300" />
                    <p className="text-xs text-gray-400">
                      No scratch cards assigned yet.
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Place an order above minimum cart value to earn scratch
                      cards!
                    </p>
                  </div>
                )}
              </div>

              {/* Saved Addresses */}

              {/* Menu Sections */}
              {menuSections.map((section, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                    {renderIcon(section.icon, "w-4 h-4 text-gray-400")}
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="flex-1"></div>
                  </div>

                  <div className="divide-y divide-gray-50 mt-2">
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className="flex items-center gap-3 px-2 py-3 hover:bg-gray-50/80 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0">
                          <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                            {renderIcon(
                              item.icon,
                              "w-4 h-4 text-gray-600 group-hover:text-black transition-colors",
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-2 py-0.5 bg-black/5 text-black/60 text-[10px] font-semibold rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}

      {/* Interactive Scratch Card Modal */}
      {activeModalCard && (
        <ScratchCardModal
          card={activeModalCard}
          isOpen={Boolean(activeModalCard)}
          onClose={() => setActiveModalCard(null)}
          onRewardClaimed={(updated) => {
            setScratchCards((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c)),
            );
          }}
        />
      )}

      <BottomNavigation />
    </>
  );
}
