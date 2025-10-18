# Camera Capture Feature

## Overview
The registration form supports **direct camera capture** on mobile devices using the HTML5 `capture` attribute.

## How It Works

### On Mobile Devices (iOS/Android)
When users tap the photo capture buttons:

1. **"Take Selfie (Front Camera)"**
   - Opens the device's camera app automatically
   - Uses the **front-facing camera** (selfie mode)
   - Takes photo and returns to the app

2. **"Take Full Body Photo (Back Camera)"**
   - Opens the device's camera app automatically
   - Uses the **rear-facing camera**
   - Takes photo and returns to the app

### On Desktop
- Opens the standard file picker dialog
- Users can select existing images
- No camera access (unless webcam is available and supported by browser)

## Implementation Details

### Component: `PhotoCapture.tsx`

```tsx
<input
  type="file"
  accept="image/*"
  capture={cameraType}  // 'user' for front, 'environment' for back
  onChange={handleFileSelect}
/>
```

**Key Attributes:**
- `capture="user"` → Front camera (for selfies)
- `capture="environment"` → Rear camera (for full body shots)
- `accept="image/*"` → Accepts all image formats

### Features
✅ **Automatic Camera Detection** - Correct camera opens based on photo type
✅ **Image Compression** - Automatically compresses images for faster uploads
✅ **Preview Before Upload** - Users can review and retake photos
✅ **Fallback Support** - Works as file picker on desktop
✅ **Format Support** - Accepts JPEG, PNG, WebP, and all image formats

## Browser Support

### Mobile Browsers
| Browser | Camera Capture | Camera Selection |
|---------|---------------|------------------|
| iOS Safari | ✅ Yes | ✅ Yes |
| iOS Chrome | ✅ Yes | ✅ Yes |
| Android Chrome | ✅ Yes | ✅ Yes |
| Android Firefox | ✅ Yes | ✅ Yes |
| Samsung Internet | ✅ Yes | ✅ Yes |

### Desktop Browsers
| Browser | Behavior |
|---------|----------|
| Chrome/Edge | File picker (no camera) |
| Firefox | File picker (no camera) |
| Safari | File picker (no camera) |

## Testing

### Mobile Testing
1. Open the app on a mobile device
2. Navigate to registration page
3. Tap "📸 Take Selfie (Front Camera)"
4. **Expected**: Camera app opens with front camera
5. Take photo
6. **Expected**: Returns to app with photo preview
7. Tap "📸 Take Full Body Photo (Back Camera)"
8. **Expected**: Camera app opens with rear camera

### Desktop Testing
1. Open the app on desktop
2. Navigate to registration page
3. Click "📸 Take Selfie (Front Camera)"
4. **Expected**: File picker dialog opens
5. Select an image file
6. **Expected**: Image is loaded and compressed

## User Experience

### Button Text
- "📸 Take Selfie (Front Camera)"
- "📸 Take Full Body Photo (Back Camera)"

### Help Text
- "Camera will open automatically • Or choose from gallery"

This makes it clear that:
1. Camera is the primary action
2. Users can also select from existing photos
3. The correct camera will open automatically

## Image Processing

After capture, images are:
1. **Validated** - Checks file size (max 6MB before compression)
2. **Compressed** - Reduces file size while maintaining quality
3. **Previewed** - Shows compressed image for review
4. **Uploaded** - Sent to server when form is submitted

## Technical Notes

### Why This Approach?
- **Native Experience**: Uses device's camera app (no WebRTC complexity)
- **Better UX**: Familiar camera interface for users
- **Wider Support**: Works on more devices than WebRTC
- **Simpler Code**: No need for video streams or canvas manipulation
- **Better Quality**: Uses device's native camera optimizations

### Limitations
- Desktop browsers don't support camera capture (by design)
- Some older browsers may fall back to file picker only
- Camera selection works best on modern mobile browsers

### Alternative: WebRTC
We intentionally chose **not** to use WebRTC because:
- More complex implementation
- Requires camera permissions
- Less familiar UX for users
- Doesn't work in all mobile browsers
- Users prefer their native camera app

## Troubleshooting

### Camera Doesn't Open
**Cause**: Browser doesn't support capture attribute
**Solution**: Will fall back to file picker automatically

### Wrong Camera Opens
**Cause**: Device doesn't support camera selection
**Solution**: Users can manually switch cameras in their camera app

### No Camera Option on Desktop
**Cause**: Desktop browsers don't support mobile camera capture
**Solution**: Expected behavior - use file picker instead

