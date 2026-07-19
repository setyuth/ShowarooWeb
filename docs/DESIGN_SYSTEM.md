# DESIGN_SYSTEM.md

**Project:** Premium Entertainment Platform
**Version:** 1.0
**Status:** Design Standard
**Applies To:** All UI Components, Pages, and Interactions

---

# 1. Design Philosophy

## Vision

Create a modern entertainment platform that feels:

* Premium
* Elegant
* Fast
* Immersive
* Minimal
* Cinematic
* Accessible
* Responsive

The design should be **inspired by modern streaming platforms**, but remain an original product with its own visual identity.

---

# 2. Core Design Principles

Every interface should follow these principles:

* Simplicity before complexity.
* Content is the primary focus.
* Motion should support usability.
* Consistency across all pages.
* Accessibility is mandatory.
* Responsive by default.
* Performance is part of the design.

---

# 3. Design Tokens

## Colors

### Background

Primary Background

```
#090909
```

Secondary Background

```
#141414
```

Surface

```
#1C1C1C
```

Elevated Surface

```
#252525
```

Overlay

```
rgba(0,0,0,.65)
```

---

### Brand Colors

Primary

```
#E50914
```

Secondary

```
#1F80FF
```

Accent

```
#00C2FF
```

Success

```
#22C55E
```

Warning

```
#F59E0B
```

Danger

```
#EF4444
```

---

### Text

Primary

```
#FFFFFF
```

Secondary

```
#D1D5DB
```

Muted

```
#9CA3AF
```

Disabled

```
#6B7280
```

---

# 4. Typography

Use a clean, highly readable sans-serif font.

Scale:

* Display
* Heading 1
* Heading 2
* Heading 3
* Heading 4
* Body Large
* Body
* Small
* Caption

Rules:

* Line-height between 1.4 and 1.6 for body text.
* Limit line length for readability.
* Use consistent font weights.

---

# 5. Spacing System

Use an **8px spacing grid**.

Spacing tokens:

* 4px
* 8px
* 16px
* 24px
* 32px
* 40px
* 48px
* 64px
* 80px

Never use arbitrary spacing values unless justified.

---

# 6. Border Radius

Tokens:

* Small
* Medium
* Large
* Extra Large
* Pill
* Circular

Use consistent radius across all components.

---

# 7. Elevation

Define elevation levels:

* Level 0
* Level 1
* Level 2
* Level 3
* Level 4

Higher elevation should indicate greater visual importance.

---

# 8. Shadows

Use soft shadows only.

Avoid harsh or overly dark shadows.

Combine shadow with elevation consistently.

---

# 9. Buttons

Support:

* Primary
* Secondary
* Ghost
* Outline
* Icon
* Floating Action
* Destructive

States:

* Default
* Hover
* Focus
* Active
* Disabled
* Loading

Buttons should include smooth transitions and visible focus indicators.

---

# 10. Movie & TV Cards

Each card includes:

* Poster
* Rating
* Year
* Runtime
* Genres
* Favorite state
* Watch Later state
* Continue Watching progress (if applicable)

Interactions:

* Hover lift
* Slight scale
* Soft shadow
* Overlay actions
* Keyboard focus

---

# 11. Hero Banner

Requirements:

* Cinematic backdrop
* Gradient overlays
* Logo (when available)
* Title
* Metadata
* Description
* Primary actions
* Responsive layout

Ensure text remains readable on all backdrop images.

---

# 12. Navigation

Desktop:

* Sticky header
* Clear active states
* Search access
* Profile/settings area

Mobile:

* Bottom navigation or compact menu
* Touch-friendly targets
* Smooth transitions

---

# 13. Search Experience

Features:

* Live search
* Debounced input
* Highlighted matches
* Keyboard navigation
* Loading state
* Empty state
* Recent searches

Search should feel immediate and responsive.

---

# 14. Streaming Player UI

Display:

* Loading overlay
* Buffering indicator
* Current server badge
* Server selector
* Retry option
* Error state
* Playback status

Keep controls uncluttered and accessible.

---

# 15. Forms

Inputs should provide:

* Labels
* Placeholder text (optional)
* Validation feedback
* Error messages
* Focus styles

Avoid relying on placeholder text as the only label.

---

# 16. Modals

Support:

* Smooth opening/closing
* Background dimming
* Keyboard dismissal
* Focus trapping

---

# 17. Toast Notifications

Types:

* Success
* Error
* Warning
* Information

Non-blocking.

Auto-dismiss with pause on hover where appropriate.

---

# 18. Loading States

Every asynchronous operation should provide feedback.

Use:

* Skeleton loaders
* Spinners (only where appropriate)
* Progressive loading

Avoid blank screens.

---

# 19. Empty States

Every empty state should:

* Explain why it is empty.
* Suggest a next action.
* Maintain visual consistency.

---

# 20. Error States

Display:

* Friendly message
* Retry action
* Technical details only in debug mode

Never expose raw errors to end users.

---

# 21. Motion Design

Use subtle animations.

Recommended transitions:

* Fade
* Slide
* Scale
* Opacity
* Transform

Keep durations consistent.

Respect reduced-motion preferences.

---

# 22. Responsive Design

Support:

* Mobile
* Tablet
* Laptop
* Desktop
* Ultra-wide

Avoid fixed-width layouts.

Content should adapt gracefully.

---

# 23. Accessibility

Requirements:

* Keyboard navigation
* ARIA labels
* Visible focus
* Color contrast
* Reduced motion
* Semantic HTML

Accessibility is part of the design, not an afterthought.

---

# 24. Performance Guidelines

Design decisions should support performance.

Prefer:

* Lazy-loaded images
* Efficient animations
* Minimal layout shifts
* Optimized assets

Avoid unnecessary visual effects that impact rendering.

---

# 25. Component Standards

Every reusable component should define:

* Purpose
* Variants
* States
* Accessibility requirements
* Responsive behavior
* Dependencies
* Usage examples

No component should duplicate functionality already available elsewhere.

---

# 26. Design Review Checklist

Before approving any UI change, verify:

* Consistent spacing
* Correct typography
* Accessible color contrast
* Responsive layout
* Smooth interactions
* Keyboard accessibility
* Performance impact
* Reuse of existing components
* Alignment with the design system

---

# 27. Definition of Premium

A screen is considered "premium" only if it is:

* Clean and uncluttered
* Visually balanced
* Easy to navigate
* Responsive on all devices
* Accessible
* Fast
* Consistent with the design system
* Pleasant to interact with
* Free of distracting animations
* Focused on the content

Every new feature and page must follow this document unless a deliberate design update is made.
