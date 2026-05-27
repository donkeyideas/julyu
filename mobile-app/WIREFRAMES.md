# Julyu Mobile App Wireframes

Detailed wireframes and specifications for the Julyu iOS and Android mobile application.

---

## Screen Flow Diagram

```
 ┌─────────────┐
 │ Splash │
 │ Screen │
 └──────┬──────┘
 │
 ┌────────────┴────────────┐
 │ │
 ▼ ▼
 ┌──────────────┐ ┌──────────────┐
 │  Onboarding  │ │ Login │
 │ (First │◄─────────│ Screen │
 │ Time) │ └──────────────┘
 └──────┬───────┘ │
 │ │
 ▼ ▼
 ┌──────────────┐ ┌──────────────┐
 │ Sign Up │ │ Home │
 │ Screen │─────────►│  Dashboard │
 └──────────────┘ └──────┬───────┘
 │
 ┌─────────────┬─────┴─────┬─────────────┐
 │ │ │ │
 ▼ ▼ ▼ ▼
 ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
 │  Scanner  │ │ Lists │ │  Compare  │ │  Profile  │
 └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

---

## 1. Splash Screen

```
┌─────────────────────────────┐
│ │
│ │
│ │
│ │
│ │
│ ╔═══════════╗ │
│ ║ JULYU ║ │
│ ╚═══════════╝ │
│ │
│ Save Smart. Live Well.  │
│ │
│ │
│ │
│ [Loading...] │
│ │
│ │
└─────────────────────────────┘
```

**Specifications:**
- Duration: 1.5-2 seconds
- Animation: Logo fade-in with pulse
- Background: Black (#000000)
- Logo color: Green (#22c55e)

---

## 2. Onboarding (First-Time Users)

### Screen 2.1 - Welcome

```
┌─────────────────────────────┐
│ │
│ [Illustration] │
│ →  → │
│ │
│ ┌─────────────────────┐  │
│ │ │  │
│ │ Save $287/month │  │
│ │ on groceries │  │
│ │ │  │
│ └─────────────────────┘  │
│ │
│ Join 127,000+ smart │
│ shoppers who save big │
│ every month │
│ │
│ ○ ○ ○  (page 1 of 3) │
│ │
│ ┌─────────────────────┐  │
│ │ Next → │  │
│ └─────────────────────┘  │
│ │
│ Skip Setup │
└─────────────────────────────┘
```

### Screen 2.2 - Features

```
┌─────────────────────────────┐
│ │
│ [Illustration] │
│ │
│ │
│ ┌─────────────────────┐  │
│ │ │  │
│ │ Scan receipts │  │
│ │ instantly │  │
│ │ │  │
│ └─────────────────────┘  │
│ │
│ ┌───────┐ ┌───────┐ │
│ │ │ │ │ │
│ │ Scan  │ │ Alert │ │
│ └───────┘ └───────┘ │
│ ┌───────┐ ┌───────┐ │
│ │ │ │ │ │
│ │Compare│ │ Lists │ │
│ └───────┘ └───────┘ │
│ │
│ ○ ● ○  (page 2 of 3) │
│ │
│ ┌─────────────────────┐  │
│ │ Next → │  │
│ └─────────────────────┘  │
└─────────────────────────────┘
```

### Screen 2.3 - Get Started

```
┌─────────────────────────────┐
│ │
│ [Illustration] │
│ │
│ │
│ ┌─────────────────────┐  │
│ │ │  │
│ │ Ready to save? │  │
│ │ │  │
│ └─────────────────────┘  │
│ │
│ Create your free │
│ account to get started │
│ │
│ │
│ ○ ○ ●  (page 3 of 3) │
│ │
│ ┌─────────────────────┐  │
│ │  Get Started Free │  │ ← Green button
│ └─────────────────────┘  │
│ │
│ ┌─────────────────────┐  │
│ │  I have an account  │  │ ← Outline button
│ └─────────────────────┘  │
│ │
└─────────────────────────────┘
```

---

## 3. Authentication Screens

### Screen 3.1 - Login

```
┌─────────────────────────────┐
│  ← │
│ │
│ ╔═══════════╗ │
│ ║ JULYU ║ │
│ ╚═══════════╝ │
│ │
│ Welcome back! │
│ │
│ ┌─────────────────────┐  │
│ │ Email │  │
│ │ user@example.com │  │
│ └─────────────────────┘  │
│ │
│ ┌─────────────────────┐  │
│ │ Password │  │
│ │ •••••••••• │  │
│ └─────────────────────┘  │
│ │
│ Forgot password? │
│ │
│ ┌─────────────────────┐  │
│ │ Sign In │  │
│ └─────────────────────┘  │
│ │
│ ────── or continue ───── │
│ │
│ ┌─────────────────────┐  │
│ │  G  Sign in with │  │
│ │ Google │  │
│ └─────────────────────┘  │
│ │
│ ┌─────────────────────┐  │
│ │ Sign in with │  │
│ │ Apple │  │
│ └─────────────────────┘  │
│ │
│ Don't have an account? │
│ Sign up │
│ │
└─────────────────────────────┘
```

### Screen 3.2 - Sign Up

```
┌─────────────────────────────┐
│  ← │
│ │
│ Create Account │
│ │
│ ┌─────────────────────┐  │
│ │ Full Name │  │
│ │ John Smith │  │
│ └─────────────────────┘  │
│ │
│ ┌─────────────────────┐  │
│ │ Email │  │
│ │ john@example.com │  │
│ └─────────────────────┘  │
│ │
│ ┌─────────────────────┐  │
│ │ Password │  │
│ │ •••••••••• │  │
│ └─────────────────────┘  │
│ Min 8 chars, 1 number │
│ │
│ ┌─────────────────────┐  │
│ │ ZIP Code │  │
│ │ 45202 │  │
│ └─────────────────────┘  │
│ For local store prices │
│ │
│ I agree to Terms & │
│ Privacy Policy │
│ │
│ ┌─────────────────────┐  │
│ │ Create Account │  │
│ └─────────────────────┘  │
│ │
│ Already have an account? │
│ Sign in │
│ │
└─────────────────────────────┘
```

---

## 4. Main Tab Navigation

### Tab Bar

```
┌─────────────────────────────┐
│ │
│ [Screen Content] │
│ │
├─────────────────────────────┤
│ │
│ │
│ Home Scan Lists  Profile│
│ │
└─────────────────────────────┘
```

**Tab Specifications:**
- Active: Green (#22c55e) with label
- Inactive: Gray (#6b7280) without label
- Height: 80px (with safe area)
- Icons: 24x24px

---

## 5. Home Dashboard

```
┌─────────────────────────────┐
│ ● │
├─────────────────────────────┤
│ │
│ Good morning, John! │
│ │
│ ┌─────────────────────────┐ │
│ │ │ │
│ │  This Month's Savings │ │
│ │ │ │
│ │ $47.32 │ │
│ │ │ │
│ │  ↑ 12% from last month  │ │
│ │ │ │
│ │  ████████████░░░░ 78% │ │
│ │  of $60 goal │ │
│ │ │ │
│ └─────────────────────────┘ │
│ │
│ Quick Actions │
│ ┌───────┐ ┌───────┐ │
│ │ │ │ │ │
│ │ Scan  │ │ Lists │ │
│ │Receipt│ │ │ │
│ └───────┘ └───────┘ │
│ ┌───────┐ ┌───────┐ │
│ │ │ │ │ │
│ │Compare│ │Alerts │ │
│ │ Prices│ │ │ │
│ └───────┘ └───────┘ │
│ │
│ Recent Receipts │
│ ┌─────────────────────────┐ │
│ │  Kroger - Jan 20 │ │
│ │ $52.47 | 12 items │ │
│ │ Saved $8.23 → │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Walmart - Jan 18 │ │
│ │ $38.92 | 8 items │ │
│ │ Saved $4.15 → │ │
│ └─────────────────────────┘ │
│ │
├─────────────────────────────┤
│ │
│ Home Scan Lists  Profile│
└─────────────────────────────┘
```

**Specifications:**
- Savings card: Gradient green background
- Quick action buttons: 2x2 grid, 80x80px each
- Receipt cards: Swipeable for delete
- Pull to refresh enabled

---

## 6. Receipt Scanner

### Screen 6.1 - Camera View

```
┌─────────────────────────────┐
│ ← Scan Receipt │
├─────────────────────────────┤
│ │
│ ┌─────────────────────────┐ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ ┌───────────────┐ │ │
│ │ │ │ │ │
│ │ │ [Camera] │ │ │
│ │ │ Preview │ │ │
│ │ │ │ │ │
│ │ │  ┌─────────┐  │ │ │
│ │ │  │ Receipt │  │ │ │
│ │ │  │ detected│  │ │ │
│ │ │  └─────────┘  │ │ │
│ │ │ │ │ │
│ │ └───────────────┘ │ │
│ │ │ │
│ │ │ │
│ └─────────────────────────┘ │
│ │
│  Position receipt in frame  │
│ │
│ ┌───────────┐ │
│ │ │ │
│ │  Capture  │ │
│ └───────────┘ │
│ │
│  ┌─────────────────────────┐│
│  │  Upload from gallery  ││
│  └─────────────────────────┘│
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

