# 🎨 SAFARNAMA DESIGN SYSTEM - QUICK REFERENCE

## 🇮🇳 COLOR PALETTE

### Primary Colors (Indian Flag)
```css
Saffron:  #FF9933  ████████  (Energy, Courage)
White:    #FFFFFF  ████████  (Peace, Truth)
Green:    #138808  ████████  (Growth, Prosperity)
Blue:     #000080  ████████  (Ashoka Chakra)
```

### Nature Colors
```css
Forest:   #2d5016  ████████  (Deep Forest)
Sky:      #87ceeb  ████████  (Clear Sky)
Earth:    #8B4513  ████████  (Soil)
Sand:     #d4a574  ████████  (Desert)
Sunset:   #f4a460  ████████  (Warm Glow)
Gold:     #FFD700  ████████  (Golden Hour)
```

---

## 📝 TYPOGRAPHY

### Font Stack
```css
Primary:   Poppins (Headings, UI)
Secondary: Inter (Body text)
Display:   Island Moments (Decorative)
```

### Font Sizes
```css
xs:  12px  /* Small labels */
sm:  14px  /* Body text */
base: 16px  /* Default */
lg:  18px  /* Large text */
xl:  20px  /* Subheadings */
2xl: 24px  /* Section titles */
3xl: 30px  /* Page titles */
4xl: 36px  /* Hero headings */
5xl: 48px  /* Display text */
6xl: 60px  /* Extra large */
```

### Font Weights
```
Light:     300
Regular:   400
Medium:    500
Semibold:  600 ← Use for buttons
Bold:      700
Extrabold: 800 ← Use for hero text
```

---

## 📐 SPACING

```css
xs:  4px   /* Tight spacing */
sm:  8px   /* Close elements */
md:  16px  /* Default gap */
lg:  24px  /* Section spacing */
xl:  32px  /* Large gaps */
2xl: 48px  /* Major sections */
3xl: 64px  /* Hero spacing */
```

**Usage:**
```scss
padding: var(--space-md);
margin-bottom: var(--space-lg);
gap: var(--space-sm);
```

---

## 🔘 BORDER RADIUS

```css
sm:   6px   /* Subtle rounding */
md:   8px   /* Default cards */
lg:   16px  /* Prominent cards */
xl:   24px  /* Large elements */
2xl:  32px  /* Feature cards */
full: 9999px /* Pills/circles */
```

---

## 🌑 SHADOWS

```css
sm:   Subtle elevation
md:   Default cards
lg:   Hover state
xl:   Modal/popup
2xl:  Hero elements
```

**Example:**
```scss
.card {
    box-shadow: var(--shadow-md);
    
    &:hover {
        box-shadow: var(--shadow-xl);
    }
}
```

---

## 🎨 GRADIENTS

```css
/* India Flag */
--gradient-india: 
    linear-gradient(135deg, 
        #FF9933 0%,   /* Saffron */
        #FFFFFF 50%,  /* White */
        #138808 100%  /* Green */
    );

/* Primary Actions */
--gradient-primary: 
    linear-gradient(135deg, 
        #1DA512 0%,   /* Light Green */
        #0D5D05 100%  /* Dark Green */
    );

/* Secondary Actions */
--gradient-secondary: 
    linear-gradient(135deg, 
        #FFB366 0%,   /* Light Saffron */
        #E67300 100%  /* Dark Saffron */
    );

/* Sunset/Warm */
--gradient-sunset: 
    linear-gradient(135deg, 
        #f4a460 0%,   /* Sunset Orange */
        #FFD700 100%  /* Golden Yellow */
    );
```

---

## 💫 ANIMATIONS

### Transitions
```css
Fast:  150ms  /* Micro-interactions */
Base:  300ms  /* Default */
Slow:  500ms  /* Dramatic effects */
Cubic: cubic-bezier(0.4, 0, 0.2, 1) /* Smooth easing */
```

### Common Animations
```scss
/* Hover Lift */
.element:hover {
    transform: translateY(-4px);
    transition: all var(--transition-base);
}

/* Fade In */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
    from { 
        opacity: 0;
        transform: translateY(20px);
    }
    to { 
        opacity: 1;
        transform: translateY(0);
    }
}
```

---

## 🪟 GLASSMORPHISM

```scss
.glass {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
}
```

**Variants:**
```scss
/* Light Glass */
background: rgba(255, 255, 255, 0.25);

/* Dark Glass */
background: rgba(0, 0, 0, 0.3);

/* India Themed */
border: 2px solid transparent;
background-image: 
    linear-gradient(white, white),
    var(--gradient-india);
background-origin: border-box;
background-clip: padding-box, border-box;
```

---

## 🔘 BUTTON STYLES

### Primary Button (Green)
```jsx
<button className="btn">
    Book Now
</button>
```
**Style:** Green gradient, white text, lift on hover

### Secondary Button (Saffron)
```jsx
<button className="primary_button">
    Learn More
</button>
```
**Style:** Saffron gradient, white text, rounded

### Tertiary Button (Outlined)
```jsx
<button className="secondary_button">
    Explore
</button>
```
**Style:** Transparent, green border, fills on hover

---

## 💰 INDIAN CURRENCY FORMATTING

