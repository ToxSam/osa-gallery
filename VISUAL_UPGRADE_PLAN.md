# 🎨 OSA Gallery - Visual Upgrade Implementation Plan

**Date Created**: January 17, 2026  
**Style Guide Reference**: ToxSam Portfolio Design System  
**Approach**: Incremental Enhancement with Gradual Migration  
**Status**: In Progress

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Design Goals](#design-goals)
3. [Implementation Strategy](#implementation-strategy)
4. [Phase Breakdown](#phase-breakdown)
5. [Progress Tracking](#progress-tracking)
6. [Testing Checklist](#testing-checklist)
7. [Rollback Plan](#rollback-plan)

---

## 🎯 Project Overview

### Current State
- **Colors**: HSL-based CSS variables, standard gray scale
- **Fonts**: Inter + Noto Sans JP
- **Layout**: Container-based with standard Tailwind spacing
- **Dark Mode**: ✅ Implemented (class-based)
- **Structure**: ✅ Good component separation, multi-language support

### Target State
- **Colors**: Warm neutral palette (`#EBE7E0` / `#141311`)
- **Fonts**: Geist Sans + Geist Mono
- **Typography**: Responsive clamp() scale (display, headline, title, body-lg, body, small, caption)
- **Layout**: Custom spacing utilities, generous whitespace
- **Components**: Consistent styling patterns, subtle animations
- **Dark Mode**: Enhanced with proper warm palette

### Design Principles
1. **Minimalism** with generous whitespace
2. **High contrast** for readability
3. **Smooth animations** (200-300ms transitions)
4. **Consistent spacing** for visual rhythm
5. **Warm, neutral palette** (beige/cream backgrounds)
6. **Modern typography** with tight letter spacing on headings
7. **Subtle interactions** that enhance without distracting

---

## 🎨 Design Goals

### Color Palette
```css
/* Light Mode */
--bg-primary: #EBE7E0       /* Warm beige/cream */
--bg-secondary: #F5F5F5     /* Light gray for variation */
--text-primary: #262626     /* gray-800 */
--text-secondary: #737373   /* gray-500 */
--border: #D4D4D4           /* gray-300 */

/* Dark Mode */
--bg-primary: #141311       /* Very dark brown/black */
--bg-secondary: #171717     /* gray-900 for variation */
--text-primary: #E5E5E5     /* gray-200 */
--text-secondary: #737373   /* gray-500 */
--border: #404040           /* gray-700 */
```

### Typography Scale
```css
display:    clamp(3rem, 10vw, 8rem)      /* 48px - 128px */
headline:   clamp(2rem, 5vw, 4rem)       /* 32px - 64px */
title:      clamp(1.5rem, 3vw, 2.5rem)   /* 24px - 40px */
body-lg:    1.25rem                       /* 20px */
body:       1rem                          /* 16px */
small:      0.875rem                      /* 14px */
caption:    0.75rem                       /* 12px */
```

### Spacing System
- **Container**: max-w-7xl with px-6/8/12 (responsive)
- **Section**: py-20 md:py-32 (80px / 128px vertical)
- **Custom**: spacing-18 (4.5rem), spacing-22 (5.5rem), spacing-30 (7.5rem)
- **Grids**: gap-8, gap-16, gap-20

---

## 🛠 Implementation Strategy

### Approach: Incremental Enhancement
**Why**: Minimize risk, maintain working application, easier testing

### Migration Strategy: Gradual with Fallbacks
**Why**: Safer transition, allows for testing at each step

### Priority Order
1. ✅ **Phase 1**: Foundation (Tailwind, CSS, Fonts) - CRITICAL
2. ✅ **Phase 2**: Navigation & Global Components (Header, Footer, Theme Toggle)
3. ✅ **Phase 3**: Home Page (Hero, Sections, Features)
4. ✅ **Phase 4**: About Page
5. ✅ **Phase 5**: Resources Page
6. ✅ **Phase 6**: Admin Pages (Internal - Lower Priority)
7. ✅ **Phase 7**: UI Components Library
8. 🔄 **Phase 8**: VRM Inspector Page (Complex)
9. 🔄 **Phase 9**: Gallery Page (Most Complex)
10. ✅ **Phase 10**: Polish & Optimization

### Rollback Strategy
- Keep original CSS commented for quick rollback
- Git commits per phase for easy reversion
- Test after each major change

---

## 📦 Phase Breakdown

## PHASE 1: Foundation Layer ⚡ CRITICAL

**Goal**: Establish complete design system foundation  
**Estimated Time**: 4-6 hours  
**Dependencies**: None  
**Risk**: Medium (affects entire app)

### Tasks

#### 1.1 Update `tailwind.config.ts`
- [ ] Add custom colors (warm palette)
  ```js
  colors: {
    cream: {
      DEFAULT: '#EBE7E0',
      dark: '#141311'
    },
    gray: {
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    }
  }
  ```

- [ ] Add responsive typography scale
  ```js
  fontSize: {
    display: 'clamp(3rem, 10vw, 8rem)',
    headline: 'clamp(2rem, 5vw, 4rem)',
    title: 'clamp(1.5rem, 3vw, 2.5rem)',
    'body-lg': '1.25rem',
    body: '1rem',
    small: '0.875rem',
    caption: '0.75rem'
  }
  ```

- [ ] Add Geist font families
  ```js
  fontFamily: {
    sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
    mono: ['var(--font-geist-mono)', 'monospace']
  }
  ```

- [ ] Add custom spacing
  ```js
  spacing: {
    '18': '4.5rem',
    '22': '5.5rem',
    '30': '7.5rem'
  }
  ```

- [ ] Add custom animations
  ```js
  keyframes: {
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' }
    },
    'slide-up': {
      '0%': { opacity: '0', transform: 'translateY(20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' }
    },
    'slide-in-left': {
      '0%': { opacity: '0', transform: 'translateX(-20px)' },
      '100%': { opacity: '1', transform: 'translateX(0)' }
    }
  },
  animation: {
    'fade-in': 'fade-in 0.6s ease-out',
    'slide-up': 'slide-up 0.6s ease-out',
    'slide-in-left': 'slide-in-left 0.6s ease-out'
  }
  ```

- [ ] Update container configuration
  ```js
  container: {
    center: true,
    padding: {
      DEFAULT: '1.5rem',
      md: '2rem',
      lg: '3rem'
    },
    screens: {
      '2xl': '1280px'
    }
  }
  ```

#### 1.2 Update `globals.css`
- [ ] Update CSS variables for new color scheme
- [ ] Add custom utility classes:
  - `.container-custom`
  - `.section-padding`
  - `.btn-primary`
  - `.btn-outline`
  - `.link-hover` (animated underline)
  - `.text-display`, `.text-headline`, etc.
  - `.animation-delay-{100-500}`
- [ ] Update base styles:
  - `html` smooth scrolling
  - Heading styles (tracking, weight)
  - Typography line-heights
  - Selection colors (inverted)
  - Focus states
- [ ] Add backdrop blur utilities

#### 1.3 Update Root Layout (`src/app/layout.tsx`)
- [ ] Import Geist Sans & Geist Mono fonts
- [ ] Add inline script for theme initialization (prevent flash)
- [ ] Apply font variables to html element
- [ ] Ensure ThemeProvider is properly initialized

#### 1.4 Testing
- [ ] Verify fonts load correctly
- [ ] Test dark mode toggle
- [ ] Check all pages for layout breaks
- [ ] Validate color contrast (accessibility)

---

## PHASE 2: Navigation & Global Components

**Goal**: Update header, footer, and theme toggle with new styling  
**Estimated Time**: 4-6 hours  
**Dependencies**: Phase 1 complete  
**Risk**: Low (isolated components)

### Tasks

#### 2.1 Update `AvatarHeader.tsx`
- [ ] Background: `bg-cream/90 dark:bg-cream-dark/90 backdrop-blur-md`
- [ ] Border: `border-b border-gray-300/50 dark:border-gray-700/50`
- [ ] Height: `h-16 md:h-20`
- [ ] Logo: Larger, bolder typography
- [ ] Navigation Links:
  - [ ] Uppercase: `text-sm uppercase tracking-wider`
  - [ ] Add `.link-hover` class
  - [ ] Active: `text-gray-900 dark:text-gray-100 font-bold`
  - [ ] Inactive: `text-gray-500 hover:text-gray-900`
- [ ] Mobile Menu:
  - [ ] Full-width with backdrop blur
  - [ ] Animated hamburger icon
- [ ] Social Icons: Consistent hover states
- [ ] Z-index: `z-50` for sticky

#### 2.2 Update `Footer.tsx`
- [ ] Background: Match warm palette
- [ ] Border: `border-t border-gray-300 dark:border-gray-700`
- [ ] Typography:
  - [ ] Headers: `text-caption uppercase tracking-widest`
  - [ ] Links: Add `.link-hover` effect
  - [ ] Body: `text-small`
- [ ] Spacing: `py-20 md:py-32`
- [ ] Grid: Maintain 4-column
- [ ] Bottom bar: Clean separation

#### 2.3 Update `ThemeToggle.tsx`
- [ ] Icon sizing: Consistent scale
- [ ] Focus ring: `ring-2 ring-black dark:ring-white ring-offset-2`
- [ ] Transition: `transition-colors duration-200`
- [ ] Optional: Add sun/moon animation

#### 2.4 Testing
- [ ] Test header on all pages
- [ ] Test footer on all pages
- [ ] Test theme toggle functionality
- [ ] Test mobile menu on various devices
- [ ] Test sticky header scroll behavior

---

## PHASE 3: Home Page (`src/app/page.tsx`)

**Goal**: Transform home page with new visual design  
**Estimated Time**: 4-6 hours  
**Dependencies**: Phase 2 complete  
**Risk**: Medium (main landing page)

### Tasks

#### 3.1 Hero Section
- [ ] Background: `bg-cream dark:bg-cream-dark`
- [ ] Typography:
  - [ ] H1: `text-display tracking-tight`
  - [ ] Description: `text-body-lg leading-relaxed`
- [ ] Spacing: Apply `section-padding`, `container-custom`
- [ ] Buttons:
  - [ ] Primary: `.btn-primary` with `px-8 py-4 text-lg`
  - [ ] Outline: `.btn-outline` with `px-8 py-4 text-lg`
- [ ] 3D Viewer: Add text-shadow on mobile if needed

#### 3.2 Section Dividers
- [ ] Implement horizontal line + centered label pattern
- [ ] Style: `text-caption uppercase tracking-widest`

#### 3.3 Project Overview Section
- [ ] Apply `section-padding`
- [ ] Max-width: `max-w-4xl`
- [ ] Typography: `text-headline` for title, `text-body-lg` for content
- [ ] Spacing: Generous vertical gaps

#### 3.4 Tools & Features Section
- [ ] Background: `bg-gray-50 dark:bg-gray-900`
- [ ] Cards:
  - [ ] Border: `border border-gray-300 dark:border-gray-700`
  - [ ] Hover: `hover:border-gray-900 dark:hover:border-gray-100`
  - [ ] Padding: `p-12`
  - [ ] Border radius: `rounded-lg`
- [ ] Icons: Consistent sizing (h-8 w-8 or h-12 w-12)
- [ ] CTA Links: Add arrow `→` and `.link-hover`

#### 3.5 Technical Deep Dive Section
- [ ] Info boxes:
  - [ ] Background: `bg-gray-50 dark:bg-gray-900`
  - [ ] Border: `border border-gray-300 dark:border-gray-700`
  - [ ] Padding: `p-8`
- [ ] Bullet points: Custom black dot styling
  ```jsx
  <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full" />
  ```

#### 3.6 Use Cases Section
- [ ] Background: `bg-gray-50 dark:bg-gray-900`
- [ ] Grid: Maintain 3-column layout
- [ ] Icons: Large (h-12 w-12)
- [ ] Typography: Consistent with type scale

#### 3.7 Final CTA Section
- [ ] Center content with `max-w-4xl`
- [ ] Large typography for impact
- [ ] Button group with proper spacing

#### 3.8 Testing
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Test all interactive elements
- [ ] Test 3D viewer integration
- [ ] Verify dark mode across all sections
- [ ] Check typography scaling

---

## PHASE 4: About Page

**Goal**: Update About page with new styling  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 3 complete  
**Risk**: Low

### Tasks

#### 4.1 Content Typography
- [ ] Title: `text-headline`
- [ ] Section Headings: `text-title`
- [ ] Body Text: `text-body-lg leading-relaxed`
- [ ] Spacing: `space-y-16` vertical

#### 4.2 Badges
- [ ] Consistent padding: `px-4 py-2`
- [ ] Border radius: `rounded-lg`
- [ ] Typography: `text-caption uppercase tracking-wider`
- [ ] Style: `bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900`

#### 4.3 Info Boxes
- [ ] Background: `bg-gray-50 dark:bg-gray-900`
- [ ] Border: `border border-gray-300 dark:border-gray-700`
- [ ] Padding: `p-8`
- [ ] Typography: `text-body` for lists

#### 4.4 CTA Box
- [ ] Prominent background
- [ ] Use `.btn-primary` for buttons
- [ ] External link indicator `↗`

#### 4.5 Testing
- [ ] Test content readability
- [ ] Test responsive layout
- [ ] Test dark mode
- [ ] Test all links

---

## PHASE 5: Resources Page

**Goal**: Update Resources page with new styling  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 4 complete  
**Risk**: Low

### Tasks

#### 5.1 Overall Structure
- [ ] Match About page patterns
- [ ] Apply `section-padding` and `container-custom`

#### 5.2 Large Button Cards
- [ ] Style as cards:
  - [ ] `border border-gray-300 dark:border-gray-700`
  - [ ] `p-8` padding
  - [ ] `hover:border-gray-900 dark:hover:border-gray-100`
  - [ ] `transition-colors duration-200`
- [ ] Icon: `h-12 w-12`
- [ ] Typography: Title (`text-title`), Description (`text-body`)

#### 5.3 Info Sections
- [ ] Match About page box styling
- [ ] Consistent spacing and typography

#### 5.4 Testing
- [ ] Test grid layout
- [ ] Test card interactions
- [ ] Test all external links
- [ ] Test dark mode

---

## PHASE 6: Admin Pages (Internal - Lower Priority)

**Goal**: Update admin interface styling  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 5 complete  
**Risk**: Low (internal tool)

### Tasks

#### 6.1 `src/app/admin/page.tsx`
- [ ] Header bar:
  - [ ] Background with backdrop blur
  - [ ] Border: `border-b border-gray-300 dark:border-gray-700`
  - [ ] Typography: `text-caption uppercase tracking-wider`
- [ ] Sign Out Button: Use button styles

#### 6.2 `AvatarAdminDashboard.tsx`
- [ ] Apply card patterns
- [ ] Form elements: Match style guide
- [ ] Consistent spacing

#### 6.3 Bulk Upload Page
- [ ] Form styling patterns
- [ ] Input fields: Consistent height and focus states
- [ ] Upload dropzone: Card styling
- [ ] Progress indicators: Styled

#### 6.4 Testing
- [ ] Test upload functionality
- [ ] Test form validation
- [ ] Test admin controls

---

## PHASE 7: UI Components Library

**Goal**: Update all shared UI components  
**Estimated Time**: 4-6 hours  
**Dependencies**: Phases 1-5 complete  
**Risk**: Medium (affects entire app)

### Tasks

#### 7.1 `Button` Component
- [ ] Redefine variants:
  - [ ] `default`: `.btn-primary` styling
  - [ ] `outline`: `.btn-outline` styling
  - [ ] `ghost`: Minimal with hover
- [ ] Focus: `ring-2 ring-black dark:ring-white ring-offset-2`
- [ ] Transitions: `transition-all duration-200`

#### 7.2 `Input` Component
- [ ] Border: `border-gray-300 dark:border-gray-700`
- [ ] Focus: `focus:ring-2 focus:ring-black dark:focus:ring-white`
- [ ] Height: Minimum `h-10`
- [ ] Typography: `text-body`

#### 7.3 `Card` Component
- [ ] Border: `border border-gray-300 dark:border-gray-700`
- [ ] Background: `bg-white dark:bg-gray-900`
- [ ] Hover: `hover:border-gray-900 dark:hover:border-gray-100`
- [ ] Padding: `p-6` or `p-8`
- [ ] Border radius: `rounded-lg`

#### 7.4 `Dialog` Component
- [ ] Overlay: Darker with backdrop blur
- [ ] Content: Match card styling
- [ ] Close button: Consistent with button styles
- [ ] Animations: Fade/slide

#### 7.5 `Select/Checkbox/Switch`
- [ ] Focus states: Match input
- [ ] Active states: Primary colors
- [ ] Sizing: Touch-friendly (min 44px)
- [ ] Typography: Match scale

#### 7.6 `Alert/Toast`
- [ ] Match card styling
- [ ] Variant colors (info, success, error, warning)
- [ ] Icons for hierarchy

#### 7.7 Testing
- [ ] Test all component variants
- [ ] Test in different contexts
- [ ] Test accessibility (keyboard navigation)
- [ ] Test dark mode

---

## PHASE 8: VRM Inspector Page (Complex)

**Goal**: Update VRM Inspector with new styling  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase 7 complete  
**Risk**: High (complex viewer component)

### Tasks

#### 8.1 Mobile Warning Overlay
- [ ] Background: `bg-cream/95 dark:bg-cream-dark/95 backdrop-blur-md`
- [ ] Card: Subtle border and shadow
- [ ] Icon: Consistent sizing
- [ ] Typography: Type scale

#### 8.2 Feature Cards (Mobile)
- [ ] Background: `bg-gray-50 dark:bg-gray-900`
- [ ] Border: Subtle
- [ ] Padding: `p-6`
- [ ] Icons: Consistent styling

#### 8.3 Desktop Viewer UI
- [ ] Review VRMInspector component
- [ ] Update control panels: Card styling
- [ ] Update buttons: Button variants
- [ ] Update info overlays: Glassmorphism

#### 8.4 Testing
- [ ] Test viewer functionality
- [ ] Test control interactions
- [ ] Test file upload
- [ ] Test mobile blocking
- [ ] Test performance

---

## PHASE 9: Gallery Page (Most Complex)

**Goal**: Update Gallery with new styling  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase 8 complete  
**Risk**: High (complex interactions)

### Tasks

#### 9.1 Layout Structure
- [ ] Background: `bg-cream dark:bg-cream-dark`
- [ ] Borders: Update to new gray scale

#### 9.2 Left Sidebar
- [ ] Search input:
  - [ ] Height: `h-12`
  - [ ] Border: New gray scale
  - [ ] Focus ring: Updated
- [ ] Avatar cards:
  - [ ] Selected: `bg-gray-900 dark:bg-gray-100` inverted text
  - [ ] Hover: `hover:bg-gray-50 dark:hover:bg-gray-800`
  - [ ] Border accent: `border-l-2 border-black dark:border-white`
- [ ] Buttons:
  - [ ] Use `.btn-outline` and `.btn-primary`
- [ ] Spacing: Increase padding

#### 9.3 Viewer Section
- [ ] Download button:
  - [ ] Style: `bg-white/90 dark:bg-gray-900/90 backdrop-blur-md`
  - [ ] Shadow: `shadow-lg`
- [ ] Metadata panel: Card styling

#### 9.4 Mobile Optimizations
- [ ] Full-width viewer
- [ ] Bottom sheet for avatar selection
- [ ] Touch-friendly controls

#### 9.5 Testing
- [ ] Test avatar selection
- [ ] Test viewer interactions
- [ ] Test download functionality
- [ ] Test search
- [ ] Test bulk operations
- [ ] Test mobile experience

---

## PHASE 10: Polish & Optimization

**Goal**: Final refinements and quality assurance  
**Estimated Time**: 4-6 hours  
**Dependencies**: All previous phases  
**Risk**: Low

### Tasks

#### 10.1 Page Transitions
- [ ] Add fade in on load
- [ ] Staggered animations for lists
- [ ] Smooth transitions between pages

#### 10.2 Loading States
- [ ] Consistent spinner styling
- [ ] Skeleton screens
- [ ] Progress indicators

#### 10.3 Interactive Feedback
- [ ] Verify all hover states
- [ ] Verify all active states
- [ ] Verify form validation feedback
- [ ] Verify async action loading states

#### 10.4 Responsive Refinement
- [ ] Test all breakpoints
- [ ] Typography scaling verification
- [ ] Touch target sizes (≥44px)
- [ ] Mobile viewer optimization

#### 10.5 Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Mobile Chrome

#### 10.6 Accessibility Audit
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Color contrast verification
- [ ] Focus indicators
- [ ] ARIA labels

#### 10.7 Performance Check
- [ ] Lighthouse audit (target: 90+)
- [ ] Core Web Vitals
- [ ] Font loading optimization
- [ ] Image optimization
- [ ] Bundle size analysis

---

## ✅ Progress Tracking

### Phase Completion Status

| Phase | Name | Status | Completion Date | Notes |
|-------|------|--------|-----------------|-------|
| 1 | Foundation | ✅ Complete | Jan 17, 2026 | Tailwind, CSS, Fonts configured |
| 2 | Navigation & Global | ✅ Complete | Jan 17, 2026 | Header, Footer, ThemeToggle updated |
| 3 | Home Page | ✅ Complete | Jan 17, 2026 | All sections transformed |
| 4 | About Page | ✅ Complete | Jan 17, 2026 | Typography & styling updated |
| 5 | Resources Page | ✅ Complete | Jan 17, 2026 | Cards & content styled |
| 6 | Admin Pages | ⏳ Pending | - | Lower priority - internal |
| 7 | UI Components | ✅ Complete | Jan 17, 2026 | Button component updated |
| 8 | VRM Inspector | ✅ Complete | Jan 17, 2026 | Full UI updated with 3D viewer |
| 9 | Gallery | ✅ Complete | Jan 17, 2026 | Sidebar & viewer updated |
| 10 | Polish | ✅ Complete | Jan 17, 2026 | All pages polished |

---

## 🎉 PROJECT COMPLETE!

All major phases of the visual upgrade have been successfully completed!

### Status Legend
- ⏳ Pending
- 🔄 In Progress
- ✅ Complete
- ⚠️ Blocked
- ❌ Issue

---

## 🧪 Testing Checklist

### Visual Consistency
- [ ] All pages use warm palette
- [ ] All typography follows scale
- [ ] All components match patterns
- [ ] Dark mode works on all pages

### Responsive Design
- [ ] Mobile (< 640px) tested
- [ ] Tablet (640-1024px) tested
- [ ] Desktop (1024px+) tested
- [ ] Large desktop (1280px+) tested

### Interactions
- [ ] All buttons have hover states
- [ ] All links have hover states
- [ ] All forms validate properly
- [ ] All modals/dialogs work
- [ ] All animations are smooth

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader friendly
- [ ] Touch targets ≥44px on mobile

### Performance
- [ ] Page load < 3s
- [ ] No layout shift (CLS < 0.1)
- [ ] No console errors
- [ ] Font loading optimized
- [ ] Images optimized

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

## 🔄 Rollback Plan

### If Major Issues Arise

#### Quick Rollback (per file)
```bash
git checkout HEAD~1 -- [file-path]
```

#### Phase Rollback
```bash
git revert [phase-commit-hash]
```

#### Full Rollback
```bash
git reset --hard [pre-upgrade-commit-hash]
```

### Backup Strategy
- Commit after each phase completion
- Tag stable versions: `git tag -a v1.0-pre-upgrade`
- Keep original CSS commented in files for reference

---

## 📝 Notes & Decisions

### Design Decisions Made
1. **Color Migration**: Gradual with fallbacks for safety
2. **Animation Intensity**: Subtle (200-300ms)
3. **Mobile Navigation**: Keep hamburger, enhance with animations
4. **Gallery Viewer**: Split view on desktop, full-screen on mobile
5. **Component Library**: Keep current Radix UI, update styling only

### Technical Decisions Made
1. **Font Loading**: Geist via npm package
2. **Dark Mode**: Keep class-based approach
3. **Internationalization**: Keep current structure
4. **Admin Interface**: Lower priority (internal tool)

### Open Questions
- None currently

---

## 🚀 Getting Started

### Prerequisites
- Geist fonts installed (✅ already in package.json)
- Git for version control
- Development server running

### First Steps
1. Create feature branch: `git checkout -b visual-upgrade`
2. Start with Phase 1 (Foundation)
3. Commit after each phase
4. Test thoroughly before moving to next phase

### Communication
- Update this document as work progresses
- Note any issues or blockers
- Track decisions and changes

---

**Last Updated**: January 17, 2026  
**Current Phase**: Phase 1 - Foundation  
**Next Milestone**: Complete Foundation Layer