### Screen 6.2 - Processing

```
┌─────────────────────────────┐
│ ← Processing... │
├─────────────────────────────┤
│ │
│ │
│ │
│ │
│ ┌─────────────────┐ │
│ │ │ │
│ │  [Receipt │ │
│ │ Thumbnail] │ │
│ │ │ │
│ └─────────────────┘ │
│ │
│ ◐ Scanning... │
│ │
│ Extracting items and │
│ matching prices │
│ │
│ ████████░░░░░░░  52% │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

### Screen 6.3 - Results

```
┌─────────────────────────────┐
│ ← Receipt Details Edit │
├─────────────────────────────┤
│ │
│ ┌─────────────────────────┐ │
│ │  Kroger │ │
│ │ Jan 20, 2024 • 2:34 PM │ │
│ │ 12 items • $52.47 │ │
│ └─────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ │
│ │  Potential Savings │ │
│ │ │ │
│ │ You could save $8.23 │ │
│ │ at Walmart for these │ │
│ │ same items │ │
│ │ │ │
│ │ [Compare Prices →] │ │
│ └─────────────────────────┘ │
│ │
│ Items (12) │
│ ┌─────────────────────────┐ │
│ │  Milk 2% Gallon │ │
│ │ $3.49 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Eggs Large Dozen │ │
│ │ $4.99 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Bread Whole Wheat │ │
│ │ $2.99 │ │
│ └─────────────────────────┘ │
│ ... more items │
│ │
│ ┌─────────────────────────┐ │
│ │ Add to Shopping List  │ │
│ └─────────────────────────┘ │
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

