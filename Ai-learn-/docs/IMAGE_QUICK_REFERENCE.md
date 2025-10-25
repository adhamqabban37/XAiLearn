# 🚀 Image Optimization - Quick Reference

## 📸 Common Use Cases

### Logo / Header Image

```tsx
import { A11yImage } from "@/components/a11y/A11yImage";

<A11yImage
  src="/logo.svg"
  alt="Company Logo"
  width={40}
  height={40}
  priority // ⚡ Load immediately
/>;
```

### Hero Image (Above Fold)

```tsx
import Image from "next/image";
import { getOptimizedImageProps } from "@/lib/image-optimization";

<Image
  src="/hero.jpg"
  alt="Hero Banner"
  {...getOptimizedImageProps("hero")} // ⚡ Pre-optimized
/>;
```

### Card/Thumbnail (Below Fold)

```tsx
<A11yImage
  src="/card.jpg"
  alt="Card Image"
  width={400}
  height={300}
  // loading="lazy" is automatic ✅
/>
```

### Decorative Image (No Alt)

```tsx
<A11yImage
  src="/decoration.svg"
  decorative // 🎨 Adds aria-hidden
  width={100}
  height={100}
/>
```

### External Image with Optimization

```tsx
import { optimizeImageUrl } from "@/lib/image-optimization";

const optimizedUrl = optimizeImageUrl(
  "https://images.unsplash.com/photo-123",
  800, // width
  85 // quality
);

<Image src={optimizedUrl} alt="..." width={800} height={600} />;
```

### Upload with WebP Conversion

```tsx
import { ImageUpload } from "@/components/common/ImageUpload";

<ImageUpload
  onUploadComplete={(url) => handleUpload(url)}
  maxSizeMB={5}
  convertToWebP={true} // 🎯 Auto-convert
/>;
```

---

## 🎛 Image Context Helpers

```tsx
import { getOptimizedImageProps } from "@/lib/image-optimization";

// Auto-applies: priority, sizes, dimensions
getOptimizedImageProps("hero"); // 1920x1080, priority
getOptimizedImageProps("card"); // 400x300, lazy
getOptimizedImageProps("thumbnail"); // 128x128, lazy
getOptimizedImageProps("avatar"); // 40x40, lazy
getOptimizedImageProps("logo"); // 40x40, priority
```

---

## 📏 Predefined Sizes

```tsx
import { IMAGE_SIZES } from "@/lib/image-optimization";

IMAGE_SIZES.thumbnail; // 64x64
IMAGE_SIZES.small; // 128x128
IMAGE_SIZES.medium; // 256x256
IMAGE_SIZES.large; // 512x512
IMAGE_SIZES.hero; // 1920x1080
IMAGE_SIZES.card; // 400x300
IMAGE_SIZES.avatar; // 40x40
```

---

## 🎯 When to Use Priority

✅ **Use `priority` for:**

- Logo in header
- Hero images above fold
- Critical UI visible on load

❌ **Don't use `priority` for:**

- Images below fold
- Gallery/carousel images
- Modal/dialog content
- User avatars in lists

---

## 🔍 Debugging

### Check Served Format

```bash
# Open DevTools → Network → Filter by "Img"
# Look for "Type" column - should be "webp" or "avif"
```

### Test Lazy Loading

```bash
# DevTools → Network → Throttle to "Slow 3G"
# Scroll down - images load as they appear
```

### Verify Optimization

```bash
npm run build
# Check output for image optimization stats
```

---

## ⚡ Performance Checklist

- [ ] Above-the-fold images use `priority`
- [ ] Below-the-fold images use lazy loading (default)
- [ ] All images have explicit width/height
- [ ] All images have meaningful `alt` text
- [ ] Decorative images marked as `decorative`
- [ ] Large images use responsive `sizes`
- [ ] SVGs used for icons/logos
- [ ] External images optimized via helper

---

## 🌐 CDN Setup (Future)

```typescript
// When ready for CDN:
// 1. Update next.config.ts
images: {
  loader: 'custom',
  loaderFile: './src/lib/cdn-loader.ts',
}

// 2. Use CDN helper
import { getCDNUrl } from '@/lib/image-optimization';
const url = getCDNUrl('/image.jpg', 'https://cdn.example.com');
```

---

## 📚 Key Files

| File                                    | Purpose                        |
| --------------------------------------- | ------------------------------ |
| `next.config.ts`                        | Image formats, remote patterns |
| `src/lib/image-optimization.ts`         | Helper utilities               |
| `src/components/a11y/A11yImage.tsx`     | Accessible image wrapper       |
| `src/components/common/ImageUpload.tsx` | Upload with conversion         |
| `docs/IMAGE_OPTIMIZATION.md`            | Full documentation             |

---

## 🎓 Best Practices

1. **Always specify dimensions** to prevent CLS
2. **Use `priority` sparingly** (3-5 images max)
3. **Default to lazy loading** for everything else
4. **Prefer SVG** for logos and icons
5. **Use context helpers** for consistency
6. **Test on slow connections** to verify lazy loading
7. **Monitor Core Web Vitals** in production

---

**Quick Win:** Replace `<img>` with `<A11yImage>` everywhere!
