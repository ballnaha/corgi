# CorgiShop - Pet E-commerce Website

A modern, mobile-first pet e-commerce website built with Next.js 15, TypeScript, and Material-UI. Features a beautiful Corgi-inspired design with orange, white, and black color scheme.

## 🐕 Features

- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Pet Categories**: Browse pets by categories (Dogs, Cats, Birds, Fish, Rabbits)
- **Product Details**: Detailed pet information with image swiper
- **Shopping Cart**: Add pets to cart with quantity management
- **Search Functionality**: Search pets with collapsible search bar
- **Favorites**: Mark pets as favorites
- **Modern UI**: Clean, modern interface with smooth animations
- **LINE Integration**: 
  - LINE Login for authentication
  - LINE LIFF for seamless mobile experience
  - LINE Messaging API for order receipts
  - **Admin Notifications**: Auto-notify admin on new orders
- **Payment Integration**:
  - Stripe payment gateway for credit cards
  - Bank transfer support
  - Deposit payment for pets
- **Order Management**:
  - Real-time order status tracking
  - Automatic receipt delivery via LINE
  - Admin notification system for new orders

## 🎨 Design

- **Color Scheme**: Corgi-inspired orange (#FF6B35), white, and black
- **Typography**: Prompt font family for Thai language support
- **Components**: Modular component architecture
- **Theme**: Consistent Material-UI theming

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v7
- **Styling**: Emotion (CSS-in-JS)
- **Icons**: Material-UI Icons
- **Font**: Prompt (Google Fonts)
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with LINE provider
- **Payment**: Stripe API
- **Messaging**: LINE Messaging API
- **LIFF**: LINE Front-end Framework

## 📱 Pages

1. **Home Page**: Pet listings with categories and search
2. **Product Detail**: Individual pet information with image gallery
3. **Shopping Cart**: Cart management (drawer)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/[username]/corgi-shop.git
cd corgi-shop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure:
- Database connection (MySQL)
- NextAuth settings
- LINE credentials (Client ID, Secret, LIFF ID)
- LINE Messaging API (Channel Access Token)
- **LINE_ADMIN_USER_ID** (for admin notifications)
- Stripe keys (Public & Secret)

See [docs/LINE_ADMIN_NOTIFICATION.md](docs/LINE_ADMIN_NOTIFICATION.md) for LINE admin setup.

4. Set up database:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── product/[id]/     # Dynamic product pages
├── components/            # React components
│   ├── Header.tsx        # Navigation header
│   ├── Footer.tsx        # Footer component
│   ├── ProductCard.tsx   # Pet card component
│   ├── ProductDetail.tsx # Pet detail page
│   ├── Cart.tsx          # Shopping cart
│   ├── CategoryFilter.tsx # Category navigation
│   ├── BannerSection.tsx # Hero banner
│   └── BottomNavigation.tsx # Mobile navigation
├── data/                 # Static data
│   └── products.ts       # Pet data
├── theme/                # Theme configuration
│   ├── colors.ts         # Color palette
│   └── theme.ts          # MUI theme
└── types/                # TypeScript types
    └── index.ts          # Type definitions
```

## 🎯 Key Features

### Mobile-First Design
- Touch-friendly interface
- Swipe gestures for image galleries
- Responsive breakpoints
- Bottom navigation for mobile

### Product Management
- Dynamic routing for product pages
- Image swiper with multiple photos
- Product categories with filtering
- Search functionality

### Shopping Experience
- Add to cart functionality
- Quantity management
- Favorites system
- Smooth animations and transitions

## 🌟 Components

- **Header**: Collapsible search, cart icon, user profile
- **CategoryFilter**: Horizontal scrolling category selector
- **ProductCard**: Pet cards with images, prices, and actions
- **ProductDetail**: Full-screen pet details with image swiper
- **Cart**: Slide-out shopping cart drawer
- **BottomNavigation**: Mobile-friendly bottom navigation

## 🎨 Theming

The app uses a custom Material-UI theme with:
- Corgi-inspired color palette
- Prompt font family
- Custom component overrides
- Consistent spacing and typography

## 📱 Responsive Design

- **Mobile**: Optimized for touch interactions
- **Tablet**: Adapted layouts for medium screens
- **Desktop**: Enhanced experience for larger screens

## 🚀 Deployment

The app is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any Node.js hosting platform

### Environment Variables for Production

Make sure to set these in your hosting platform:
- `DATABASE_URL`
- `NEXTAUTH_URL` (your production domain)
- `NEXTAUTH_SECRET`
- `LINE_CLIENT_ID`, `LINE_CLIENT_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_ADMIN_USER_ID` (for admin notifications)
- `NEXT_PUBLIC_LIFF_ID`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 📚 Documentation

- [LINE Admin Notification Setup](docs/LINE_ADMIN_NOTIFICATION.md) - How to set up admin notifications
- [How to Get LINE User ID](docs/HOW_TO_GET_LINE_USER_ID.md) - Step-by-step guide to find your LINE User ID

## 💡 New Features

### Admin Notification System
When a customer places an order (via credit card or bank transfer), the system automatically sends:

1. **To Customer**: Full receipt with order details, payment summary, and shipping info
2. **To Admin**: Concise notification with:
   - Order number and customer info
   - Total amount to collect
   - Payment status (paid/pending)
   - Quick link to admin panel

See [docs/LINE_ADMIN_NOTIFICATION.md](docs/LINE_ADMIN_NOTIFICATION.md) for setup instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐕 About

CorgiShop is a demonstration of modern web development practices, showcasing a complete e-commerce solution for pet adoption and sales. The design is inspired by the lovable Corgi breed, featuring warm orange tones and friendly user interactions.

Built with ❤️ for pet lovers everywhere!