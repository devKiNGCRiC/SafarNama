# 🎥 Cloudinary Video URLs for Safarnama

## ✅ Successfully Uploaded Videos

### Background Video 2 (51.94 MB, 6.08s)

```
https://res.cloudinary.com/dxyclus0f/video/upload/v1761919400/safarnama/videos/safarnama/videos/bg-video2.mp4
```

### Background Video 3 (10.76 MB, 8.58s)

```
https://res.cloudinary.com/dxyclus0f/video/upload/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4
```

**✅ Currently used in:**

- `client/src/Components/Home/Home.jsx`
- `client/src/Components/Home/Home_New.jsx`

### Hero Video (8.17 MB, 22.87s)

```
https://res.cloudinary.com/dxyclus0f/video/upload/v1761919417/safarnama/videos/safarnama/videos/hero-video.mp4
```

## ❌ Failed Upload

### Background Video 1 (183.08 MB)

**Status:** Failed - File too large for Cloudinary free tier (100MB limit)

**Solutions:**

1. **Compress the video:** Use HandBrake or FFmpeg to reduce size below 100MB
2. **Use YouTube:** Upload to unlisted YouTube video and embed
3. **Upgrade Cloudinary:** Consider paid plan for large files

## 🛠️ How to Compress Large Video

Using FFmpeg (install from https://ffmpeg.org/):

```bash
# Reduce to 1080p with good quality (should be under 100MB)
ffmpeg -i bg-video.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k bg-video-compressed.mp4

# If still too large, use higher compression (lower quality)
ffmpeg -i bg-video.mp4 -vf scale=1920:1080 -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 96k bg-video-compressed.mp4
```

## 📝 Usage in React Components

```jsx
// Method 1: Direct URL (recommended)
const heroVideo = 'https://res.cloudinary.com/dxyclus0f/video/upload/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4';

<video src={heroVideo} autoPlay loop muted playsInline />

// Method 2: With optimizations
<video
  src="https://res.cloudinary.com/dxyclus0f/video/upload/q_auto/safarnama/videos/safarnama/videos/bg2-video.mp4"
  autoPlay
  loop
  muted
  playsInline
  poster="/path/to/fallback-image.jpg"
/>
```

## 🎨 Cloudinary Video Transformations

You can modify videos on-the-fly by adding transformations to the URL:

### Reduce Quality (smaller file size)

```
https://res.cloudinary.com/dxyclus0f/video/upload/q_50/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4
```

### Resize to 720p

```
https://res.cloudinary.com/dxyclus0f/video/upload/w_1280,h_720,c_limit/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4
```

### Auto Quality (recommended)

```
https://res.cloudinary.com/dxyclus0f/video/upload/q_auto/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4
```

## ☁️ Cloudinary Dashboard

View and manage your videos:

- **Dashboard:** https://cloudinary.com/console
- **Media Library:** https://cloudinary.com/console/media_library
- **Cloud Name:** dxyclus0f

## 📊 Storage Status

**Free Tier Limits:**

- ✅ Storage: 25 GB
- ✅ Bandwidth: 25 GB/month
- ✅ Transformations: 25 credits/month
- ❌ Max upload size: 100 MB per file

**Current Usage:**

- Videos: 3 files (~71 MB total)
- Remaining: ~24.93 GB