```javascript
import { formatIndianCurrency } from '../utils/indianLocalization';

// Basic usage
formatIndianCurrency(5000)
// Output: ₹5,000

formatIndianCurrency(150000)
// Output: ₹1,50,000

formatIndianCurrency(10000000)
// Output: ₹1,00,00,000

// Price range
formatPriceRange(5000, 15000)
// Output: ₹5,000 - ₹15,000

// With lakhs/crores
formatIndianNumber(100000, true)
// Output: 1 Lakh

formatIndianNumber(12500000, true)
// Output: 1.25 Crore
```

---

## 🇮🇳 INDIAN TERMS

```javascript
import { indianTerms, getLocalizedTerm } from '../utils/indianLocalization';

// Direct access
indianTerms.journey   // "Yatra"
indianTerms.travel    // "Safar"
indianTerms.traveler  // "Yatri"
indianTerms.eco       // "Paryavaran"
indianTerms.booking   // "Aarakshan"
indianTerms.payment   // "Bhugtaan"

// Bilingual display
getLocalizedTerm('journey', true)
// Output: "Journey (Yatra)"
```

---

## 📱 RESPONSIVE BREAKPOINTS

```scss
/* Mobile First Approach */

/* Small phones */
@media screen and (max-width: 480px) {
    /* Styles */
}

/* Phones/Tablets */
@media screen and (max-width: 768px) {
    /* Styles */
}

/* Tablets/Small laptops */
@media screen and (max-width: 1024px) {
    /* Styles */
}

/* Laptops/Desktops */
@media screen and (min-width: 1024px) {
    /* Styles */
}
```

---

## 🎯 COMPONENT USAGE

### GlassCard
```jsx
import GlassCard from '../Components/common/GlassCard/GlassCard';

<GlassCard className="glass-card-eco" hover={true}>
    <h3>Card Title</h3>
    <p>Card content here...</p>
</GlassCard>
```

**Variants:**
- `glass-card-eco` - Green theme
- `glass-card-saffron` - Saffron theme
- `glass-card-india` - Flag gradient border
- `glass-card-dark` - Dark background
- `glass-card-light` - Light background

---

## 🧮 UTILITY FUNCTIONS

### GST Calculator
```javascript
calculateGST(10000, 18)
// Returns:
{
    base: 10000,
    gst: 1800,
    total: 11800,
    formatted: {
        base: "₹10,000",
        gst: "₹1,800",
        total: "₹11,800"
    }
}
```

### Discount Calculator
```javascript
calculateDiscount(10000, 20)
// Returns:
{
    original: 10000,
    discount: 2000,
    final: 8000,
    savings: 2000,
    formatted: { ... }
}
```

### Date Formatting
```javascript
formatIndianDate(new Date(), true)
// Output: "21 Oct 2025 at 03:30 PM"
```

### Distance & Duration
```javascript
formatDistance(2.5)        // "2.5 km"
formatDuration(145)        // "2 hours 25 min"
```

### Phone Number
```javascript
formatIndianPhone("9876543210")
// Output: "+91 98765 43210"
```

---

## ✅ DO'S AND DON'TS

### ✅ DO:
- Use CSS variables for consistency
- Apply glassmorphism to prominent cards
- Use ₹ symbol for all prices
- Add smooth transitions
- Use gradient buttons for primary actions
- Include Hindi phrases for emotional connection
- Test on mobile devices
- Use semantic HTML

### ❌ DON'T:
- Hardcode colors (use variables!)
- Overuse glassmorphism (special elements only)
- Mix $ and ₹ symbols
- Use instant transitions (always smooth!)
- Use too many gradients (1-2 per page max)
- Translate everything to Hindi (selective use)
- Forget accessibility
- Skip responsive design

---

## 🚀 QUICK START CHECKLIST

When creating a new component:

1. [ ] Use CSS variables for colors
2. [ ] Apply appropriate spacing (--space-*)
3. [ ] Add smooth transitions
4. [ ] Use ₹ for currency (formatIndianCurrency)
5. [ ] Consider glassmorphism for cards
6. [ ] Add hover effects
7. [ ] Make it responsive
8. [ ] Test on mobile
9. [ ] Check accessibility
10. [ ] Add loading states

---

## 📚 RESOURCES

### Internal Files:
- `App.scss` - Complete design system
- `indianLocalization.js` - All utility functions
- `GlassCard.jsx` - Glass card component
- `SplashScreen.jsx` - Splash screen example

### External References:
- **Poppins Font**: Google Fonts
- **Color Palette**: Indian Flag + Nature
- **Glassmorphism**: CSS backdrop-filter
- **Indian Numbering**: Lakhs & Crores system

---

## 🎨 COLOR ACCESSIBILITY

### High Contrast Pairs:
```
✅ Green (#138808) on White (#FFFFFF)
✅ Saffron (#FF9933) on Black (#1a1a1a)
✅ White (#FFFFFF) on Green (#138808)
✅ Black (#1a1a1a) on Saffron (#FF9933)

❌ Green on Saffron (low contrast)
❌ Light text on White background
```

---

**Happy Coding! 🚀**

**Made with ❤️ for Safarnama**  
**"यात्रा का आनंद लें"**

🇮🇳 🌿 ✨
