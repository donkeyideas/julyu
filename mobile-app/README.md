# Julyu Mobile App

React Native + Expo mobile application for iOS and Android.

## Technology Stack

- **Framework**: React Native with Expo SDK 50+
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand + React Query
- **Backend**: Supabase (shared with web app)
- **Styling**: NativeWind (Tailwind CSS for React Native)

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on physical device (for testing)

## Quick Start

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS Simulator (Mac only)
npx expo start --ios

# Run on Android Emulator
npx expo start --android
```

## Project Structure

```
mobile-app/
├── app/                      # Expo Router screens
│   ├── (auth)/               # Auth screens (login, signup)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/               # Main tab navigation
│   │   ├── index.tsx         # Home/Dashboard
│   │   ├── scan.tsx          # Receipt Scanner
│   │   ├── lists.tsx         # Shopping Lists
│   │   ├── profile.tsx       # User Profile
│   │   └── _layout.tsx
│   ├── compare/
│   │   └── [listId].tsx      # Price Comparison
│   ├── receipt/
│   │   └── [id].tsx          # Receipt Details
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Entry redirect
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   ├── receipt/
│   │   ├── ReceiptCamera.tsx
│   │   ├── ReceiptPreview.tsx
│   │   └── ItemsList.tsx
│   ├── list/
│   │   ├── ShoppingList.tsx
│   │   ├── ListItem.tsx
│   │   └── AddItemModal.tsx
│   └── comparison/
│       ├── StoreCard.tsx
│       ├── PriceTable.tsx
│       └── SavingsBadge.tsx
├── hooks/
│   ├── useAuth.ts            # Authentication hook
│   ├── useReceipts.ts        # Receipt management
│   ├── useLists.ts           # Shopping lists
│   └── useComparison.ts      # Price comparison
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── api.ts                # API wrapper
│   └── storage.ts            # AsyncStorage utilities
├── store/
│   ├── authStore.ts          # Auth state
│   ├── listStore.ts          # List state
│   └── settingsStore.ts      # App settings
├── types/
│   └── index.ts              # TypeScript types
├── constants/
│   └── colors.ts             # Color palette
├── app.json                  # Expo configuration
├── package.json
├── tsconfig.json
└── tailwind.config.js        # NativeWind config
```

## Key Features

### 1. Receipt Scanning
- Camera capture with ML Kit text recognition
- Gallery image selection
- AI-powered item extraction (via web API)
- Receipt history with search

### 2. Shopping Lists
- Create and manage multiple lists
- Add items with autocomplete
- Real-time price updates
- Share lists with family

### 3. Price Comparison
- Compare prices across nearby stores
- See potential savings
- Get optimal shopping route
- Store distance and hours

### 4. Price Alerts
- Set target prices for items
- Push notifications when price drops
- Weekly price trend reports

### 5. Savings Dashboard
- Monthly savings tracker
- Category breakdown
- Historical charts
- Share achievements

## API Integration

The mobile app connects to the same backend as the web app:

| Feature | Endpoint | Method |
|---------|----------|--------|
| Auth | Supabase Auth SDK | - |
| Scan Receipt | `/api/receipts/scan` | POST |
| Get Receipts | `/api/receipts` | GET |
| Compare Prices | `/api/lists/analyze` | POST |
| Shopping Lists | `/api/lists` | CRUD |
| Price Alerts | `/api/alerts` | CRUD |
| User Profile | `/api/users/me` | GET/PUT |

## Environment Variables

Create a `.env` file in the mobile-app directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=https://julyu.com/api
```

## Development Phases

### Phase 1: Core MVP
- [x] Project setup with Expo
- [ ] Supabase authentication
- [ ] Receipt scanning + OCR
- [ ] Basic list management
- [ ] Price comparison (single store)

### Phase 2: Enhanced Features
- [ ] Multi-store comparison
- [ ] Push notifications for alerts
- [ ] Savings dashboard
- [ ] Offline mode with sync

### Phase 3: Advanced
- [ ] Voice input for lists
- [ ] Barcode scanning
- [ ] Store maps integration
- [ ] Social sharing

## Building for Production

### iOS
```bash
# Build for iOS App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android
```bash
# Build for Google Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## App Store Requirements

### iOS App Store
- Apple Developer Account ($99/year)
- App icons (1024x1024)
- Screenshots for all device sizes
- Privacy policy URL
- App description and keywords

### Google Play Store
- Google Play Developer Account ($25 one-time)
- Feature graphic (1024x500)
- Screenshots for phones and tablets
- Privacy policy URL
- Content rating questionnaire

## Contributing

1. Create feature branch from `main`
2. Make changes and test on both platforms
3. Submit pull request with screenshots
4. Wait for code review and approval

## Support

For issues or questions:
- GitHub Issues: https://github.com/julyu/mobile-app/issues
- Email: mobile@julyu.com
