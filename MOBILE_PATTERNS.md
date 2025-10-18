# Mobile-First Design Patterns Reference

Quick reference guide for building mobile-first components in the Halloween app.

---

## 📏 **Sizing Patterns**

### Text Sizing (Mobile → Desktop)
```tsx
// Headings
className="text-xl sm:text-2xl lg:text-3xl"  // Large heading
className="text-lg sm:text-xl lg:text-2xl"   // Medium heading
className="text-base sm:text-lg lg:text-xl"  // Small heading

// Body text
className="text-sm sm:text-base"             // Normal text
className="text-xs sm:text-sm"               // Small text
className="text-[10px] sm:text-xs"           // Tiny text (labels)
```

### Spacing (Mobile → Desktop)
```tsx
// Padding
className="p-3 sm:p-4 lg:p-6"                // Container padding
className="px-3 py-2 sm:px-4 sm:py-2.5"     // Button padding
className="p-4 pt-0 sm:p-6"                  // Content padding (no top)

// Gaps
className="gap-2 sm:gap-3 lg:gap-4"         // Flex/grid gaps
className="space-y-3 sm:space-y-4"          // Vertical spacing
```

### Element Sizing
```tsx
// Avatars
className="h-10 w-10 sm:h-12 sm:w-12"       // Profile avatar
className="h-12 w-12 sm:h-14 sm:w-14"       // Larger avatar

// Icons
className="h-5 w-5 sm:h-6 sm:w-6"           // Icon size
className="text-base sm:text-lg"            // Emoji size
```

---

## 👆 **Touch Targets**

### Minimum Sizes
```tsx
// Buttons
className="min-h-[44px] min-w-[44px]"       // iOS compliant
className="h-10 px-4 min-w-[44px]"          // Default button
className="h-10 w-10 min-h-[44px] min-w-[44px]"  // Icon button

// Interactive elements
className="p-3 min-h-[44px]"                // Touch-friendly padding
className="py-2.5 px-3 min-h-[44px]"        // Badge/pill button
```

### Touch Feedback
```tsx
// Active states (visual feedback on tap)
className="active:scale-95"                  // Slight shrink
className="active:scale-[0.98]"              // Very subtle shrink
className="active:bg-accent"                 // Background change

// Always add touch manipulation
className="touch-manipulation"               // Removes 300ms delay
```

---

## 📱 **Layout Patterns**

### Container Patterns
```tsx
// Page container
<div className="min-h-screen p-4 sm:p-6 lg:p-8">
  {/* Content */}
</div>

// Max-width container
<div className="max-w-md mx-auto px-4 sm:px-6">
  {/* Centered content */}
</div>

// Full-width mobile, constrained desktop
<div className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
  {/* Responsive width */}
</div>
```

### Grid Patterns
```tsx
// Responsive columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"

// Card grid
className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3"

// Auto-fit grid
className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3"
```

### Flex Patterns
```tsx
// Stack on mobile, row on desktop
className="flex flex-col sm:flex-row gap-3 sm:gap-4"

// Centered content
className="flex items-center justify-center min-h-screen"

// Space between with wrap
className="flex flex-wrap items-center justify-between gap-2"
```

---

## 🎨 **Component Patterns**

### Card Pattern
```tsx
<Card className="overflow-hidden">
  <CardHeader className="p-4 sm:p-6">
    <CardTitle className="text-lg sm:text-2xl">
      Title
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4 sm:p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Button Pattern
```tsx
<Button 
  size="default" 
  className="w-full sm:w-auto touch-manipulation"
>
  Click Me
</Button>

// With icon
<Button 
  size="icon" 
  className="min-h-[44px] min-w-[44px]"
>
  <Icon className="h-5 w-5" />
</Button>
```

### Input Pattern
```tsx
<div className="space-y-2">
  <label className="text-sm sm:text-base font-medium">
    Label
  </label>
  <Input 
    type="text"
    placeholder="Enter text..."
    className="h-10 text-base"  // Prevents iOS zoom
  />
</div>
```

### Sheet (Bottom Sheet) Pattern
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent 
    side="bottom" 
    className="h-[90vh] rounded-t-xl"
  >
    <SheetHeader className="p-4 sm:p-6">
      <SheetTitle className="text-lg sm:text-xl">
        Title
      </SheetTitle>
    </SheetHeader>
    <div className="overflow-y-auto p-4 sm:p-6">
      {/* Scrollable content */}
    </div>
  </SheetContent>
</Sheet>
```

---

## 🖼️ **Image Patterns**

### Responsive Image
```tsx
<div className="relative aspect-square w-full">
  <Image
    src={url}
    alt="Description"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    loading="lazy"  // or "eager" for above-fold
  />
</div>
```

### Avatar Pattern
```tsx
<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
  <AvatarImage src={url} alt={name} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
```

---

## 📝 **Text Patterns**

### Truncation
```tsx
// Single line
className="truncate"

// Multi-line (requires custom CSS)
className="line-clamp-2"  // 2 lines
className="line-clamp-3"  // 3 lines

// Ellipsis with min-width protection
<div className="flex-1 min-w-0">
  <p className="truncate">Long text...</p>
</div>
```

