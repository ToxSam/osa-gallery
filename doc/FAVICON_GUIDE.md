# Favicon Setup Guide

## Quick Steps

1. **Create your favicon image**
   - Start with a square image (512x512px recommended)
   - Simple, recognizable design works best at small sizes
   - Use high contrast colors

2. **Generate the .ico file**
   - Go to https://favicon.io
   - Upload your image
   - Download the generated files

3. **Add files to your project**
   - Place `favicon.ico` in `/public/` directory
   - Place `apple-touch-icon.png` (180x180) in `/public/` directory

4. **Restart dev server**
   - The favicon should appear automatically

## File Locations

```
/public/
  ├── favicon.ico          (16x16, 32x32 sizes)
  └── apple-touch-icon.png (180x180 for iOS devices)
```

## Recommended Sizes

- **favicon.ico**: Contains 16x16 and 32x32 (most browsers)
- **apple-touch-icon.png**: 180x180 (iOS home screen)

## How It Works

1. Browser requests `/favicon.ico` automatically
2. Next.js serves it from `/public/` directory
3. Metadata in `layout.tsx` tells browsers where to find it
4. Browsers cache the favicon for performance

## Testing

- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache if needed
- Check browser DevTools → Network tab to see if favicon loads

## Chrome desktop not showing favicon

Chrome caches favicons very aggressively and often ignores normal cache headers. If the favicon works locally, on Vercel, or in other browsers (e.g. DuckDuckGo) but **not** in Chrome desktop:

1. **Cache busting**: Icon URLs in `layout.tsx` use `?v=2` (and similar). When you change the favicon, bump the version (e.g. `?v=3`) so Chrome fetches a fresh copy.
2. **Test in Incognito**: Open the site in Chrome Incognito (Cmd+Shift+N / Ctrl+Shift+N). If the favicon appears there, it’s a cache issue.
3. **Clear favicon cache**: Chrome → Settings → Privacy and security → Clear browsing data → Cached images and files. Or use `chrome://favicon/` only to inspect, not to clear.
4. **Hard refresh** the tab: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows).