---

## 7. Shopping Lists

### Screen 7.1 - All Lists

```
┌─────────────────────────────┐
│  Shopping Lists ＋ │
├─────────────────────────────┤
│ │
│ ┌─────────────────────────┐ │
│ │  Weekly Groceries │ │
│ │ 8 items • $34.50 │ │
│ │ Updated 2 hours ago │ │
│ └─────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ │
│ │  Birthday Party │ │
│ │ 12 items • $67.20 │ │
│ │ Updated yesterday │ │
│ └─────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ │
│ │  Household │ │
│ │ 5 items • $23.80 │ │
│ │ Updated 3 days ago │ │
│ └─────────────────────────┘ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

### Screen 7.2 - List Detail

```
┌─────────────────────────────┐
│ ← Weekly Groceries ⋮ │
├─────────────────────────────┤
│ │
│ ┌─────────────────────────┐ │
│ │ Compare Prices │ │
│ │ Find best store → │ │
│ └─────────────────────────┘ │
│ │
│ Dairy (3) │
│ ┌─────────────────────────┐ │
│ │  Milk 2% Gallon │ │
│ │ Best: Kroger $3.49 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Eggs Large Dozen │ │
│ │ Best: Walmart $4.29 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Butter Unsalted │ │
│ │ Best: Kroger $4.99 │ │
│ └─────────────────────────┘ │
│ │
│ Bakery (2) │
│ ┌─────────────────────────┐ │
│ │  Bread Whole Wheat │ │
│ │ Best: Target $2.79 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Bagels Plain 6ct │ │
│ │ Best: Kroger $3.29 │ │
│ └─────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ │
│ │ + Add item │ │
│ └─────────────────────────┘ │
│ │
│ Est. Total: $34.50 │
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