### Text Hierarchy
```tsx
// Page title
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">

// Section title  
<h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">

// Card title
<h3 className="text-lg sm:text-xl font-semibold">

// Body text
<p className="text-sm sm:text-base text-muted-foreground">

// Caption
<span className="text-xs sm:text-sm text-muted-foreground">
```

---

## 🎭 **State Patterns**

### Loading State
```tsx
<LoadingState 
  variant="spinner" 
  size="md" 
  message="Loading..."
  className="min-h-[200px]"
/>

// Skeleton for cards
<LoadingState 
  variant="skeleton"
  className="w-full"
/>
```

### Error State
```tsx
<ErrorState
  error={error}
  retry={() => refetch()}
  variant="page"
  recoverable={true}
  className="min-h-[400px]"
/>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center min-h-[300px] p-4 text-center">
  <div className="text-4xl sm:text-6xl mb-4">🎃</div>
  <h3 className="text-lg sm:text-xl font-semibold mb-2">
    No costumes yet
  </h3>
  <p className="text-sm sm:text-base text-muted-foreground mb-4">
    Be the first to register!
  </p>
  <Button>Register Now</Button>
</div>
```

---

## 🔐 **Safe Area Patterns**

### With Notch Support
```tsx
// Top (status bar)
className="pt-4 safe-area-inset-top"

// Bottom (home indicator)
className="pb-4 safe-area-inset-bottom"

// Full screen with safe areas
<div className="fixed inset-0 safe-area-inset-top safe-area-inset-bottom">
  {/* Content */}
</div>
```

---

## ⚡ **Performance Patterns**

### Lazy Loading
```tsx
// Images below fold
<Image loading="lazy" {...props} />

// Images above fold
<Image loading="eager" priority {...props} />
```

### Touch Optimization
```tsx
// Always add to interactive elements
className="touch-manipulation"

// Smooth scrolling
className="overflow-y-auto scroll-smooth-mobile"

// Prevent text size adjustment on rotate
className="text-size-adjust-none"
```

---

## 🎯 **Common Combinations**

### Interactive Card
```tsx
<Card 
  className="overflow-hidden cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] touch-manipulation"
  onClick={handleClick}
>
  {/* Content */}
</Card>
```

### Mobile Modal/Overlay
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
  <Card className="w-full max-w-md p-4 sm:p-6">
    {/* Modal content */}
  </Card>
</div>
```

### Sticky Header
```tsx
<header className="sticky top-0 z-40 bg-background/95 backdrop-blur safe-area-inset-top border-b">
  <div className="container flex h-14 sm:h-16 items-center px-4 sm:px-6">
    {/* Header content */}
  </div>
</header>
```

### Full-screen Form
```tsx
<div className="min-h-screen flex flex-col safe-area-inset-bottom">
  <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
    <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
      {/* Form fields */}
    </div>
  </main>
  <footer className="sticky bottom-0 p-4 sm:p-6 bg-background border-t safe-area-inset-bottom">
    <Button className="w-full" size="lg">
      Submit
    </Button>
  </footer>
</div>
```

---

## 🚫 **Anti-Patterns (Avoid These)**

### ❌ Fixed Mobile Sizes
```tsx
// BAD: Doesn't scale
className="text-2xl p-6"

// GOOD: Responsive
className="text-lg sm:text-2xl p-4 sm:p-6"
```

### ❌ Desktop-First Approach
```tsx
// BAD: More code, harder to maintain
className="text-base md:text-sm"

// GOOD: Mobile-first
className="text-sm sm:text-base"
```

### ❌ Small Touch Targets
```tsx
// BAD: Too small for touch (32px)
className="h-8 w-8"

// GOOD: iOS compliant (44px)
className="h-10 w-10 min-h-[44px] min-w-[44px]"
```

### ❌ Text Causes iOS Zoom
```tsx
// BAD: < 16px triggers zoom on iOS
<input className="text-sm" />  // 14px

// GOOD: ≥ 16px prevents zoom
<input className="text-base" />  // 16px
```

### ❌ No Touch Feedback
```tsx
// BAD: No visual feedback on tap
<button>Click</button>

// GOOD: Clear feedback
<button className="active:scale-95 touch-manipulation">
  Click
</button>
```

---

## 📚 **Quick Reference Table**

| Element | Mobile | Tablet (sm) | Desktop (lg) |
|---------|--------|-------------|--------------|
| Page padding | p-4 (16px) | p-6 (24px) | p-8 (32px) |
| Card padding | p-3 (12px) | p-4 (16px) | p-6 (24px) |
| H1 text | text-2xl (24px) | text-3xl (30px) | text-4xl (36px) |
| H2 text | text-xl (20px) | text-2xl (24px) | text-3xl (30px) |
| Body text | text-sm (14px) | text-base (16px) | text-base (16px) |
| Button height | h-10 (40px) | h-10 (40px) | h-11 (44px) |
| Input height | h-10 (40px) | h-10 (40px) | h-10 (40px) |
| Avatar | h-10 (40px) | h-12 (48px) | h-14 (56px) |
| Gap | gap-2 (8px) | gap-3 (12px) | gap-4 (16px) |

---

**Use this as your go-to reference when building new components! 🎃**

