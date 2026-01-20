# Restorae: Complete Product Specification

> **Version:** 1.0  
> **Last Updated:** January 20, 2026  
> **Status:** Ready for Development

---

## Table of Contents

1. [Vision](#vision)
2. [Target User](#target-user)
3. [Core Philosophy](#core-philosophy)
4. [UI/UX Design Philosophy](#uiux-design-philosophy)
5. [Onboarding Flow](#onboarding-flow)
6. [Screen Inventory](#screen-inventory)
7. [The Three Experiences](#the-three-experiences)
8. [The 6 Tools](#the-6-tools)
9. [Profile & Settings](#profile--settings)
10. [Complete Content Library](#complete-content-library)
11. [Subscription Model](#subscription-model)
12. [Technical Foundation](#technical-foundation)
13. [What Makes Restorae Different](#what-makes-restorae-different)
14. [Visual Assets & Imagery](#visual-assets--imagery)
15. [Success Metrics](#success-metrics)

---

## Vision

Restorae is a **premium wellness app for privacy-conscious busy young adults** who want a simple, beautiful way to start and end their days with intention—and access quick relief tools whenever stress hits.

**Not another meditation app.** Restorae is a **private daily ritual companion** that adapts to how you feel, never overwhelms with choices, and respects your time.

---

## Target User

| Attribute | Description |
|-----------|-------------|
| **Age** | 22-35 |
| **Profile** | Busy young professionals, students, creatives |
| **Pain** | Stressed, overwhelmed, no time for long meditation sessions |
| **Need** | Quick, effective tools that feel premium, not clinical |
| **Values** | Privacy, simplicity, aesthetics, results over features |
| **Anti-pattern** | Doesn't want another app tracking mood for AI analysis |

---

## Core Philosophy

| Principle | What It Means |
|-----------|---------------|
| **Max 3 choices** | Never overwhelm. Every screen has ≤3 options. |
| **Respects time** | Nothing over 7 minutes. Most tools under 3 minutes. |
| **Adapts to mood** | Morning/evening flows respond to how you feel. |
| **Private by default** | Encrypted journal. No cloud judgment. No AI watching. |
| **Premium feel** | Beautiful animations, haptics, sounds. Worth paying for. |
| **Complete day** | Morning opener → mid-day rescue → evening closer. |

---

## UI/UX Design Philosophy

> **Beauty and elegance is the highest priority.** Every pixel, every animation, every interaction must feel intentional, refined, and delightful.

### Design Priorities (Ranked)

| Priority | Principle | What It Means |
|----------|-----------|---------------|
| **#1** | **Beauty & Elegance** | The app must be visually stunning. First impression = "wow, this is beautiful" |
| **#2** | **Premium Feel** | Every detail signals quality. Worth paying for at first glance. |
| **#3** | **User Friendly** | Intuitive without tutorials. Grandmother-friendly. |
| **#4** | **Easy to Use** | Zero friction. Every action is obvious. |
| **#5** | **Responsive** | Instant feedback. No lag. Fluid 60fps. |
| **#6** | **Modern** | Current design trends, but timeless. Not trendy—elegant. |

---

### Interaction Constraints

- **No horizontal scrolling** anywhere in the app. All content must fit vertically or paginate.

### Visual Design Language

#### Color Philosophy

| Element | Approach |
|---------|----------|
| **Palette** | Warm, natural, calming. No harsh colors. |
| **Primary** | Emerald green (#047857) — growth, calm, nature |
| **Canvas** | Warm off-white (#FAFAF8) — soft, not clinical |
| **Dark Mode** | Deep charcoal (#18181B) — true dark, easy on eyes |
| **Accents** | Amber for warmth, Blue for calm, used sparingly |
| **Contrast** | WCAG AA compliant. Readable, not straining. |

#### Typography

| Element | Font | Usage |
|---------|------|-------|
| **Display** | Lora (Serif) | Hero text, quotes, special moments. Max 1 per screen. |
| **UI** | Plus Jakarta Sans | Everything else. Clean, warm, distinctive. |
| **Scale** | 1.25 ratio | Harmonious hierarchy |
| **Weights** | Regular, Medium, SemiBold, Bold | Clear distinction |

**Rule:** Serif is a "special occasion" font. If in doubt, use Sans.

#### Spacing & Layout

| Principle | Implementation |
|-----------|----------------|
| **Grid** | 8-point grid system |
| **Breathing room** | Generous whitespace. Let content breathe. |
| **Touch targets** | Minimum 44pt (WCAG 2.5.5) |
| **Margins** | 32px horizontal screen padding |
| **Cards** | 24px internal padding |
| **Hierarchy** | Clear visual levels. Never cluttered. |

---

### Motion & Animation

> **Animation is not decoration—it's communication.**

#### Animation Principles

| Principle | Implementation |
|-----------|----------------|
| **Purposeful** | Every animation has meaning. No gratuitous motion. |
| **Smooth** | 60fps always. Native driver. No jank. |
| **Quick** | 200-400ms for most transitions. Snappy, not slow. |
| **Eased** | Natural easing curves. Nothing linear. |
| **Respectful** | Honor "reduce motion" system setting. |

#### Signature Animations

| Element | Animation |
|---------|-----------|
| **Breathing Orb** | Smooth scale + opacity sync with breath timing |
| **Screen transitions** | Gentle fade + subtle slide. Never harsh cuts. |
| **Button press** | Subtle scale down (0.97) + haptic |
| **Card hover/press** | Lift shadow + subtle scale |
| **Success moments** | Gentle confetti or pulse. Celebrate, don't overwhelm. |
| **Loading** | Elegant shimmer, never spinner wheels |
| **Tab bar** | Smooth icon fill + label fade |

#### Micro-interactions

| Interaction | Feedback |
|-------------|----------|
| **Tap** | Immediate visual + haptic response |
| **Long press** | Progressive feedback, then action |
| **Swipe** | Follows finger precisely, rubberband at edges |
| **Scroll** | Smooth deceleration, momentum |
| **Pull to refresh** | Custom animation, not default |

---

### Haptic Feedback

> **Touch should feel alive.**

| Action | Haptic Type |
|--------|-------------|
| **Button tap** | Light impact |
| **Important action** | Medium impact |
| **Success** | Success notification |
| **Error** | Error notification |
| **Breathing inhale** | Soft pulse |
| **Breathing exhale** | Gentle release |
| **Timer tick** | Subtle rhythm |
| **Celebration** | Pattern of light taps |

---

### Sound Design

> **Audio is optional but delightful when enabled.**

| Element | Sound Character |
|---------|-----------------|
| **UI sounds** | Soft, organic, not digital beeps |
| **Breathing cues** | Gentle chimes or soft tones |
| **Completion** | Warm, satisfying tone |
| **Ambient** | High-quality, loopable, no harsh cuts |
| **Notifications** | Calm, not jarring. Never startling. |

**Rule:** Every sound should feel like it belongs in a spa, not a video game.

---

### Screen Composition

#### Visual Hierarchy

```
┌─────────────────────────────────────┐
│                                     │
│           [Status Bar]              │  ← Subtle, respects safe area
│                                     │
│   Primary Headline                  │  ← Largest, draws eye first
│   Supporting text that provides     │  ← Smaller, muted color
│   context without overwhelming.     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │     Main Content Area       │   │  ← Generous padding
│   │     (cards, tools, etc.)    │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │      Primary Action         │   │  ← Clear, prominent
│   └─────────────────────────────┘   │
│                                     │
│         [Tab Bar / Nav]             │  ← Clean, minimal
└─────────────────────────────────────┘
```

#### Screen States

Every screen must handle:

| State | Design |
|-------|--------|
| **Loading** | Elegant skeleton shimmer, not spinners |
| **Empty** | Beautiful illustration + helpful message |
| **Error** | Calm error state + clear recovery action |
| **Success** | Celebratory but not over-the-top |
| **Offline** | Graceful degradation + clear indicator |

---

### Component Design Standards

#### Buttons

| Type | Style |
|------|-------|
| **Primary** | Solid emerald, white text, rounded (12px), shadow |
| **Secondary** | Outlined, emerald border, transparent fill |
| **Ghost** | Text only, subtle hover state |
| **Destructive** | Red, used sparingly, requires confirmation |

```
Primary:    ┌──────────────────────┐
            │     Start Ritual     │  ← Bold, inviting
            └──────────────────────┘
            
Secondary:  ┌──────────────────────┐
            │      Learn More      │  ← Outlined, subtle
            └──────────────────────┘
```

#### Cards

| Property | Value |
|----------|-------|
| **Background** | Elevated surface color |
| **Border radius** | 16px |
| **Shadow** | Soft, 8% opacity, 8px blur |
| **Padding** | 24px |
| **Hover/Press** | Subtle lift + increased shadow |

```
┌─────────────────────────────────┐
│                                 │
│   Card Title                    │
│   Secondary information here    │
│                                 │
│   [Action]                      │
│                                 │
└─────────────────────────────────┘
    ↑ Soft shadow underneath
```

#### Input Fields

| Property | Value |
|----------|-------|
| **Border** | 1px subtle border |
| **Border radius** | 12px |
| **Padding** | 16px horizontal, 14px vertical |
| **Focus** | Emerald border + subtle glow |
| **Error** | Red border + error message below |
| **Placeholder** | Muted color, helpful text |

#### Icons

| Property | Standard |
|----------|----------|
| **Style** | Outlined, consistent stroke width |
| **Size** | 24px standard, 20px small, 32px large |
| **Color** | Inherits from context (ink, muted, accent) |
| **Touch area** | 44px minimum (with hitSlop if needed) |

---

### Theme System: Light & Dark Mode

> **Complete visual consistency across both themes. Every element, every screen, every state—designed twice.**

#### Core Principle

- Light and Dark modes are **equally important**
- Both are designed intentionally, not one derived from the other
- Every component, screen, and state must look premium in BOTH modes
- User preference OR system setting (user can override)

---

#### Complete Color Token System

Every color in the app uses semantic tokens, never hardcoded values.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **canvas** | #FAFAF8 | #18181B | Main background |
| **canvasElevated** | #FFFFFF | #27272A | Cards, elevated surfaces |
| **canvasDeep** | #F5F5F4 | #09090B | Inset backgrounds |
| **ink** | #1C1917 | #FAFAFA | Primary text |
| **inkMuted** | #57534E | #A1A1AA | Secondary text |
| **inkFaint** | #78716C | #71717A | Tertiary text, icons |
| **inkInverse** | #FFFFFF | #18181B | Text on accent colors |
| **accentPrimary** | #047857 | #34D399 | Primary actions, links |
| **accentWarm** | #B45309 | #FBBF24 | Warmth, energy |
| **accentCalm** | #1D4ED8 | #60A5FA | Calm, focus |
| **accentDanger** | #B91C1C | #F87171 | Errors, destructive |
| **border** | #D6D3D1 | #3F3F46 | Subtle borders |
| **borderStrong** | #A8A29E | #52525B | Emphasized borders |
| **surfaceSubtle** | #F5F5F4 | #27272A | Subtle backgrounds |
| **surfaceHover** | #E7E5E4 | #3F3F46 | Hover states |
| **shadow** | rgba(28,25,23,0.08) | rgba(0,0,0,0.3) | Soft shadows |
| **shadowStrong** | rgba(28,25,23,0.16) | rgba(0,0,0,0.5) | Strong shadows |
| **overlay** | rgba(28,25,23,0.50) | rgba(0,0,0,0.60) | Modal overlays |
| **success** | #047857 | #34D399 | Success states |
| **error** | #B91C1C | #F87171 | Error states |

---

#### Component Theming

Every component must be defined for both modes:

##### Buttons

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| **Primary bg** | #047857 | #34D399 |
| **Primary text** | #FFFFFF | #18181B |
| **Primary pressed** | #065F46 | #10B981 |
| **Secondary bg** | transparent | transparent |
| **Secondary border** | #047857 | #34D399 |
| **Secondary text** | #047857 | #34D399 |
| **Ghost text** | #57534E | #A1A1AA |
| **Disabled bg** | #E7E5E4 | #3F3F46 |
| **Disabled text** | #A8A29E | #71717A |

##### Cards

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| **Background** | #FFFFFF | #27272A |
| **Border** | #D6D3D1 (optional) | #3F3F46 (optional) |
| **Shadow** | 0 4px 12px rgba(28,25,23,0.08) | 0 4px 12px rgba(0,0,0,0.3) |
| **Pressed** | #F5F5F4 | #3F3F46 |

##### Input Fields

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| **Background** | #FFFFFF | #27272A |
| **Border** | #D6D3D1 | #3F3F46 |
| **Border focus** | #047857 | #34D399 |
| **Text** | #1C1917 | #FAFAFA |
| **Placeholder** | #A8A29E | #71717A |
| **Error border** | #B91C1C | #F87171 |

##### Navigation

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| **Tab bar bg** | #FFFFFF | #18181B |
| **Tab bar border** | #E7E5E4 | #27272A |
| **Active icon** | #047857 | #34D399 |
| **Inactive icon** | #A8A29E | #71717A |
| **Header bg** | #FAFAF8 | #18181B |

##### Modal & Sheets

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| **Overlay** | rgba(28,25,23,0.50) | rgba(0,0,0,0.70) |
| **Sheet bg** | #FFFFFF | #27272A |
| **Handle** | #D6D3D1 | #52525B |

---

#### Screen-Specific Theming

##### Morning Ritual

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | Warm gradient (cream to white) | Deep gradient (charcoal to black) |
| **Greeting text** | #1C1917 | #FAFAFA |
| **Mood icons bg** | #F5F5F4 | #27272A |
| **Selected mood** | #047857 border | #34D399 border |

##### Evening Wind-Down

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | Soft blue-gray gradient | Deep navy gradient |
| **Text** | #1C1917 | #FAFAFA |
| **Sleep-ready screen** | Dims to #F5F5F0 | Dims to #09090B |

##### Breathing Exercise

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | Subtle gradient | Deep dark gradient |
| **Orb gradient** | Emerald to teal | Bright emerald to cyan |
| **Orb glow** | rgba(4,120,87,0.3) | rgba(52,211,153,0.4) |
| **Phase text** | #1C1917 | #FAFAFA |
| **Timer** | #57534E | #A1A1AA |

##### Journal

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | #FAFAF8 | #18181B |
| **Entry card** | #FFFFFF | #27272A |
| **Entry text** | #1C1917 | #FAFAFA |
| **Date stamp** | #78716C | #71717A |
| **Search bar** | #F5F5F4 | #27272A |

##### SOS Mode

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | Calming blue gradient | Deep calming gradient |
| **Text** | #1C1917 | #FAFAFA |
| **Progress** | #047857 | #34D399 |

---

#### Gradient Definitions

##### Light Mode Gradients

| Gradient | Colors | Usage |
|----------|--------|-------|
| **Morning** | #FEF9EF → #FAFAF8 | Morning ritual background |
| **Evening** | #F5F5F4 → #E7E5E4 | Evening ritual background |
| **Calm** | #EFF6FF → #FAFAF8 | Breathing, grounding |
| **Card shine** | rgba(255,255,255,0.8) → transparent | Card highlight |
| **Overlay** | transparent → rgba(28,25,23,0.1) | Bottom fade |

##### Dark Mode Gradients

| Gradient | Colors | Usage |
|----------|--------|-------|
| **Morning** | #1E1E22 → #18181B | Morning ritual background |
| **Evening** | #0F1419 → #09090B | Evening ritual background |
| **Calm** | #0F172A → #18181B | Breathing, grounding |
| **Card shine** | rgba(255,255,255,0.05) → transparent | Card highlight |
| **Overlay** | transparent → rgba(0,0,0,0.3) | Bottom fade |

---

#### Animation Consistency

Animations must feel consistent in both modes:

| Animation | Light Mode | Dark Mode |
|-----------|------------|-----------|
| **Skeleton shimmer** | Light gray to white | Dark gray to lighter gray |
| **Success pulse** | Green glow | Brighter green glow |
| **Error shake** | Red tint | Brighter red tint |
| **Transition bg** | Fade through white | Fade through black |

---

#### Image & Illustration Handling

| Asset Type | Light Mode | Dark Mode |
|------------|------------|-----------|
| **Illustrations** | Full color, light bg | Adjusted palette, dark bg |
| **Photos** | Full brightness | 90% brightness |
| **Icons** | Inherit ink color | Inherit ink color |
| **Lottie animations** | Light variant | Dark variant (if available) |
| **Empty states** | Light background art | Dark background art |

**Rule:** Never show a light-mode illustration on dark background or vice versa.

---

#### Implementation Requirements

| Requirement | Details |
|-------------|---------|
| **Theme context** | Global ThemeProvider wrapping entire app |
| **useTheme hook** | Access current mode + colors anywhere |
| **No hardcoded colors** | Always use `colors.tokenName` |
| **System detection** | Detect system preference on first launch |
| **User override** | Allow manual toggle, persist preference |
| **Instant switch** | Theme changes apply immediately, no restart |
| **Transition** | Subtle 200ms fade when switching themes |
| **Testing** | Every screen tested in BOTH modes |
| **Screenshots** | App Store screenshots for BOTH modes |

---

#### Theme Toggle UX

| Aspect | Design |
|--------|--------|
| **Location** | Settings screen + quick toggle in header |
| **Options** | Light / Dark / System |
| **Default** | System |
| **Icon** | Sun (light) / Moon (dark) / Auto (system) |
| **Feedback** | Haptic + smooth transition |

```
Theme Setting:
┌─────────────────────────────────┐
│  Appearance                     │
│                                 │
│  ○ Light                  ☀️    │
│  ○ Dark                   🌙    │
│  ● System                 📱    │
│                                 │
└─────────────────────────────────┘
```

---

### Accessibility

> **Beautiful design is accessible design.**

| Requirement | Implementation |
|-------------|----------------|
| **Contrast** | WCAG AA minimum (4.5:1 for text) |
| **Touch targets** | 44pt minimum |
| **Screen readers** | Full VoiceOver/TalkBack support |
| **Reduce motion** | Respect system setting, provide alternatives |
| **Font scaling** | Support up to 200% system font size |
| **Color blindness** | Never rely on color alone |
| **Focus indicators** | Visible focus rings for keyboard users |

---

### Responsive Design

| Aspect | Implementation |
|--------|----------------|
| **Phone sizes** | 375px - 430px width optimized |
| **Small phones** | Graceful compression, nothing cut off |
| **Large phones** | Content doesn't float, uses space well |
| **Orientation** | Portrait primary, landscape functional |
| **Safe areas** | Respect notch, home indicator, status bar |
| **Keyboard** | Smooth avoidance, never hides inputs |

---

### Premium Touches

These details separate "good" from "premium":

| Detail | Implementation |
|--------|----------------|
| **Gradient backgrounds** | Subtle, natural gradients on key screens |
| **Glass effects** | Frosted glass on overlays and sheets |
| **Custom icons** | Unique icon set, not generic library |
| **Animated illustrations** | Lottie animations for empty states, celebrations |
| **Texture** | Subtle noise/grain overlay for depth (optional) |
| **Parallax** | Subtle depth on scroll |
| **Spring physics** | Natural bounce on gestures |
| **Sound design** | Custom audio, not stock sounds |
| **Loading quality** | Progressive image loading with blur-up |

---

### What Premium Does NOT Mean

| Avoid | Why |
|-------|-----|
| **Excessive animation** | Distracting, feels unserious |
| **Gradient overload** | Looks cheap, dated |
| **Too many colors** | Confusing, not elegant |
| **Tiny text** | Not accessible, not user-friendly |
| **Hidden navigation** | Frustrating, not intuitive |
| **Slow transitions** | Feels sluggish, wastes time |
| **Autoplay sounds** | Jarring, disrespectful |
| **Complex gestures** | Learning curve, not easy |

---

### Design Reference

Apps that embody the aesthetic we're targeting:

| App | What to Learn |
|-----|---------------|
| **Linear** | Clean, fast, professional |
| **Notion** | Elegant typography, whitespace |
| **Calm** | Calming colors, beautiful imagery |
| **Apple Health** | Clear hierarchy, modern iOS feel |
| **Stripe** | Premium feel, attention to detail |
| **Mercury** | Banking that feels luxurious |

**Restorae aesthetic = Calm's serenity + Linear's precision + Apple's polish**

---

## Onboarding Flow

> **First impressions define everything.** The onboarding must feel as premium as the app itself.

### Onboarding Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Show, don't tell** | Beautiful visuals, minimal text |
| **3 key messages max** | Don't overwhelm |
| **Premium feel** | First impression sets expectations |
| **Quick** | Get to the app fast (< 60 seconds total) |
| **Skippable** | Respect returning users |

### The 3 Key Messages

| # | Message | Why It Matters |
|---|---------|----------------|
| 1 | **Quick daily rituals** | "I don't have time" objection handled |
| 2 | **Adapts to how you feel** | Not one-size-fits-all |
| 3 | **Private by design** | Trust, no judgment, no AI watching |

---

### Screen 1: Splash (1-2 sec)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│            [Restorae Logo]          │
│                                     │
│              restorae               │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

- Logo animation (subtle fade in + scale)
- App name appears below
- Transitions automatically

---

### Screen 2: Welcome — "Your Daily Calm"

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│        [Beautiful Illustration]     │
│         Person at peace, sunrise    │
│         Soft gradient background    │
│                                     │
│                                     │
│       Start your day with calm.     │
│       End it with peace.            │
│                                     │
│       Morning and evening rituals   │
│       that take just 5 minutes.     │
│                                     │
│                                     │
│     ●  ○  ○                         │
│                                     │
│     [Continue]                      │
│                                     │
│     Skip                            │
└─────────────────────────────────────┘
```

**Key message:** Quick daily rituals (5 minutes)

**Visual:** Serene morning/evening scene, warm colors

---

### Screen 3: "It Adapts to You"

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│        [Animated Illustration]      │
│         3 mood faces morphing       │
│         → different paths shown     │
│                                     │
│                                     │
│       Feeling anxious?              │
│       We'll help you ground.        │
│                                     │
│       Feeling low?                  │
│       We'll help you rise.          │
│                                     │
│       Restorae adapts to how        │
│       you actually feel.            │
│                                     │
│     ○  ●  ○                         │
│                                     │
│     [Continue]                      │
│                                     │
│     Skip                            │
└─────────────────────────────────────┘
```

**Key message:** Adapts to your mood (not generic)

**Visual:** Animated mood icons → branching paths

---

### Screen 4: "Private by Design"

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│        [Illustration]               │
│         Lock/shield icon            │
│         Soft, reassuring            │
│                                     │
│                                     │
│       Your thoughts stay yours.     │
│                                     │
│       ✓ Encrypted journal           │
│       ✓ No cloud tracking           │
│       ✓ No AI reading your words    │
│                                     │
│       Just you and your practice.   │
│                                     │
│     ○  ○  ●                         │
│                                     │
│     [Get Started]                   │
│                                     │
│     Skip                            │
└─────────────────────────────────────┘
```

**Key message:** Private, no judgment, no surveillance

**Visual:** Shield/lock with warmth (not cold security)

---

### Screen 5: Sign Up / Log In

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            restorae                 │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │    Continue with Apple          ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │    Continue with Google         ││
│  └─────────────────────────────────┘│
│                                     │
│  ───────── or ─────────             │
│                                     │
│  ┌─────────────────────────────────┐│
│  │    Continue with Email          ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
│  Already have an account? Log in    │
│                                     │
│                                     │
│  By continuing, you agree to our    │
│  Terms of Service and Privacy Policy│
└─────────────────────────────────────┘
```

**Options:**
- Apple Sign In (iOS priority)
- Google Sign In
- Email/Password

---

### Screen 6: Name Entry

```
┌─────────────────────────────────────┐
│                                     │
│  ←                                  │
│                                     │
│                                     │
│                                     │
│       What should we call you?      │
│                                     │
│       We'll use this to greet you   │
│       each morning and evening.     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Sarah                           ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │          Continue               ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Why:** Enables "Good morning, Sarah" personalization

---

### Screen 7: Morning Reminder Setup

```
┌─────────────────────────────────────┐
│                                     │
│  ←                                  │
│                                     │
│        [Sunrise Illustration]       │
│                                     │
│                                     │
│       When do you wake up?          │
│                                     │
│       We'll send a gentle reminder  │
│       to start your morning ritual. │
│                                     │
│       ┌─────────────────────┐       │
│       │      7:00 AM        │       │
│       │    [Time Picker]    │       │
│       └─────────────────────┘       │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │          Continue               ││
│  └─────────────────────────────────┘│
│                                     │
│       Skip for now                  │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 8: Evening Reminder Setup

```
┌─────────────────────────────────────┐
│                                     │
│  ←                                  │
│                                     │
│        [Moonrise Illustration]      │
│                                     │
│                                     │
│       When do you wind down?        │
│                                     │
│       We'll remind you to close     │
│       your day with intention.      │
│                                     │
│       ┌─────────────────────┐       │
│       │      9:00 PM        │       │
│       │    [Time Picker]    │       │
│       └─────────────────────┘       │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │          Continue               ││
│  └─────────────────────────────────┘│
│                                     │
│       Skip for now                  │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 9: Notification Permission

```
┌─────────────────────────────────────┐
│                                     │
│  ←                                  │
│                                     │
│        [Bell Illustration]          │
│         Friendly, not pushy         │
│                                     │
│                                     │
│       Stay on track                 │
│                                     │
│       Gentle reminders help you     │
│       build a lasting practice.     │
│                                     │
│       • Morning ritual reminder     │
│       • Evening wind-down           │
│       • Streak encouragement        │
│                                     │
│       (You can change these anytime │
│        in settings)                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │      Enable Notifications       ││
│  └─────────────────────────────────┘│
│                                     │
│       Maybe Later                   │
│                                     │
└─────────────────────────────────────┘
```

**Note:** If they tap "Enable," show iOS/Android system prompt

---

### Screen 10: Premium Intro (Soft Paywall)

```
┌─────────────────────────────────────┐
│                                     │
│                                  ✕  │
│                                     │
│        ✨ Unlock Restorae ✨         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  Free:                          ││
│  │  • Morning & evening rituals    ││
│  │  • 3 breathing patterns         ││
│  │  • 2 grounding techniques       ││
│  │  • 5 journal entries            ││
│  │                                 ││
│  │  Premium:                       ││
│  │  ✓ All 112 experiences          ││
│  │  ✓ Unlimited journal            ││
│  │  ✓ SOS Mode for tough moments   ││
│  │  ✓ 10 ambient soundscapes       ││
│  │  ✓ Personalized encouragement   ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  Start Free Trial — 7 days      ││
│  └─────────────────────────────────┘│
│                                     │
│  $6.99/month or $49.99/year         │
│                                     │
│       Continue with Free            │
│                                     │
└─────────────────────────────────────┘
```

**Key points:**
- Can be dismissed (X button)
- Shows value clearly (Free vs Premium)
- "Continue with Free" option prominent
- No pressure, no dark patterns

---

### Screen 11: Ready! (Celebration)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│        [Celebration Animation]      │
│         Confetti or gentle pulse    │
│                                     │
│                                     │
│       You're all set, Sarah!        │
│                                     │
│       Let's begin your first        │
│       morning ritual.               │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │      Start Morning Ritual       ││
│  └─────────────────────────────────┘│
│                                     │
│       Explore on my own             │
│                                     │
└─────────────────────────────────────┘
```

**Two paths:**
1. Start guided morning ritual (recommended)
2. Go to home and explore freely

---

### Onboarding Summary

| Screen | Purpose | Duration |
|--------|---------|----------|
| 1. Splash | Branding | 1-2 sec |
| 2. Daily Calm | Quick rituals value | ~5 sec |
| 3. Adapts to You | Personalization value | ~5 sec |
| 4. Private by Design | Trust/privacy value | ~5 sec |
| 5. Sign Up | Account creation | User pace |
| 6. Name Entry | Personalization setup | ~5 sec |
| 7. Morning Time | Reminder setup | ~5 sec |
| 8. Evening Time | Reminder setup | ~5 sec |
| 9. Notifications | Permission request | ~5 sec |
| 10. Premium Intro | Soft paywall | User pace |
| 11. Ready | Celebration + start | ~3 sec |

**Total onboarding: ~45-60 seconds** (excluding sign-up time)

---

### Key Features Highlighted

| Feature | Where Highlighted | How |
|---------|-------------------|-----|
| **5-minute rituals** | Screen 2 | "just 5 minutes" |
| **Morning + Evening** | Screen 2 | "Start your day... End it" |
| **Mood adaptation** | Screen 3 | "Adapts to how you feel" |
| **Not one-size-fits-all** | Screen 3 | Anxious → ground, Low → rise |
| **Encrypted journal** | Screen 4 | Checkmark list |
| **No cloud tracking** | Screen 4 | Checkmark list |
| **No AI** | Screen 4 | Checkmark list |
| **Personalized greetings** | Screen 6 | "Good morning, Sarah" |
| **Reminders** | Screens 7-9 | Time pickers |
| **112 experiences** | Screen 10 | Premium benefits |
| **SOS Mode** | Screen 10 | Premium benefit |
| **Free option** | Screen 10 | No pressure |

---

## Screen Inventory

> **76 unique screens** covering the complete Restorae experience.

### Onboarding (11 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Splash | App logo, brief loading |
| 2 | Welcome 1 | "Daily calm" — Value prop |
| 3 | Welcome 2 | "Adapts to you" — Feature |
| 4 | Welcome 3 | "Private by design" — Trust |
| 5 | Sign Up | Email/password or social auth |
| 6 | Name Entry | "What should we call you?" |
| 7 | Morning Time | Reminder setup |
| 8 | Evening Time | Reminder setup |
| 9 | Notifications | Permission request |
| 10 | Premium Intro | Optional paywall (can skip) |
| 11 | Ready | Celebration + start |

### Main Tab Screens (4 screens)

| # | Screen | Tab | Purpose |
|---|--------|-----|---------|
| 12 | Home | Home | Dashboard, start ritual, quick stats |
| 13 | Tools Grid | Tools | 6 tools in grid layout |
| 14 | Journal Home | Journal | List of entries, new entry button |
| 15 | Profile | Profile | Stats, settings link |

### Morning Ritual Flow (5 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 16 | Morning Greeting | "Good morning, [Name]" + mood selection |
| 17 | Morning Options | 3 contextual options based on mood |
| 18 | Morning Breathing | Guided breathing with orb |
| 19 | Morning Intention | Set intention for the day |
| 20 | Morning Complete | Personalized encouragement, exit |

### Evening Ritual Flow (5 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 21 | Evening Check-in | "How was today?" + mood selection |
| 22 | Evening Options | 3 contextual options based on mood |
| 23 | Evening Exercise | Chosen micro-exercise |
| 24 | Evening Release | "One thing to let go of" (optional text) |
| 25 | Evening Complete | "Rest well" + sleep-ready dim screen |

### Tool 1: Breathe (3 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 26 | Breathe Selection | Grid of 15 breathing patterns |
| 27 | Breathe Session | Active breathing with orb animation |
| 28 | Breathe Complete | Session done, stats, encouragement |

### Tool 2: Ground (3 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 29 | Ground Selection | Grid of 12 grounding techniques |
| 30 | Ground Session | Guided grounding exercise |
| 31 | Ground Complete | Session done, encouragement |

### Tool 3: Reset (3 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 32 | Reset Selection | Grid of 14 body exercises |
| 33 | Reset Session | Guided body exercise |
| 34 | Reset Complete | Session done, encouragement |

### Tool 4: Focus (4 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 35 | Focus Selection | Grid of 12 focus sessions |
| 36 | Focus Setup | Choose ambient sound, set intention |
| 37 | Focus Session | Timer running, minimal UI |
| 38 | Focus Complete | Session done, what you accomplished |

### Tool 5: Journal (4 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 39 | Journal Home | List of entries (same as tab) |
| 40 | Journal New Entry | Write new entry, optional prompt |
| 41 | Journal Entry View | Read a past entry |
| 42 | Journal Entry Edit | Edit existing entry |

### Tool 6: SOS Mode (3 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 43 | SOS Selection | 8 emergency presets |
| 44 | SOS Session | Guided crisis sequence (4 phases) |
| 45 | SOS Complete | "You did it. You're okay." |

### Situational Guides (2 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 46 | Situations Selection | 10 situational guides |
| 47 | Situation Session | Guided sequence for that situation |

### Profile & Settings (14 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 48 | Profile | Stats, streaks, settings link |
| 49 | Edit Profile | Change name, avatar, email |
| 50 | Settings | Main settings menu |
| 51 | Appearance | Light / Dark / System |
| 52 | Notifications | Morning/evening reminders, times |
| 53 | Journal Lock | None / Face ID / Touch ID / Passcode |
| 54 | Export Data | Download your data |
| 55 | Delete Data Confirm | Type "DELETE" to confirm |
| 56 | Subscription Status | Current plan, manage |
| 57 | Help Center | FAQ, guides |
| 58 | Contact Us | Email form or link |
| 59 | Terms of Service | Legal text |
| 60 | Privacy Policy | Privacy text |
| 61 | Licenses | Open source credits |

### Subscription / Paywall (3 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 62 | Paywall | Premium benefits, pricing, subscribe |
| 63 | Purchase Success | Welcome to Premium |
| 64 | Restore Success | Purchases restored |

### Authentication (5 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 65 | Sign Up | Create account |
| 66 | Log In | Sign in |
| 67 | Forgot Password | Request reset |
| 68 | Reset Password | Enter new password |
| 69 | Verify Email | Check your email message |

### Utility / System (6 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 70 | Loading | Skeleton/shimmer while loading |
| 71 | Error | Something went wrong |
| 72 | Offline | No internet connection |
| 73 | Empty State (Journal) | No entries yet |
| 74 | Empty State (Tools) | First time using tools |
| 75 | Biometric Unlock | Face ID / Touch ID prompt for journal |

### Modals (2 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 76 | Sound Picker | 10 ambient sounds to choose from |
| 77 | Journal Prompt Picker | 15 prompts to choose from |

---

### Screen Count Summary

| Category | Count |
|----------|-------|
| Onboarding | 11 |
| Main Tabs | 4 |
| Morning Ritual | 5 |
| Evening Ritual | 5 |
| Tool: Breathe | 3 |
| Tool: Ground | 3 |
| Tool: Reset | 3 |
| Tool: Focus | 4 |
| Tool: Journal | 4 |
| Tool: SOS | 3 |
| Situational Guides | 2 |
| Profile & Settings | 14 |
| Subscription | 3 |
| Authentication | 5 |
| Utility / System | 6 |
| Modals | 2 |
| **TOTAL** | **77 screens** |

---

## Profile & Settings

> **Settings should feel as premium as the rest of the app.** Not an afterthought.

### Profile Screen

The Profile screen is the user's personal space—their progress, their preferences, their identity in the app.

#### Layout

```
┌─────────────────────────────────────┐
│                                     │
│         [Profile Avatar]            │  ← Optional photo or initial
│            Sarah                    │  ← Name
│       Member since Jan 2026         │  ← Subtle, not prominent
│                                     │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐
│   │   42    │  │   12    │  │    7    │
│   │  Days   │  │ Current │  │ Longest │
│   │ Active  │  │ Streak  │  │ Streak  │
│   └─────────┘  └─────────┘  └─────────┘
│                                     │
├─────────────────────────────────────┤
│                                     │
│   This Week                         │
│   ████████░░░░░░  5 of 7 days       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   [Settings]                    →   │
│   [Manage Subscription]         →   │
│   [Help & Support]              →   │
│                                     │
└─────────────────────────────────────┘
```

#### Profile Elements

| Element | Description |
|---------|-------------|
| **Avatar** | Optional photo upload OR auto-generated initial |
| **Name** | User's display name (editable) |
| **Member since** | Subtle join date |
| **Days Active** | Total days with at least 1 session |
| **Current Streak** | Consecutive days |
| **Longest Streak** | Personal best |
| **This Week** | Visual progress bar (M-T-W-T-F-S-S) |

---

### Settings Screen

Clean, organized, comprehensive.

#### Layout

```
┌─────────────────────────────────────┐
│  Settings                           │
├─────────────────────────────────────┤
│                                     │
│  ACCOUNT                            │
│  ┌─────────────────────────────────┐│
│  │ Edit Profile                  → ││
│  │ Email                         → ││
│  │ Change Password               → ││
│  └─────────────────────────────────┘│
│                                     │
│  PREFERENCES                        │
│  ┌─────────────────────────────────┐│
│  │ Appearance          System    → ││
│  │ Notifications                 → ││
│  │ Sounds              On       🔘 ││
│  │ Haptics             On       🔘 ││
│  └─────────────────────────────────┘│
│                                     │
│  PRIVACY & SECURITY                 │
│  ┌─────────────────────────────────┐│
│  │ Journal Lock        Face ID   → ││
│  │ Export My Data                → ││
│  │ Delete All Data               → ││
│  └─────────────────────────────────┘│
│                                     │
│  SUBSCRIPTION                       │
│  ┌─────────────────────────────────┐│
│  │ Current Plan       Premium    → ││
│  │ Manage Subscription           → ││
│  │ Restore Purchases             → ││
│  └─────────────────────────────────┘│
│                                     │
│  SUPPORT                            │
│  ┌─────────────────────────────────┐│
│  │ Help Center                   → ││
│  │ Contact Us                    → ││
│  │ Rate Restorae                 → ││
│  └─────────────────────────────────┘│
│                                     │
│  ABOUT                              │
│  ┌─────────────────────────────────┐│
│  │ Version                  1.0.0 ││
│  │ Terms of Service              → ││
│  │ Privacy Policy                → ││
│  │ Licenses                      → ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Sign Out                ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

### Settings Sections Detailed

#### Account

| Setting | Description |
|---------|-------------|
| **Edit Profile** | Change name, avatar |
| **Email** | View/change email address |
| **Change Password** | Update password (if email auth) |

#### Preferences

| Setting | Options | Default |
|---------|---------|---------|
| **Appearance** | Light / Dark / System | System |
| **Notifications** | → Opens notification settings | — |
| **Sounds** | Toggle on/off | On |
| **Haptics** | Toggle on/off | On |

##### Appearance Sub-screen

```
┌─────────────────────────────────────┐
│  ← Appearance                       │
├─────────────────────────────────────┤
│                                     │
│  Choose your theme                  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  ☀️  Light                    ○ ││
│  ├─────────────────────────────────┤│
│  │  🌙  Dark                     ○ ││
│  ├─────────────────────────────────┤│
│  │  📱  System                   ● ││
│  └─────────────────────────────────┘│
│                                     │
│  Matches your device settings       │
│                                     │
└─────────────────────────────────────┘
```

##### Notifications Sub-screen

```
┌─────────────────────────────────────┐
│  ← Notifications                    │
├─────────────────────────────────────┤
│                                     │
│  REMINDERS                          │
│  ┌─────────────────────────────────┐│
│  │ Morning Reminder     On      🔘 ││
│  │ Time                   7:00 AM → ││
│  ├─────────────────────────────────┤│
│  │ Evening Reminder     On      🔘 ││
│  │ Time                   9:00 PM → ││
│  └─────────────────────────────────┘│
│                                     │
│  GENERAL                            │
│  ┌─────────────────────────────────┐│
│  │ Streak Reminders     On      🔘 ││
│  │ Weekly Summary       On      🔘 ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

#### Privacy & Security

| Setting | Description |
|---------|-------------|
| **Journal Lock** | None / Face ID / Touch ID / Passcode |
| **Export My Data** | Download all data as encrypted file |
| **Delete All Data** | Permanently delete everything (requires confirmation) |

##### Journal Lock Sub-screen

```
┌─────────────────────────────────────┐
│  ← Journal Lock                     │
├─────────────────────────────────────┤
│                                     │
│  Protect your private journal       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  🔓  No Lock                  ○ ││
│  ├─────────────────────────────────┤│
│  │  👤  Face ID                  ● ││
│  ├─────────────────────────────────┤│
│  │  👆  Touch ID                 ○ ││
│  ├─────────────────────────────────┤│
│  │  🔢  Passcode                 ○ ││
│  └─────────────────────────────────┘│
│                                     │
│  Your journal is always encrypted.  │
│  This adds an extra layer of        │
│  protection when opening it.        │
│                                     │
└─────────────────────────────────────┘
```

##### Delete All Data Confirmation

```
┌─────────────────────────────────────┐
│                                     │
│         ⚠️ Delete All Data          │
│                                     │
│  This will permanently delete:      │
│                                     │
│  • All journal entries              │
│  • Your progress and streaks        │
│  • All preferences                  │
│                                     │
│  This cannot be undone.             │
│                                     │
│  Type "DELETE" to confirm:          │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │      Delete Everything          ││  ← Red, destructive
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │          Cancel                 ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

#### Subscription

| Setting | Description |
|---------|-------------|
| **Current Plan** | Shows Free or Premium |
| **Manage Subscription** | Opens App Store subscription management |
| **Restore Purchases** | Restore if reinstalling app |

##### Subscription Status (Premium)

```
┌─────────────────────────────────────┐
│  ← Subscription                     │
├─────────────────────────────────────┤
│                                     │
│        ✨ Premium Member ✨          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  You have access to all         ││
│  │  112 experiences, unlimited     ││
│  │  journal entries, and SOS Mode. ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  Plan: Yearly ($49.99/year)         │
│  Renews: January 20, 2027           │
│                                     │
│  ┌─────────────────────────────────┐│
│  │     Manage Subscription         ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

##### Subscription Status (Free)

```
┌─────────────────────────────────────┐
│  ← Subscription                     │
├─────────────────────────────────────┤
│                                     │
│           Free Plan                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  Upgrade to Premium for:        ││
│  │                                 ││
│  │  ✓ All 112 experiences          ││
│  │  ✓ Unlimited journal entries    ││
│  │  ✓ SOS Mode                     ││
│  │  ✓ All ambient sounds           ││
│  │  ✓ Personalized encouragement   ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  Upgrade — $6.99/month          ││  ← Primary button
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  Yearly — $49.99/year (Save 40%)││  ← Secondary
│  └─────────────────────────────────┘│
│                                     │
│  Restore Purchases                  │
│                                     │
└─────────────────────────────────────┘
```

#### Support

| Setting | Description |
|---------|-------------|
| **Help Center** | FAQ and guides |
| **Contact Us** | Email support |
| **Rate Restorae** | Opens App Store review |

#### About

| Setting | Description |
|---------|-------------|
| **Version** | Current app version |
| **Terms of Service** | Legal terms |
| **Privacy Policy** | Privacy documentation |
| **Licenses** | Open source acknowledgments |

---

### Edit Profile Screen

```
┌─────────────────────────────────────┐
│  ← Edit Profile              Save   │
├─────────────────────────────────────┤
│                                     │
│         ┌───────────┐               │
│         │           │               │
│         │   Photo   │               │
│         │           │               │
│         └───────────┘               │
│        Change Photo                 │
│                                     │
│  Name                               │
│  ┌─────────────────────────────────┐│
│  │ Sarah                           ││
│  └─────────────────────────────────┘│
│                                     │
│  Email                              │
│  ┌─────────────────────────────────┐│
│  │ sarah@example.com               ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

### Navigation Structure

The app has a bottom tab bar with 4 tabs:

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           [Screen Content]          │
│                                     │
│                                     │
├─────────────────────────────────────┤
│   Home    Tools    Journal   Profile│
│    🏠       🛠️       📓        👤    │
└─────────────────────────────────────┘
```

| Tab | Screen | Description |
|-----|--------|-------------|
| **Home** | Morning/Evening flows, dashboard | Main experience |
| **Tools** | 6 tools grid | Quick access |
| **Journal** | Private journal | Encrypted entries |
| **Profile** | Profile + Settings | User space |

---

## The Three Experiences

### 1. Morning Ritual (5-7 min)

*Start the day with intention*

#### Flow

```
Screen 1: "Good morning, [Name]"
         → How are you feeling? (3 mood icons)

Screen 2: Based on mood selection
         → "I see. Here's what might help." (3 contextual options)
         
Screen 3: Quick breathing exercise (60-90 sec)
         → Beautiful animated orb guides you

Screen 4: Set your intention
         → Tap to choose from 3 suggestions OR write your own

Screen 5: Personalized encouragement + beautiful exit
         → "You've got this. Day 12."
```

#### 8 Morning Ritual Variations

| # | Name | Focus | Duration |
|---|------|-------|----------|
| 1 | Energized Morning | High energy, motivation | 5 min |
| 2 | Calm Morning | Gentle, peaceful start | 7 min |
| 3 | Focused Morning | Intention-heavy | 5 min |
| 4 | Grateful Morning | Gratitude-centered | 5 min |
| 5 | Quick Morning | Minimal but effective | 3 min |
| 6 | Anxious Morning | Extra grounding | 7 min |
| 7 | Low Energy Morning | Gentle activation | 5 min |
| 8 | Big Day Morning | Confidence + focus | 7 min |

#### Personalization (after 7 days)

- Learns your patterns: "You always pick Focus—you're building momentum"
- Mood improvement recognition: "You know how to lift yourself"
- Streak acknowledgment: "Day 12. You're becoming unstoppable."

---

### 2. Evening Wind-Down (5-7 min)

*Close the day with release*

#### Flow

```
Screen 1: "How was today?"
         → 3 icons: Tough / Mixed / Good

Screen 2: Based on answer
         → Tough: "Let's release that" (body scan / venting / breathing)
         → Mixed: "Let's find the good" (gratitude / small win / let go)
         → Good: "Let's capture this" (gratitude / celebrate / reflect)

Screen 3: Chosen micro-exercise (2-3 min)

Screen 4: "One thing to let go of before sleep" (optional text)

Screen 5: "Rest well. Tomorrow is yours."
         → Screen dims, sleep-ready
```

#### 8 Evening Ritual Variations

| # | Name | Focus | Duration |
|---|------|-------|----------|
| 1 | Standard Wind-Down | Review + release | 5 min |
| 2 | After Hard Day | Extra compassion | 7 min |
| 3 | After Good Day | Celebrate + gratitude | 5 min |
| 4 | Anxious Evening | Calming sequence | 7 min |
| 5 | Can't Stop Thinking | Brain dump + release | 7 min |
| 6 | Quick Close | Minimal but complete | 3 min |
| 7 | Sunday Reset | Week reflection | 10 min |
| 8 | Before Sleep | Sleep-optimized | 5 min |

---

### 3. Mid-Day Toolkit (On-demand, 1-5 min)

*Quick relief when stress hits*

When someone opens the app mid-day, they need help NOW—no ritual, just tools.

#### Home Screen Layout

```
┌─────────────┬─────────────┐
│   Breathe   │   Ground    │
│ (15 patterns) (12 techniques)
├─────────────┼─────────────┤
│   Reset     │   Focus     │
│ (14 exercises) (12 sessions)
├─────────────┼─────────────┤
│   Journal   │  SOS Mode   │
│ (15 prompts)   (8 presets)
└─────────────┴─────────────┘
```

---

## The 6 Tools

### Tool 1: Breathe (15 Patterns)

| # | Pattern | Rhythm | Duration | Best For |
|---|---------|--------|----------|----------|
| 1 | Box Breathing | 4-4-4-4 | 90s | Focus, reset |
| 2 | 4-7-8 Calm | 4-7-8 | 2 min | Anxiety, sleep |
| 3 | Energizing Breath | Quick bursts | 60s | Low energy |
| 4 | Slow Wave | 4-8 exhale | 3 min | Deep calm |
| 5 | Heart Coherence | 5-5 | 2 min | Emotional balance |
| 6 | Breath Hold | Inhale-hold-release | 90s | Panic interrupt |
| 7 | Ocean Breath | Wave rhythm | 3 min | Meditation prep |
| 8 | Triangle Breath | 4-4-4 | 90s | Simple reset |
| 9 | Extended Exhale | 4-6-8 | 2 min | Nervous system calm |
| 10 | Morning Rise | Energizing progression | 2 min | Wake up |
| 11 | Sleep Descent | Slowing progression | 4 min | Before bed |
| 12 | Stress Release | Sighing exhales | 90s | Acute stress |
| 13 | Focus Sharpener | Rhythmic holds | 2 min | Pre-task |
| 14 | Anger Cool-Down | Long exhales | 2 min | Frustration |
| 15 | Confidence Builder | Power breathing | 90s | Before challenges |

**UX:** Tap "Breathe" → See 15 cards in scrollable grid → Pick one → Beautiful animated orb guides timing with haptic feedback

---

### Tool 2: Ground (12 Techniques)

| # | Technique | How It Works | Duration | Best For |
|---|-----------|--------------|----------|----------|
| 1 | 5-4-3-2-1 Senses | Name what you see, hear, touch, smell, taste | 2 min | Spiraling, dissociation |
| 2 | Body Anchor | Feel feet on floor, seat, hands | 90s | Quick reset |
| 3 | Cold Reset | Splash face / hold ice guidance | 60s | Intense anxiety |
| 4 | Object Focus | Describe one object in complete detail | 2 min | Racing thoughts |
| 5 | Room Scan | Name colors, shapes around you | 90s | Overwhelm |
| 6 | Touch Points | Press fingertips together, feel pressure | 60s | Subtle grounding |
| 7 | Texture Hunt | Find 5 different textures nearby | 2 min | Anchoring |
| 8 | Sound Mapping | Identify 5 sounds near and far | 90s | Awareness |
| 9 | Temperature Awareness | Notice warm/cool spots on body | 90s | Body connection |
| 10 | Gravity Drop | Feel weight sinking into chair/floor | 2 min | Deep grounding |
| 11 | Peripheral Vision | Expand awareness to edges of vision | 90s | Tunnel vision |
| 12 | Counting Anchors | Count 10 blue things, 10 sounds... | 3 min | Distraction |

**UX:** Tap "Ground" → See 12 cards → Pick one → Gentle voice/text guides you through

---

### Tool 3: Reset (14 Body Exercises)

| # | Exercise | Target Area | Duration | Best For |
|---|----------|-------------|----------|----------|
| 1 | Jaw Release | Jaw, face muscles | 90s | Stress, teeth grinding |
| 2 | Shoulder Drop | Shoulders, upper back | 2 min | Desk workers |
| 3 | Hand Shake Out | Hands, arms, nervous energy | 60s | Quick energy shift |
| 4 | Full Body Scan | Head to toe awareness | 4 min | Complete reset |
| 5 | Eye Palming | Eye strain, visual rest | 90s | Screen fatigue |
| 6 | Neck Rolls | Neck tension | 2 min | Tension headaches |
| 7 | Forehead Smooth | Forehead, brow relaxation | 60s | Concentration strain |
| 8 | Chest Opener | Chest, posture | 90s | Hunched posture |
| 9 | Hip Circles | Lower back, hips | 2 min | Sitting all day |
| 10 | Ankle Rotations | Feet, circulation | 60s | Stagnation |
| 11 | Spine Twist | Back tension, mobility | 2 min | Stiffness |
| 12 | Wrist Circles | Wrist strain | 60s | Typing fatigue |
| 13 | Face Massage | Full face relaxation | 2 min | Complete facial release |
| 14 | Progressive Muscle | Tense-release full body | 5 min | Deep relaxation |

**UX:** Tap "Reset" → See body outline or 14 cards → Pick area/exercise → Guided with optional gentle narration

---

### Tool 4: Focus (12 Sessions + 10 Ambient Sounds)

#### Focus Sessions

| # | Session | Purpose | Duration |
|---|---------|---------|----------|
| 1 | Power Start | Deep work intention setting | 25 min |
| 2 | Quick Sprint | Focused burst for tasks you're avoiding | 15 min |
| 3 | Clarity Pause | Think before acting/deciding | 5 min |
| 4 | Creative Flow | Ambient sound, no timer pressure | Open |
| 5 | Meeting Prep | Center yourself before calls | 3 min |
| 6 | End of Day Close | Review what you did, release work | 5 min |
| 7 | Morning Intention | Set the day's primary focus | 5 min |
| 8 | Decision Space | Weigh options calmly | 10 min |
| 9 | Study Mode | Learning and retention focus | 25 min |
| 10 | Writing Flow | Writer's focus environment | 25 min |
| 11 | Problem Solving | Structured thinking space | 15 min |
| 12 | Micro Focus | 5-minute burst for quick task | 5 min |

#### Ambient Soundscapes

| # | Sound | Vibe |
|---|-------|------|
| 1 | Gentle Rain | Calm, focus |
| 2 | Coffee Shop | Background energy |
| 3 | Forest Morning | Nature, peace |
| 4 | Ocean Waves | Rhythm, vastness |
| 5 | White Noise | Pure focus |
| 6 | Night Crickets | Evening calm |
| 7 | Thunderstorm | Cozy, dramatic |
| 8 | Fireplace | Warmth, comfort |
| 9 | Wind Through Trees | Gentle movement |
| 10 | Library Ambience | Quiet productivity |

**UX:** Tap "Focus" → Choose session type → Pick ambient sound (or silence) → Set intention → Timer starts with beautiful minimal UI

---

### Tool 5: Journal (Private Encrypted Vault)

A completely private, encrypted journal. No analysis. No patterns. No AI. Just your thoughts, protected.

#### Features

| Feature | Description |
|---------|-------------|
| **Daily Entry** | Open, write, save. Date-stamped automatically. |
| **Past Entries** | Scroll through your history by date |
| **Search** | Find entries by keyword (searches locally, decrypted on-device) |
| **Biometric Lock** | Optional Face ID / fingerprint to open journal |
| **Export** | Download your entries as encrypted file (for backup) |
| **Delete** | Permanently remove entries |

#### 15 Optional Prompts

User can start with a blank page OR tap "Give me a prompt":

| # | Prompt |
|---|--------|
| 1 | What's on your mind? |
| 2 | How are you really feeling today? |
| 3 | What happened today worth remembering? |
| 4 | What are you grateful for? |
| 5 | What's one thing you learned today? |
| 6 | What's weighing on you? |
| 7 | What made you smile today? |
| 8 | What do you need to let go of? |
| 9 | What are you looking forward to? |
| 10 | Describe today in three words. |
| 11 | What would make tomorrow better? |
| 12 | Write a letter to yourself. |
| 13 | What's something you're proud of? |
| 14 | What's a challenge you're facing? |
| 15 | Free write—no rules, just write. |

#### UX Flow

```
Journal Home:
┌─────────────────────────────────┐
│  📓 Journal                     │
│                                 │
│  [+ New Entry]                  │
│                                 │
│  ─────────────────────────────  │
│  Today                          │
│  Jan 20, 2026 · "Feeling good..." │
│                                 │
│  Yesterday                      │
│  Jan 19, 2026 · "Work was rough..." │
│                                 │
│  Jan 18, 2026 · "Finally took..."  │
│  ...                            │
└─────────────────────────────────┘

New Entry:
┌─────────────────────────────────┐
│  Jan 20, 2026                   │
│  ─────────────────────────────  │
│                                 │
│  [Blank writing area]           │
│                                 │
│                                 │
│                                 │
│  ─────────────────────────────  │
│  [Give me a prompt]    [Save]   │
└─────────────────────────────────┘
```

#### Privacy

- **AES-256-GCM encryption** — Military-grade
- **PBKDF2 key derivation** — 210,000 iterations
- **Local storage only** — Nothing leaves your device
- **No cloud sync** — Your words stay yours
- **No analytics** — We don't read, track, or analyze
- **Optional biometric** — Extra layer of protection

---

### Tool 6: SOS Mode (8 Emergency Presets)

For acute distress—guided sequences that work fast.

| # | Preset | Sequence | Duration |
|---|--------|----------|----------|
| 1 | Panic Attack | Slow breathing → Grounding → Reassurance → Next step | 4 min |
| 2 | Overwhelm | Pause → Simplify → One thing at a time | 3 min |
| 3 | Sadness Wave | Gentle breathing → Self-compassion → Allow feeling | 4 min |
| 4 | Anger Surge | Physical release → Cool-down breathing → Perspective | 3 min |
| 5 | Anxiety Spiral | Interrupt → Ground → Reality check → Breathe | 4 min |
| 6 | Can't Sleep | Body scan → Slow breathing → Release thoughts | 5 min |
| 7 | Social Anxiety | Confidence breathing → Grounding → "You belong here" | 3 min |
| 8 | Before Difficult Conversation | Center → Set intention → Confidence | 3 min |

#### Each SOS preset has 4 phases:

1. **Interrupt** — "You're safe. Let's slow down." + immediate breathing
2. **Ground** — Automatic grounding technique
3. **Reassure** — Calm statements, soft visuals
4. **Next Step** — "What's one small thing you can do right now?"

**UX:** Tap "SOS" → See 8 presets → Tap one → Guided sequence starts immediately (no setup, no choices during crisis)

---

### Situational Guides (10 Specific Moments)

For when you know exactly what situation you're facing:

| # | Situation | What It Does | Duration |
|---|-----------|--------------|----------|
| 1 | Before a Job Interview | Confidence breathing + calm + focus | 5 min |
| 2 | After a Rejection | Self-compassion + perspective + next step | 5 min |
| 3 | Stuck on a Problem | Mental reset + fresh perspective prompt | 5 min |
| 4 | Feeling Lonely | Connection to self + self-worth | 5 min |
| 5 | Imposter Syndrome | Reality check + confidence building | 4 min |
| 6 | Procrastinating | Gentle activation + just start | 3 min |
| 7 | After an Argument | Cool-down + perspective + repair intention | 5 min |
| 8 | Comparison Spiral | Gratitude + your own path focus | 4 min |
| 9 | Burnout Warning | Pause + boundaries + self-care prompt | 5 min |
| 10 | Celebrating Alone | Self-acknowledgment + savor the win | 3 min |

---

## Complete Content Library

| Category | Count |
|----------|-------|
| Breathe Patterns | 15 |
| Ground Techniques | 12 |
| Reset Exercises | 14 |
| Focus Sessions | 12 |
| Ambient Sounds | 10 |
| Journal Prompts | 15 |
| SOS Presets | 8 |
| Morning Rituals | 8 |
| Evening Rituals | 8 |
| Situational Guides | 10 |
| **TOTAL** | **112 distinct experiences** |

---

## Subscription Model

### Free Tier

- Morning & Evening flows (basic, non-personalized)
- 3 breathing patterns (Box, 4-7-8, Triangle)
- 2 grounding techniques (5-4-3-2-1, Body Anchor)
- Basic journal (5 entries max)
- Limited to 2 sessions/day

### Premium — $6.99/month or $49.99/year

- **All 112 experiences unlocked**
- **Personalized encouragement** that learns your patterns
- **SOS Mode** (all 8 presets)
- **Unlimited encrypted journal**
- **All ambient sounds**
- **Premium haptics & sounds**
- **Unlimited daily use**
- **Situational guides**
- **Export journal backup**

---

## Technical Foundation

### Stack

| Technology | Purpose |
|------------|---------|
| React Native / Expo SDK 54 | Cross-platform mobile |
| TypeScript | Type safety |
| React Navigation 7 | Navigation |
| Expo AV | Audio/sounds |
| Expo Haptics | Haptic feedback |
| Lottie | Animations |
| @noble/ciphers | AES-256-GCM encryption |
| expo-secure-store | Biometric auth |

### Design System

| Element | Specification |
|---------|---------------|
| **Colors** | Warm canvas (#FAFAF8), emerald accent (#047857), WCAG AA compliant |
| **Typography** | Plus Jakarta Sans (UI), Lora (display), 1.25 ratio scale |
| **Spacing** | 8-point grid |
| **Animations** | 60fps, respects reduced motion |

### Privacy Architecture

| Feature | Implementation |
|---------|----------------|
| **Encryption** | AES-256-GCM |
| **Key Derivation** | PBKDF2, 210,000 iterations |
| **Storage** | Local only, no cloud |
| **Analytics** | None on personal content |
| **Biometric** | Optional Face ID / Touch ID |

---

## What Makes Restorae Different

| Competitor | Their Approach | Restorae's Difference |
|------------|---------------|----------------------|
| Calm | Long meditations, celebrity voices | Quick tools, respects your time |
| Headspace | Gamified courses, progression | No courses, just daily rituals |
| Finch | Pet care metaphor, younger audience | Premium adult aesthetic |
| Balance | AI personalization | Privacy-first, no AI |
| Generic apps | Feature overload | Max 3 choices, never overwhelmed |

**Restorae's edge:** Clean, premium, private, fast. For adults who don't have time for another app that requires commitment.

---

## Visual Assets & Imagery

> **Premium imagery is non-negotiable.** Every photo, illustration, and animation must feel high-end.

### Asset Categories

| Category | Count | Purpose |
|----------|-------|---------|
| Onboarding Illustrations | 5 | Welcome flow, value props |
| Empty State Illustrations | 6 | Journal, tools, first use |
| Background Images | 8 | Ritual screens, ambient |
| Tool Icons | 6 | Grid navigation |
| Mood Icons | 6 | Morning/evening selection |
| Lottie Animations | 12 | Breathing orb, celebrations, loading |
| Ambient Sound Artwork | 10 | Sound picker thumbnails |
| App Store Screenshots | 10 | Marketing (5 light, 5 dark) |

---

### Onboarding Illustrations (5)

| Screen | Description | Recommended Source | Style |
|--------|-------------|-------------------|-------|
| **Welcome 1** | Person at peace, sunrise/morning light | [Unsplash - Sage Friedman](https://unsplash.com/photos/HS5CLnQbCOc) | Warm, golden hour, meditation pose |
| **Welcome 2** | Abstract mood paths, branching | Custom illustration needed | Minimal line art, soft gradients |
| **Welcome 3** | Shield/lock with soft glow | Custom illustration needed | Warm, friendly security (not cold) |
| **Morning Setup** | Sunrise over mountains/water | [Unsplash - Simon Berger](https://unsplash.com/photos/aZjw7xI3QAA) | Soft orange/pink gradient sky |
| **Evening Setup** | Moonrise, calm night scene | [Unsplash - Fabian Oelkers](https://unsplash.com/photos/jLjfAWwHdB8) | Deep blue, peaceful |

---

### Ritual Background Images (8)

| Screen | Description | Recommended Source | Mood |
|--------|-------------|-------------------|------|
| **Morning Greeting** | Soft dawn light, warm | [Unsplash - Johannes Plenio](https://unsplash.com/photos/RwHv7LgeC7s) | Hopeful, fresh |
| **Morning Complete** | Golden rays, success | [Unsplash - David Monje](https://unsplash.com/photos/QtF_1d4BTKU) | Accomplished, bright |
| **Evening Check-in** | Dusk, settling sun | [Unsplash - Dominik Schröder](https://unsplash.com/photos/FIKD9t5_5zQ) | Reflective, calm |
| **Evening Complete** | Stars, peaceful night | [Unsplash - Nathan Anderson](https://unsplash.com/photos/L95xDkSSuWw) | Restful, serene |
| **Breathing Session** | Abstract calm (blur/bokeh) | [Unsplash - Jr Korpa](https://unsplash.com/photos/9XngoIpxcEo) | Hypnotic, focused |
| **Ground Session** | Nature close-up (leaves/water) | [Unsplash - David Clode](https://unsplash.com/photos/d0CasEMHDQs) | Grounded, present |
| **Focus Session** | Minimal workspace/zen | [Unsplash - Bench Accounting](https://unsplash.com/photos/nvzvOPQW0gc) | Clean, productive |
| **SOS Session** | Soft blue calm | [Unsplash - Pawel Czerwinski](https://unsplash.com/photos/6lQDFGOB1iw) | Soothing, safe |

---

### Empty State Illustrations (6)

| Screen | Description | Recommended Style |
|--------|-------------|-------------------|
| **Journal Empty** | Person writing in notebook | Minimal line illustration, warm tones |
| **First Morning** | Sun peeking over horizon | Soft gradient, welcoming |
| **First Evening** | Moon with gentle clouds | Peaceful, encouraging |
| **Tools First Use** | Toolkit/compass metaphor | Clean iconography |
| **No Connection** | Cloud with gentle X | Friendly, not alarming |
| **Error State** | Abstract tangle untangling | Hopeful, "we'll fix this" |

**Recommended Illustration Sources:**
- [Blush.design](https://blush.design/) — Customizable illustrations
- [Storyset](https://storyset.com/) — Free animated illustrations
- [DrawKit](https://drawkit.com/) — Wellness-themed packs
- [Humaaans](https://humaaans.com/) — Customizable people

---

### Ambient Sound Artwork (10)

| Sound | Image Description | Source Suggestion |
|-------|-------------------|-------------------|
| **Gentle Rain** | Rain on window, soft blur | [Unsplash - Valentin Müller](https://unsplash.com/photos/bWtd1ZyEy6w) |
| **Coffee Shop** | Cozy café interior | [Unsplash - Nathan Dumlao](https://unsplash.com/photos/KixfBEdyp64) |
| **Forest Morning** | Misty forest, light rays | [Unsplash - Sebastian Unrau](https://unsplash.com/photos/sp-p7uuT0tw) |
| **Ocean Waves** | Waves on shore, aerial | [Unsplash - Matt Hardy](https://unsplash.com/photos/6ArTTluciuA) |
| **White Noise** | Abstract static texture | Custom gradient/pattern |
| **Night Crickets** | Meadow at twilight | [Unsplash - Federico Respini](https://unsplash.com/photos/sYffw0LNr7s) |
| **Thunderstorm** | Lightning over landscape | [Unsplash - Max LaRochelle](https://unsplash.com/photos/QzP1GcDOSC8) |
| **Fireplace** | Warm hearth, close-up | [Unsplash - Alisa Anton](https://unsplash.com/photos/GoaeoX9P5W0) |
| **Wind Trees** | Trees swaying, soft focus | [Unsplash - veeterzy](https://unsplash.com/photos/sMQiL_2v4vs) |
| **Library** | Elegant library interior | [Unsplash - Priscilla Du Preez](https://unsplash.com/photos/XkKCui44iM0) |

---

### Lottie Animations (12)

| Animation | Description | Recommended Source |
|-----------|-------------|-------------------|
| **Breathing Orb** | Pulsating circle with gradient | Custom (critical, must be perfect) |
| **Loading Shimmer** | Elegant skeleton loading | [LottieFiles - Skeleton](https://lottiefiles.com/search?q=skeleton) |
| **Success Confetti** | Gentle celebration | [LottieFiles - Confetti](https://lottiefiles.com/search?q=confetti+minimal) |
| **Checkmark** | Smooth check completion | [LottieFiles - Check](https://lottiefiles.com/search?q=checkmark) |
| **Streak Fire** | Subtle flame for streaks | [LottieFiles - Flame](https://lottiefiles.com/search?q=flame+minimal) |
| **Heart Pulse** | For gratitude moments | [LottieFiles - Heart](https://lottiefiles.com/search?q=heart+pulse) |
| **Moon/Stars** | Evening transition | Custom or [LottieFiles - Night](https://lottiefiles.com/search?q=moon+stars) |
| **Sun Rise** | Morning transition | Custom or [LottieFiles - Sun](https://lottiefiles.com/search?q=sunrise) |
| **Meditation Person** | Subtle breathing figure | [LottieFiles - Meditation](https://lottiefiles.com/search?q=meditation) |
| **Sound Waves** | Audio visualization | [LottieFiles - Audio](https://lottiefiles.com/search?q=sound+wave) |
| **Timer** | Circular countdown | [LottieFiles - Timer](https://lottiefiles.com/search?q=timer+circular) |
| **Refresh** | Pull to refresh | [LottieFiles - Refresh](https://lottiefiles.com/search?q=refresh) |

---

### Mood Icons (6)

Custom icons needed for morning/evening mood selection:

| Mood | Light Mode | Dark Mode | Style |
|------|------------|-----------|-------|
| **Energized** | ☀️ Bright sun | Glowing sun | Warm yellow/orange |
| **Calm** | 🌊 Gentle wave | Soft wave | Soft blue |
| **Anxious** | 🌀 Spiral | Spiral | Muted, not alarming |
| **Low/Tired** | 🌧️ Cloud | Cloud | Soft gray-blue |
| **Good** | 😊 Gentle smile | Gentle smile | Warm, not cartoon |
| **Tough** | 💨 Wind/stress | Wind | Desaturated |

**Style notes:**
- NOT emoji — custom illustrated
- Soft, rounded, premium feel
- Works on both light and dark backgrounds
- Subtle animation on tap (optional)

---

### Tool Icons (6)

| Tool | Icon Concept | Style |
|------|--------------|-------|
| **Breathe** | Wind/air flow | Flowing lines |
| **Ground** | Root/earth | Grounded, stable |
| **Reset** | Body/stretch | Figure outline |
| **Focus** | Target/circle | Minimal, centered |
| **Journal** | Book/pen | Classic, elegant |
| **SOS** | Shield/heart | Protective, warm |

**Recommended icon style:**
- Outlined, not filled
- 2px consistent stroke
- Rounded caps and joins
- Works at 24px and 32px
- Custom designed for brand consistency

---

### Premium Photo Guidelines

| Guideline | Requirement |
|-----------|-------------|
| **Resolution** | Minimum 2x device resolution (750x1624 for iPhone) |
| **Style** | Natural, warm, not stock-looking |
| **People** | Diverse, authentic, not posed |
| **Colors** | Align with brand palette (warm, emerald accents) |
| **Editing** | Consistent color grading across all images |
| **License** | Commercial use allowed (Unsplash, purchased, or custom) |

---

### Image Processing Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Light/Dark variants** | Every image needs both versions |
| **Blur variants** | Background images need blurred versions for overlay text |
| **Compressed** | WebP format, optimized for mobile |
| **Progressive loading** | Low-res placeholder → high-res |
| **Caching** | Aggressive caching for offline use |

---

### Asset File Structure

```
assets/
├── images/
│   ├── onboarding/
│   │   ├── welcome-1-light.webp
│   │   ├── welcome-1-dark.webp
│   │   ├── welcome-2-light.webp
│   │   └── ...
│   ├── backgrounds/
│   │   ├── morning-greeting-light.webp
│   │   ├── morning-greeting-dark.webp
│   │   └── ...
│   ├── sounds/
│   │   ├── rain-thumb.webp
│   │   ├── forest-thumb.webp
│   │   └── ...
│   └── empty-states/
│       ├── journal-empty-light.webp
│       └── ...
├── animations/
│   ├── breathing-orb.json
│   ├── success-confetti.json
│   ├── loading-shimmer.json
│   └── ...
├── icons/
│   ├── tools/
│   │   ├── breathe.svg
│   │   ├── ground.svg
│   │   └── ...
│   └── moods/
│       ├── energized.svg
│       ├── calm.svg
│       └── ...
└── sounds/
    ├── ambient/
    │   ├── rain.mp3
    │   ├── forest.mp3
    │   └── ...
    └── ui/
        ├── tap.mp3
        ├── success.mp3
        └── ...
```

---

### Recommended Premium Asset Sources

| Source | Type | License | Cost |
|--------|------|---------|------|
| [Unsplash](https://unsplash.com) | Photography | Free commercial | Free |
| [Pexels](https://pexels.com) | Photography | Free commercial | Free |
| [Shutterstock](https://shutterstock.com) | Photography | Paid license | $$ |
| [LottieFiles](https://lottiefiles.com) | Animations | Free/Premium | Free-$$ |
| [Blush.design](https://blush.design) | Illustrations | Free/Premium | Free-$ |
| [Storyset](https://storyset.com) | Illustrations | Free | Free |
| [IconJar](https://iconjar.com) | Icons | Paid | $ |
| [Feather Icons](https://feathericons.com) | Icons | MIT License | Free |
| [Noun Project](https://thenounproject.com) | Icons | Free/Premium | Free-$ |
| [Freesound](https://freesound.org) | Sound FX | CC License | Free |
| [Artlist](https://artlist.io) | Sound/Music | Subscription | $$ |
| [Epidemic Sound](https://epidemicsound.com) | Ambient | Subscription | $$ |

---

### Custom Asset Requirements

These assets **must be custom designed** for brand consistency:

| Asset | Priority | Reason |
|-------|----------|--------|
| **App Logo** | Critical | Brand identity |
| **Breathing Orb** | Critical | Signature interaction |
| **Mood Icons** | High | Unique brand feel |
| **Tool Icons** | High | Navigation consistency |
| **Empty State Illustrations** | Medium | Brand cohesion |
| **Welcome Flow Illustrations** | Medium | First impression |

---

## Success Metrics

**Goal: 10,000 daily active users**

| Metric | Target |
|--------|--------|
| Morning ritual completion | >70% |
| Evening ritual completion | >50% |
| Mid-day tool usage | 2+ per user/week |
| Premium conversion | 8-12% |
| Day 7 retention | >40% |
| Day 30 retention | >25% |

---

## Summary

Restorae is:

- **112 distinct wellness experiences**
- **3 daily touchpoints** (morning, mid-day, evening)
- **Max 3 choices per screen**
- **Private by default**
- **Premium aesthetic**
- **Built for busy adults who need quick, effective help**

**Not a meditation app. Not a mood tracker. A private daily ritual companion that adapts to how you feel.**

---

*Ready for development.*