---

## 8. Price Comparison

```
┌─────────────────────────────┐
│ ← Compare Prices │
├─────────────────────────────┤
│ │
│ Weekly Groceries (8 items)  │
│ │
│  45202 [Change] │
│ │
│ Best Option │
│ ┌─────────────────────────┐ │
│ │  KROGER │ │
│ │ │ │
│ │ Total: $31.47 │ │
│ │ │ │
│ │  Save $8.23 vs avg │ │
│ │ │ │
│ │  2.1 mi • Open til 10 │ │
│ │ │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ View Store List │ │ │
│ │ └─────────────────────┘ │ │
│ │ │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ Get Directions │ │ │
│ │ └─────────────────────┘ │ │
│ └─────────────────────────┘ │
│ │
│ Other Options │
│ ┌─────────────────────────┐ │
│ │ Walmart $33.92 │ │
│ │ 3.4 mi away +$2.45  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Target $35.67 │ │
│ │ 4.2 mi away +$4.20  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Meijer $36.89 │ │
│ │ 5.8 mi away +$5.42  │ │
│ └─────────────────────────┘ │
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

---

## 9. User Profile

```
┌─────────────────────────────┐
│  Profile ️  │
├─────────────────────────────┤
│ │
│ ┌─────────────────────────┐ │
│ │ ┌─────────┐ │ │
│ │ │ │ │ │
│ │ │  John │ │ │
│ │ └─────────┘ │ │
│ │ │ │
│ │ John Smith │ │
│ │ john@example.com │ │
│ │ Member since Jan 2024 │ │
│ │ │ │
│ │ [Edit Profile] │ │
│ └─────────────────────────┘ │
│ │
│ Savings Summary │
│ ┌─────────────────────────┐ │
│ │ Total Saved $847.32  │ │
│ │ Receipts 156 │ │
│ │ Lists Created 12 │ │
│ └─────────────────────────┘ │
│ │
│ Settings │
│ ┌─────────────────────────┐ │
│ │  Notifications → │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Default ZIP → │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Preferred Stores → │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │  Subscription → │ │
│ └─────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ │
│ │ Sign Out │ │
│ └─────────────────────────┘ │
│ │
├─────────────────────────────┤
│ │
└─────────────────────────────┘
```

---

## Design Specifications

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Green | #22c55e | CTAs, active states, success |
| Background | #000000 | App background |
| Card | #111827 | Card backgrounds |
| Border | #1f2937 | Card borders, dividers |
| Text Primary | #ffffff | Headlines, labels |
| Text Secondary | #9ca3af | Body text, descriptions |
| Text Muted | #6b7280 | Placeholders, hints |
| Error | #ef4444 | Error states |
| Warning | #f59e0b | Warning states |

### Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Headline | 28px | Bold | Screen titles |
| Title | 20px | Semibold | Card titles |
| Body | 16px | Regular | Body text |
| Caption | 14px | Regular | Secondary text |
| Label | 12px | Medium | Labels, tags |

### Spacing

- Base unit: 4px
- Card padding: 16px
- Screen padding: 20px
- Between sections: 24px
- Between cards: 12px

### Components

- Border radius (cards): 12px
- Border radius (buttons): 8px
- Button height: 48px
- Input height: 48px
- Tab bar height: 80px (with safe area)

---

## Interaction Patterns

### Gestures
- **Swipe left on list item**: Delete/Archive
- **Swipe right on receipt**: Quick compare
- **Pull down**: Refresh content
- **Long press on item**: Edit/Move options

### Animations
- **Screen transitions**: Slide left/right (300ms)
- **Modal**: Slide up from bottom (250ms)
- **Button press**: Scale to 0.98 (100ms)
- **Loading**: Skeleton shimmer effect

### Haptics
- **Button tap**: Light impact
- **Success action**: Success notification
- **Error**: Error notification
- **Pull to refresh**: Medium impact

---

## Accessibility

- All interactive elements minimum 44x44px touch target
- Color contrast ratio minimum 4.5:1
- Screen reader labels on all icons
- Support for Dynamic Type (iOS)
- Support for TalkBack (Android)
- Reduced motion preference support
