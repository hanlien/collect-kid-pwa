# Collect Kid 🌸🦋🐦

A production-quality, mobile-first Progressive Web App that helps kids discover and learn about nature through camera identification. Built with Next.js 14, TypeScript, and TailwindCSS.

## Features

- **📸 Smart Recognition**: Identify flowers, bugs, and animals using Google Cloud Vision and Plant.id APIs
- **🎓 Educational Content**: Kid-friendly facts from GBIF and Wikimedia
- **🏆 Gamification**: Collect badges and complete daily quests
- **🎨 Beautiful UI**: Mobile-first design with playful animations
- **📱 PWA Ready**: Installable on iOS and Android with offline support
- **🔊 Voice Features**: Text-to-speech for accessibility
- **🛡️ Safety First**: Warnings for potentially dangerous species

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **APIs**: Google Cloud Vision, Plant.id, GBIF, Wikimedia
- **PWA**: Service Worker, Web App Manifest
- **State**: Server Components + Lightweight Client State

## Prerequisites

- Node.js 18+ 
- pnpm or npm
- Supabase account
- Google Cloud Vision API key
- Plant.id API key

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd Collect Kid
pnpm install
```

### 2. Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp env.local.example .env.local
```

Required environment variables:

```env
# Vision / Providers
PLANT_ID_API_KEY=your_plant_id_key
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cost guards
GCV_MAX_DAY=300
PLANT_MAX_DAY=200
MAX_IMAGE_MB=2
```

### 3. Database Setup

Run the Supabase schema:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using psql
psql $DATABASE_URL -f supabase.sql
```

### 4. Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 5. Build for Production

```bash
pnpm build
pnpm start
```

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (📤)
3. Select "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── scan/              # Camera/scanning page
│   ├── result/            # Identification results
│   ├── book/              # Collection view
│   ├── quest/             # Daily quests
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities and config
├── types/                 # TypeScript definitions
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   └── icons/            # App icons
└── supabase.sql          # Database schema
```

## API Routes

### POST /api/recognize
Handles image upload and species identification.

**Request**: Multipart form with image file and hint
**Response**: SpeciesResult with category, name, confidence, etc.

### GET /api/facts
Fetches educational content for a species.

**Query**: canonicalName, gbifKey (optional)
**Response**: Summary, fun facts, and image URL

### POST /api/collect
Saves a capture and manages badge progression.

**Body**: userId, result
**Response**: Capture data and badge updates

## Key Features

### Image Processing
- Client-side downscaling to 1024px max
- JPEG compression (85% quality)
- EXIF data stripping for privacy
- Server-side validation

### Recognition Pipeline
1. **Google Vision**: Label detection and color analysis
2. **Routing Logic**: 
   - Plants/flowers → Plant.id API
   - Bugs → MVP detection (no paid API yet)
   - Animals → Vision results
3. **Normalization**: Consistent SpeciesResult format

### Gamification
- **Badges**: Bronze (1), Silver (3), Gold (7) levels
- **Daily Quests**: Rotating challenges with star rewards
- **Collection**: Organized by category with progress tracking

### Safety Features
- Dangerous species warnings
- No GPS tracking (optional location hints only)
- Kid-friendly content filtering

## Development Notes

### Rate Limiting
Currently uses in-memory counters. For production, consider:
- Redis/Upstash for distributed rate limiting
- Database-backed counters for persistence

### Authentication
Uses simple localStorage user IDs. For production:
- Implement proper Supabase Auth
- Add user profiles and settings

### Image Storage
Currently uses external URLs. For production:
- Implement image upload to Supabase Storage
- Add thumbnail generation
- Consider CDN for performance

## Testing

### Manual Testing Checklist
- [ ] Can scan a plant photo → routes to Plant.id → returns normalized result
- [ ] Can scan an animal photo → uses Vision only → returns normalized result + color chips
- [ ] LOW_CONFIDENCE path shows tips and no crash
- [ ] Collect saves capture and upgrades a badge at counts 1/3/7
- [ ] Book shows silhouettes and earned badges
- [ ] PWA installs to home screen and works offline
- [ ] No provider keys leak to client

### Future Testing
- Unit tests for routing decision util
- E2E tests with Playwright
- API integration tests

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Compatible with Next.js
- **Railway**: Good for full-stack apps
- **Self-hosted**: Docker support available

## Version Control & Releases

### 🏷️ Current Version: **v1.0.0** - "Backyard Discovery"

This project follows **Semantic Versioning** (SemVer) and maintains a structured release process for consistent, reliable updates.

### Quick Commands
```bash
# Version Management
npm run version:patch   # 1.0.0 → 1.0.1 (bug fixes)
npm run version:minor   # 1.0.0 → 1.1.0 (new features) 
npm run version:major   # 1.0.0 → 2.0.0 (breaking changes)

# Release Process
npm run release:check     # Build + Type check + Lint
npm run release:staging   # Deploy to staging
npm run release:production # Deploy to production
```

### 📋 Documentation
- **[CHANGELOG.md](./CHANGELOG.md)** - Complete release history, features, and bug fixes
- **[VERSION_CONTROL.md](./VERSION_CONTROL.md)** - Detailed branching strategy and release workflow

### 🌟 Release Highlights
- **v1.0.0** - Complete PWA with AI recognition, gamification system, and gift shop
- **Coming Soon** - Enhanced AI accuracy, family sharing, and community features

### 🌳 Branch Strategy
- **`main`** - Production-ready code (auto-deploys)
- **`develop`** - Integration branch (staging environment)
- **`feature/*`** - Individual feature development
- **`release/*`** - Version preparation and testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Create a GitHub issue
- Check the documentation
- Review the code comments

---

Built with ❤️ for curious kids everywhere!
# Updated Wed Aug 13 19:13:44 PDT 2025
