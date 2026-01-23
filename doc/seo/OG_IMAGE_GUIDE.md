# Open Graph Image Generator - Quick Reference

## 🖼️ Dynamic OG Image API

The `/api/og` endpoint generates custom Open Graph images dynamically for social media sharing.

### Endpoint
```
GET /api/og
```

### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `title` | string | Main title for the image | "Open Source Avatars" |
| `description` | string | Description text | "Free 3D VRM Avatars" |
| `avatarName` | string | Name of the avatar | "Avatar01_Crimson" |
| `project` | string | Project/collection name | "Round 1" |

### Usage Examples

#### 1. Home Page
```html
<meta property="og:image" content="https://opensourceavatars.com/opengraph-image" />
```

#### 2. Gallery Page
```
https://opensourceavatars.com/api/og?title=Avatar%20Gallery&description=Browse%20300%2B%20Free%20VRM%20Avatars
```

#### 3. Individual Avatar Page
```
https://opensourceavatars.com/api/og?avatarName=Crimson_Avatar&project=Round%201
```

#### 4. About Page
```
https://opensourceavatars.com/api/og?title=About&description=Learn%20about%20our%20open%20source%20avatar%20collection
```

### Implementation in Code

For avatar pages, OG images are automatically generated using the avatar's data:

```typescript
// In avatar page metadata
export async function generateMetadata({ params }) {
  const avatar = await getAvatar(params.id);
  
  return {
    openGraph: {
      images: [
        {
          url: `/api/og?avatarName=${encodeURIComponent(avatar.name)}&project=${encodeURIComponent(avatar.project)}`,
          width: 1200,
          height: 630,
          alt: avatar.name,
        }
      ],
    },
  };
}
```

### Design Specifications

- **Dimensions**: 1200 x 630 pixels (optimal for all platforms)
- **Background**: Cream (#FAF9F6) with subtle dot pattern
- **Typography**: Bold, modern sans-serif
- **Elements**:
  - Site branding at top
  - Avatar name and project (if applicable)
  - Statistics badges (300+ Avatars, CC0, VRM)
  - Footer with domain and social handle

### Platform Compatibility

| Platform | Display | Notes |
|----------|---------|-------|
| Twitter/X | ✅ Large Card | Optimal size |
| Facebook | ✅ Full Width | Optimal size |
| LinkedIn | ✅ Full Width | Optimal size |
| Discord | ✅ Embed | Shows nicely |
| Slack | ✅ Unfurl | Shows nicely |
| WhatsApp | ✅ Preview | Shows thumbnail |

### Testing Tools

1. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
2. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
3. **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/
4. **Open Graph Check**: https://www.opengraph.xyz/

### Tips for Best Results

1. **Keep text short**: Longer titles may wrap awkwardly
2. **Test on mobile**: Images should be readable on small screens
3. **High contrast**: Ensure text is readable against background
4. **Encode URLs**: Always use `encodeURIComponent()` for parameters
5. **Cache considerations**: OG images are cached by social platforms

### Fallback Image

If dynamic generation fails or parameters are missing, the static fallback at `/opengraph-image` is used automatically.

### Example HTML Output

```html
<meta property="og:image" content="https://opensourceavatars.com/api/og?avatarName=Avatar01&project=Round%201" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Avatar01 - Free VRM Avatar" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://opensourceavatars.com/api/og?avatarName=Avatar01&project=Round%201" />
```

---

## 🎨 Customization

To customize the OG image design, edit `/src/app/api/og/route.tsx`. The component uses React-like JSX with inline styles.

### Color Scheme
- Background: `#FAF9F6` (cream)
- Text Primary: `#000` (black)
- Text Secondary: `#666` (gray)
- Accents: Can be customized per avatar

### Typography Scale
- Hero Title: 80px
- Avatar Name: 72px
- Description: 36-40px
- Stats: 48px
- Labels: 24-28px

### Layout Grid
- Padding: 80px
- Component Spacing: 40-60px
- Stat Grid: 60px gap

---

**Pro Tip**: Test your OG images in an incognito window to see how they appear without cache!
