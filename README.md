# 👔 GR STYLES

> **Enterprise-Grade AI Assisted Fashion eCommerce Platform**

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-TypeScript-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C6CF2)

------------------------------------------------------------------------

# 📖 Overview

GR STYLES is a modern premium fashion eCommerce platform built with a
scalable architecture. It combines a customer storefront with a powerful
administration portal capable of managing inventory, marketing
campaigns, homepage content, rewards, offers, analytics and order
management.

The application follows a Repository + Service architecture, uses
Supabase as the backend, Redux Toolkit for state management and Razorpay
for online payments.

------------------------------------------------------------------------

# ✨ Key Highlights

-   Premium responsive storefront
-   Enterprise Admin Dashboard
-   Dynamic Homepage Builder
-   Marketing Engine
-   Category Carousel CMS
-   Dynamic Inventory (Shirts/Pants/Shoes/Combos)
-   Google Authentication
-   Razorpay Integration
-   SEO Ready
-   Repository Pattern
-   Service Layer
-   TypeScript
-   Scalable Folder Structure

------------------------------------------------------------------------

# 🏛 System Architecture

``` text
                    Internet
                        │
         ┌──────────────┴──────────────┐
         │                             │
   Customer Portal              Admin Dashboard
         │                             │
         └──────────────┬──────────────┘
                        │
                Next.js App Router
                        │
      ┌─────────────────┼──────────────────┐
      │                 │                  │
 React Components   Redux Toolkit     API Routes
      │                 │                  │
      └─────────────────┼──────────────────┘
                        │
                  Service Layer
                        │
                Repository Layer
                        │
                  Supabase Client
                        │
      ┌────────────┬─────────────┬─────────────┐
      │            │             │
 PostgreSQL      Auth         Storage
      │            │             │
      └────────────┴─────────────┘
                        │
                  Razorpay Gateway
```

------------------------------------------------------------------------

# 📂 Folder Architecture

``` text
app/
 ├── admin/
 ├── api/
 ├── auth/
 ├── cart/
 ├── checkout/
 ├── collections/
 ├── men/
 ├── product/
 ├── profile/
 ├── wishlist/
 └── layout.tsx

components/
 ├── admin/
 ├── home/
 ├── marketing/
 ├── navbar/
 ├── ui/

contexts/
hooks/

lib/
 ├── data/
 ├── redux/
 ├── repositories/
 ├── utils/

services/
scripts/
public/
```

------------------------------------------------------------------------

# 🧩 Architecture Principles

## Repository Pattern

UI → Services → Repository → Supabase → PostgreSQL

Benefits: - Centralized data access - Easy maintenance - Scalable
codebase - Separation of concerns

## Service Layer

Business logic is isolated from UI: - Product Service - Order Service -
Marketing Service - Authentication Service

## State Management

Redux Toolkit manages: - Cart - Wishlist - User - UI State

------------------------------------------------------------------------

# 🛍 Customer Features

-   Premium Homepage
-   Hero Slider
-   Dynamic Category Carousel
-   Collections
-   Search
-   Product Details
-   Multiple Images
-   Color Selection
-   Dynamic Size Selection
-   Wishlist
-   Cart
-   Checkout
-   Coupons
-   Rewards
-   Scratch Cards
-   Order Tracking
-   Profile Management

------------------------------------------------------------------------

# 🛠 Admin Features

-   Dashboard
-   Products CRUD
-   Categories
-   Collections
-   Dynamic Inventory
-   Orders
-   Homepage Builder
-   Marketing
-   Rewards
-   Scratch Cards
-   Offers
-   Analytics
-   Image Uploads

------------------------------------------------------------------------

# 📦 Inventory Architecture

Supported inventory types:

### Shirts

XS • S • M • L • XL • XXL • 3XL • 4XL

### Pants

28 • 30 • 32 • 34 • 36 • 38 • 40 • 42

### Shoes

6 • 7 • 8 • 9 • 10 • 11 • 12

### Combo Products

-   Independent Shirt Stock
-   Independent Pant Stock

### Accessories

Overall stock tracking

------------------------------------------------------------------------

# 🗄 Database Architecture

``` text
Users
 ├── Profiles
 ├── Addresses
 ├── Wishlist
 └── Cart

Products
 ├── Categories
 ├── Collections
 ├── Reviews
 └── Inventory

Orders
 ├── Order Items
 ├── Payments
 └── Status

Marketing
 ├── Homepage Builder
 ├── Rewards
 ├── Scratch Cards
 ├── Offers
 ├── Category Carousel
 └── Referrals
```

------------------------------------------------------------------------

# 💳 Payment Workflow

``` text
Customer
   ↓
Cart
   ↓
Checkout
   ↓
Create Razorpay Order
   ↓
Payment
   ↓
Webhook Verification
   ↓
Order Creation
   ↓
Inventory Reduction
   ↓
Rewards
   ↓
Scratch Card
   ↓
Success Page
```

------------------------------------------------------------------------

# 🔐 Authentication

-   Google OAuth
-   Supabase Authentication
-   Protected Routes
-   Role-based Admin Authorization

------------------------------------------------------------------------

# 📈 Performance

-   Next/Image optimization
-   Lazy loading
-   Dynamic imports
-   Memoization
-   Optimized rendering
-   Responsive UI

------------------------------------------------------------------------

# 🔍 SEO

-   Dynamic Metadata
-   Sitemap
-   robots.txt
-   Open Graph
-   Twitter Cards
-   Structured Data

------------------------------------------------------------------------

# 🚀 Deployment

-   Vercel
-   Supabase
-   Razorpay
-   Custom Domain

------------------------------------------------------------------------

# ⚙ Environment Variables

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

------------------------------------------------------------------------

# 🖥 Installation

``` bash
git clone https://github.com/ashrithnamburi06-ux/gr_styles.git
cd gr_styles
npm install
npm run dev
```

Build:

``` bash
npm run build
npm start
```

------------------------------------------------------------------------

# 🛣 Roadmap

-   AI Recommendations
-   Voice Search
-   Multi-language
-   Loyalty Program
-   Advanced Analytics
-   Push Notifications
-   AR Try-On

------------------------------------------------------------------------

# 👨‍💻 Developer

**Ashrith Namburi**

Full Stack Developer

Tech: - Next.js - React - TypeScript - Supabase - PostgreSQL - Redux
Toolkit - Tailwind CSS - Razorpay

GitHub: https://github.com/ashrithnamburi06-ux

------------------------------------------------------------------------

# 📄 License

MIT License

------------------------------------------------------------------------

⭐ If you found this project useful, consider starring the repository.
