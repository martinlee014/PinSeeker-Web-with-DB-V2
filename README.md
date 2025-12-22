
# PinSeeker Web

**PinSeeker** is a professional Golf Analytics and Strategy Application providing satellite mapping, shot dispersion analysis, and round tracking. It acts as a "Smart Electronic Caddie," visualizing your game plan based on real data, wind conditions, and strategic preferences.

## 🎯 Product Positioning
PinSeeker is not just a GPS rangefinder. It is a precision tool built for golfers who want to visualize their strategy, manage their misses, and curate their own course data.

## ✨ Key Highlights

### 1. Professional Dispersion Analysis
*   **Plan for the Miss**: Input your carry distance, side error, and depth error for every club.
*   **Visual Confidence**: See your potential landing zones (blue ellipses) on the map. Avoid hazards by understanding your statistical spread, not just the perfect number.

### 2. Advanced Rangefinder & Planning
*   **Measurement Mode**: Built-in "My Location" snapping allows instant measurements from where you stand to any layup point or the pin.
*   **Plays-Like Distance**: Integrated Visual Wind Compass calculates environmental adjustments automatically.

### 3. Interactive Strategy Board
*   **Coach's Eye**: Draw flight paths, mark hazards, or drop strategy pins directly on the satellite map.
*   **Quick Editing**: Includes an Eraser tool and intuitive touch gestures to manage your notes on the fly.

### 4. DIY Course Editor
*   **Limitless Database**: Create high-precision maps for any course in the world using the built-in editor.
*   **Precision Control**: Deep zoom (Level 22) and drag-and-drop markers allow for exact Tee and Green placement.
*   **Cloud Library**: Share and download custom courses via Supabase integration.

### 5. Seamless Tracking
*   **Smart GPS**: One-tap shot recording and long-press Tee updates.
*   **Replay Mode**: Review every shot of your round on the map after you finish, analyzing your performance hole-by-hole.

## 📱 Mobile & GPS Support (HTTPS Required)

**Crucial**: To use the GPS Location features (`navigator.geolocation`) on a mobile device (iOS/Android), this application **must be served over HTTPS**.

## ☁️ Cloud Database Setup (Supabase)

To enable the Online Course Library features, you need to connect the app to Supabase.

1.  Create a project at [Supabase.com](https://supabase.com).
2.  Create a `.env` file in the root directory.
3.  Add your credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🌐 Deployment & Sync to GitHub

To update your remote GitHub repository with the latest changes from this project, run the following commands in your terminal:

```bash
# 1. Initialize git if you haven't already
git init

# 2. Add all files to the staging area
git add .

# 3. Commit the changes
git commit -m "feat: integrate supabase course database"

# 4. Ensure you are on the main branch
git branch -M main

# 5. Add your remote repository (replace with your actual URL)
# git remote add origin https://github.com/YOUR_USERNAME/pinseeker-web.git

# 6. Push changes to GitHub
git push -u origin main
```

To deploy the live app to GitHub Pages:

```bash
npm run deploy
```

## 🛠 Local Development

```bash
npm install
npm run dev
```

## 📜 Version History

See [DEV_LOG.md](./docs/DEV_LOG.md) for detailed development logs.