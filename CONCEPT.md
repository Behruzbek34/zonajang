# ZonaJang — To'liq Konsept va Arxitektura

## 1. App Nomi Variantlari

| Nom | Ma'nosi | Vibe |
|-----|---------|------|
| **ZonaJang** ⭐ | Zone + Jang (Battle) | Aggressive, memorable |
| **YerEgasi** | Yer egasi = Land Owner | O'zbek milliy ruh |
| **HududGo** | Hudud + Go (Pokémon GO) | Intuitive |
| **TuprokJang** | Tuprok=Tuproq + Battle | Raw, real |
| **ShahriEga** | Shahrning Egasi | Premium feel |
| **MapJang** | Map Battle | International + local mix |
| **QalaWar** | Qal'a = Fortress + War | Strategy game vibe |
| **GeoUrush** | Geo + Urush (War) | Direct |

**Tavsiya: ZonaJang** — qisqa, talaffuz qilish oson, appstore-da yaxshi ko'rinadi.

---

## 2. Logo G'oyalari

```
Variant A — Sword + Map Pin:
   ⚔️ ustiga 📍 — "hududni qilichlab olish" metaforasi
   Rang: Indigo (#6366f1) + Neon Cyan (#22d3ee)
   Font: Bold, geometric, all-caps "ZONAJANG"

Variant B — Territory Polygon:
   Geksagonal shakl ichida neon outline
   Markazida "Z" harfi
   Dark background + glow effect

Variant C — Map + Crown:
   Xarita ustida toj
   "Hududni boshqa" hissi beradi
   Premium positioning uchun yaxshi
```

---

## 3. Full UI Konsepti

### Ranglar (Tailwind config)
```
Background:  #0a0a0f (ultra dark)
Surface:     #111118
Border:      #1e1e2e
Purple:      #6366f1 (player territory, primary CTA)
Cyan:        #22d3ee (allies, live indicators)
Amber:       #f59e0b (XP, rankings)
Green:       #10b981 (capture success, online status)
Red:         #ef4444 (enemies, attacks, danger)
Pink:        #ec4899 (special players)
```

### Ekranlar
1. **Login/Register** — Dark background + glow + avatar/color picker
2. **Map (Asosiy)** — Full-screen Leaflet dark map + HUD overlay + floating controls
3. **Leaderboard** — Top 3 podium + ranked list + clan rankings
4. **Profile** — Avatar + XP bar + territory stats + rank badge
5. **Clan** — Clan card + member list + join/create modal
6. **Notifications** — Categorized notifications + read/unread state

---

## 4. React JS Arxitektura

```
src/
├── App.jsx                    # Router + auth guard + layout
├── main.jsx
├── index.css                  # Tailwind + global styles
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── MapPage.jsx            # Main game screen
│   ├── LeaderboardPage.jsx
│   ├── ProfilePage.jsx
│   ├── ClanPage.jsx
│   └── NotificationsPage.jsx
│
├── components/
│   ├── Map/
│   │   ├── MapView.jsx        # react-leaflet container
│   │   └── CaptureControls.jsx # Start/stop + demo buttons
│   ├── HUD/
│   │   └── HUD.jsx            # Overlay stats + capture progress
│   ├── Navigation/
│   │   └── BottomNav.jsx      # Tab bar with active indicator
│   └── Notifications/
│       └── NotificationToast.jsx # Animated toast popups
│
├── store/
│   ├── useAuthStore.js        # Zustand + persist (login state)
│   ├── useGameStore.js        # Territory, GPS path, live players
│   └── useNotificationStore.js # Notifications + toasts
│
├── hooks/
│   ├── useGPS.js              # navigator.geolocation watcher
│   └── useWebSocket.js        # Socket.IO / demo simulator
│
├── utils/
│   ├── gpsUtils.js            # Haversine, area, path utils
│   ├── territoryUtils.js      # Overlap, rank, XP calculation
│   └── antiCheatUtils.js      # Speed, teleport, bot detection
│
└── constants/
    ├── gameConfig.js          # Tunable game constants
    └── mockData.js            # Demo territories, players, clans
```

---

## 5. Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  avatar VARCHAR(10) DEFAULT '⚡',
  color VARCHAR(7) DEFAULT '#6366f1',
  xp INTEGER DEFAULT 0,
  total_area_m2 FLOAT DEFAULT 0,
  clan_id UUID REFERENCES clans(id),
  device_fingerprint TEXT,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Territories
CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clan_id UUID REFERENCES clans(id),
  coordinates JSONB NOT NULL,           -- [[lat,lng], ...]
  area_m2 FLOAT NOT NULL,
  bbox JSONB NOT NULL,                  -- {minLat, maxLat, minLng, maxLng}
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
-- Index for spatial queries
CREATE INDEX territories_bbox ON territories USING GIN (bbox);

-- Territory History (audit log)
CREATE TABLE territory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID,
  event_type VARCHAR(20),               -- 'created', 'conquered', 'reduced'
  actor_user_id UUID REFERENCES users(id),
  area_delta FLOAT,
  coordinates_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS Paths (ephemeral — kept 24h then deleted)
CREATE TABLE gps_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points JSONB NOT NULL,               -- [{lat, lng, timestamp}, ...]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clans
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  badge VARCHAR(10) DEFAULT '🛡️',
  color VARCHAR(7) DEFAULT '#6366f1',
  description TEXT,
  leader_id UUID REFERENCES users(id),
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anti-cheat violations
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  violation_type VARCHAR(30),          -- 'speed', 'teleport', 'bot_pattern'
  details JSONB,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard (materialized, refresh every 5 min)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  u.id, u.username, u.avatar, u.color, u.xp,
  u.total_area_m2,
  c.name AS clan_name,
  RANK() OVER (ORDER BY u.total_area_m2 DESC) AS rank
FROM users u
LEFT JOIN clans c ON u.clan_id = c.id
WHERE NOT u.is_banned
ORDER BY u.total_area_m2 DESC
LIMIT 1000;
```

---

## 6. Multiplayer System

```
Arxitektura:
  Client ←→ Socket.IO ←→ Node.js Server ←→ Redis Pub/Sub ←→ PostgreSQL

Socket Events (client → server):
  player:move        { lat, lng, timestamp }
  territory:capture  { coordinates[], userId }
  territory:attack   { targetTerritoryId, path[] }

Socket Events (server → client):
  territory:new      { territory object }
  territory:removed  { id }
  player:moved       { userId, lat, lng }
  battle:started     { attackerId, defenderId, territoryId }
  battle:ended       { winner, territoryId }
  notification       { type, message }

Rooms (Socket.IO):
  geographic_cell_{z}_{x}_{y}   — Haritani hex cellarlarga bo'lish
  user_{id}                      — Faqat shu userni targetlash
  clan_{id}                      — Clan notifications
```

---

## 7. Territory Algorithm

```
Hudud Egallash Algoritmi:

1. YOZISH BOSQICHI
   - User "Boshlash" bosadi
   - GPS points har 2 soniyada yoziladi
   - MIN_DISTANCE = 5m (juda yaqin nuqtalar skip)
   - Nuqtalar array: [[lat,lng], [lat,lng], ...]

2. YOPISH ANIQLASH
   - Har yangi nuqtada: distanceBetween(newPoint, path[0])
   - Agar masofa < 20m VA path.length >= 10:
     → Avtomatik yopiladi
   - Capture progress bar 0→100% ko'rinadi

3. POLYGON YARATISH
   - Ramer-Douglas-Peucker bilan soddalashtirish
   - Shoelace formula bilan area hisoblash
   - MIN_AREA = 500 m² (juda kichik shakllar rad)

4. OVERLAP TEKSHIRISH
   - Bounding box overlap (tez check)
   - Ray-casting (nuqta-ichida check)
   - Overlap topilsa:
     a. Agar own territory → merge qilinadi
     b. Agar boshqa user → CONQUEST EVENT
        - Ularning hududi kichraytiriladi (polygon clipping)
        - Ular notification oladi
        - Defend qilish uchun 60 soniya beriladi

5. SAQLASH
   - PostgreSQL ga coordinates JSONB
   - Redis da cached leaderboard yangilanadi
   - WebSocket orqali barcha online userlarga broadcast
```

---

## 8. GPS Tracking Logic

```javascript
// Asosiy parametrlar
GPS_UPDATE_INTERVAL = 2000ms     // Geolocation watch
MIN_DISTANCE_TO_RECORD = 5m     // Noise filtering
CAPTURE_CLOSE_THRESHOLD = 20m   // Path closing detection
MAX_PATH_POINTS = 500           // Memory limit
HIGH_ACCURACY = true            // enableHighAccuracy: true

// Path lifecycle
startTracking() → watchPosition() → handlePosition()
  → validateAntiCheat()
  → filterMinDistance()
  → appendToPath()
  → checkIfClosing()
  → [if closed] captureTerritory()
  → broadcastToServer()

// GPS accuracy handling
if (accuracy > 50m) → show warning toast
if (accuracy > 100m) → pause recording
```

---

## 9. Anti-Cheat System

```
Deteksiya Qatlamlari:

1. TEZLIK TEKSHIRUVI (client + server)
   - Har GPS update da speed = distance / time hisoblash
   - > 30 km/h → violation + warning
   - > 60 km/h (avtomobil) → path invalidated

2. TELEPORT TEKSHIRUVI
   - < 5 soniyada > 200m harakat → suspicious
   - Server side double-check

3. BOT PATTERN ANIQLASH
   - Juda perfect circle/square shakllar → bot flag
   - Path irregularity score hisoblash (0=bot, 1=human)
   - Perfect timing intervals → suspicious

4. MULTI-ACCOUNT HIMOYA
   - Device fingerprint (localStorage + headers)
   - Same IP + same time → flag
   - Bir qurilmadan > 3 hisob → ban

5. VIOLATIONS TIZIMI
   - Har violation server da loglanadi
   - 5 violation → automatic review
   - 10 violation → temporary ban
   - Manual review paneli (admin)

6. GPS SPOOFING
   - Mock GPS apps aniqlash
   - iOS/Android developer options check
   - Impossible altitude changes
```

---

## 10. MVP Roadmap

```
SPRINT 1 (Hafta 1-2): Core
□ User auth (register/login/JWT)
□ Basic map + dark tiles
□ GPS recording
□ Territory capture (polygon creation)
□ Territory display (colored polygons)
□ Basic leaderboard

SPRINT 2 (Hafta 3-4): Social
□ Real-time WebSocket
□ Live player positions
□ Attack notifications
□ Profile page
□ Basic clan system

SPRINT 3 (Hafta 5-6): Polish
□ Anti-cheat (speed + teleport)
□ XP + ranking system
□ Push notifications (FCM)
□ Performance optimization
□ Beta testing (50 users Toshkent)

SPRINT 4 (Hafta 7-8): Launch
□ App Store + Play Store submission
□ Backend scaling (Redis, CDN)
□ Analytics (Mixpanel/Amplitude)
□ Marketing launch
□ Bug fixes from beta
```

---

## 11. Monetizatsiya Strategiyasi

```
FREE tier (barchaga):
  ✓ 1 ta asosiy rang
  ✓ GPS tracking
  ✓ Territory capture
  ✓ Basic leaderboard
  ✓ 1 clan membership

PREMIUM (14,900 so'm/oy ≈ $1.2):
  ✓ Custom territory rang (8 ta variant)
  ✓ Glow/neon border effect
  ✓ Animated territory fill
  ✓ Premium avatar frames
  ✓ 2x XP weekend events
  ✓ Priority in matchmaking

CLAN PREMIUM (29,900 so'm/oy):
  ✓ Custom clan badge (upload)
  ✓ Animated clan border
  ✓ Clan territory stats dashboard
  ✓ War mode (planned clan battles)
  ✓ 30 members (vs 20 free)

EVENT PASS (9,900 so'm/event):
  ✓ Seasonal events (Navro'z, mustaqillik)
  ✓ Special map skins
  ✓ Exclusive territory effects
  ✓ Limited badge

IN-APP PURCHASES:
  ✓ "Tezkor Capture" boost — 2,900 so'm (2x speed for 1 hr)
  ✓ Territory defend shield — 1,900 so'm (24h protection)
  ✓ XP booster — 4,900 so'm (3x for 3 hrs)
```

---

## 12. Viral Marketing G'oyalari

```
1. SCREENSHOT SHARE
   "Menga tashlab ko'r!" — territory screenshot + "Sizning shahringizda kimlar bor?"
   Auto-generated sharing card: username + area + rank

2. REFERRAL TIZIM
   "Do'stingni taklif qil → har ikkalangiz ham 500 XP olasiz"
   Referral code tracking

3. TERRITORIAL CHALLENGE
   "Toshkent markazini birinchi egallagan kim?" → Twitter/Instagram contest
   Leaderboard screenshot weekly share

4. NEIGHBORHOOD WAR
   Mahalla vs mahalla real urush
   Massiv media coverage potential

5. INFLUENCER SEEDING
   Toshkent fitness/running influencers bilan hamkorlik
   "Jogging qilsang, hududingni egallaysan!"

6. UNIVERSITY WARS
   TATU vs TDTU vs ToshDU territory battle
   Campus coverage → organic spread

7. CLAN RECRUITMENT
   Clan leaders doimo yangi a'zo qidiradi → organic growth
   "Bizning klanga qo'shil" posts

8. REAL-WORLD EVENTS
   "Toshkent Marathon" + territory capture event
   "Weekend Capture Challenge" with prizes
```

---

## 13. O'zbek Auditoriyasi Growth Strategy

```
TARGET:
  Birlamchi: 18-28 yoshli Toshkent yoshlari
  Ikkilamchi: Fitness/running community
  Uchinchi: Gamer community

KANALLAR:
  Telegram: O'zbek gaming guruhlar (1M+ users)
  Instagram: Fitness va lifestyle creators
  YouTube: Gaming channels (Sardor Gaming, etc.)
  TikTok: 15-25 yoshlilar uchun teaser content

LOCALIZATION:
  Barcha text 100% o'zbekcha
  O'zbek hududlari (Toshkent, Samarqand, Namangan) first
  Milliy bayramlar bilan bog'liq eventlar
  Mahalliy referanslar (ko'chalar, landmark-lar)

COMMUNITY:
  Telegram community channel + group
  Discord (gaming community uchun)
  Weekly clan war results post
  Monthly territory champions announcement

PARTNERSHIP:
  O'zbek sport federatsiyalari (jogging events)
  Universitetlar (student competitions)
  Mahalliy media (Kun.uz, Daryo.uz feature story)
  Fitness studiyalar (promo codes)

KPI (6 oylik):
  Month 1: 1,000 DAU (beta)
  Month 3: 10,000 DAU
  Month 6: 50,000 DAU
  Conversion: 3-5% premium
```

---

## 14. Launch Plan

```
PRE-LAUNCH (Hafta -4 → -1):
  □ Beta signup form (Google Forms / Telegram bot)
  □ 200 beta tester jalb qilish
  □ Toshkent Map coverage test
  □ Server load testing
  □ "Coming soon" Instagram page

SOFT LAUNCH (Hafta 1):
  □ Beta release (TestFlight + APK)
  □ Feedback collection
  □ Bug fix sprint
  □ Influencer seeding (5-10 nano influencers)

PUBLIC LAUNCH (Hafta 2):
  □ Play Store + App Store live
  □ Press kit (Daryo.uz, Kun.uz, Gazeta.uz)
  □ Launch event (Toshkent city center territory race)
  □ Social media blast
  □ Referral campaign activation

POST-LAUNCH (Hafta 3-8):
  □ Daily monitoring: DAU, retention, crashes
  □ Weekly feature drops (notifications, clan wars)
  □ First monthly "Territory Champion" announcement
  □ Expansion: Samarqand, Namangan, Buxoro
```

---

## 15. UI Component Structure

```jsx
// Design System Primitives
<Button variant="primary|ghost|danger" />
<Badge color="purple|cyan|amber|green|red" />
<StatChip icon label value />
<GlassCard className />
<NeonText color />

// Game Components
<MapView />              // Full-screen map container
<CaptureControls />      // Start/stop + demo button
<HUD />                  // Overlay: XP, area, tracking progress
<TerritoryPolygon />     // Individual territory on map
<PlayerDot />            // Live player position marker
<CaptureProgress />      // Closing ring progress bar

// Social Components
<LeaderboardRow rank player />
<PodiumTop3 players />
<ClanCard clan />
<NotificationItem n />
<MemberRow player />

// Shared
<BottomNav />
<NotificationToast />
<Modal />
<Avatar emoji color />
<XPBar current total />
<RankBadge rank />
```

---

## 16. Tailwind Design System

```javascript
// tailwind.config.js ichida:
colors: {
  bg: { base, surface, elevated, border }
  neon: { purple, cyan, amber, green, red, pink }
  text: { primary, secondary, muted }
}
boxShadow: {
  'neon-purple', 'neon-cyan', 'neon-green', 'neon-red'
}
animation: {
  'glow', 'pulse-slow', 'slide-up', 'capture-ring'
}

// CSS Classes:
.glass-card    → backdrop-blur + semi-transparent bg + border
.neon-border   → purple glow border
.btn-primary   → purple bg + shadow + tap animation
.btn-ghost     → dark bg + border
.stat-chip     → small info chip with icon
```

---

## 17. Notification System

```
NOTIFICATION TURLARI:
  attack    → 🗡️ Red — "Hujum qilishmoqda!"    [URGENT]
  capture   → 📍 Green — "Hudud egallandi"      [normal]
  defend    → 🛡️ Cyan — "Himoya qilindi"       [normal]
  clan      → 👥 Cyan — "Jamoa xabari"          [normal]
  levelup   → ⚡ Amber — "Daraja ko'tarildi!"   [celebration]
  system    → ⚠️ Gray — "Tizim xabari"          [info]

DELIVERY CHANNELS:
  1. In-app toast (4 soniya, animated)
  2. Notification center (saqlanadi, read/unread)
  3. Push notification (FCM) — background da ham
  4. Badge count (bottom nav icon)

SERVER SIDE:
  Redis pub/sub → Socket.IO → client
  Firebase Cloud Messaging for background push
  Notification table in PostgreSQL (history)
```

---

## 18. Real-Time Battle Mechanics

```
HUJUM JARAYONI:

1. ATTACKER enters enemy territory (location detection)
2. Server detects overlap → starts BATTLE timer (60 sec)
3. Defender gets PUSH NOTIFICATION + in-app alert
4. Attacker walks path INSIDE enemy territory
5. If attacker closes shape inside enemy territory:
   → Enemy territory REDUCED by cut-out shape
   → Attacker gains that area
   → +100 XP bonus for conquest

DEFENDER OPTIONS (60 sec):
  a. Return to territory → automatic cancel
  b. Ignore → loses the area
  c. Counter-attack later

LIVE BATTLE INDICATORS:
  - Pulsing red border on attacked territory
  - Live player dot inside your territory (enemy!)
  - "Jang davom etmoqda" countdown timer
  - Both players see each other in real-time

CLAN WAR (Future):
  - Planned clan vs clan battles
  - Simultaneous multi-territory attacks
  - Clan XP + rewards
```

---

## 19. Clan System

```
CLAN FEATURES:
  ✓ Yaratish (badge + name + description)
  ✓ Qo'shilish (open / invite-only modes)
  ✓ Chiqish
  ✓ Leader board (clan total area)
  ✓ Member list + individual stats
  ✓ Ally territory color (green vs enemy red)

CLAN TERRITORIES:
  - Member territories show as same color (ally)
  - Clan total area = sum of all member areas
  - Clan ranking by total area

CLAN ROLES (Future):
  Leader → qabul qilish/chiqarish + settings
  Co-Leader → qabul qilish
  Member → normal play

CLAN WAR SYSTEM (V2):
  - Haftalik clan vs clan challenge
  - Capture points system
  - Clan war badge + rewards
  - Season-based ranking reset
```

---

## 20. Future Scaling Architecture

```
INFRA (Production):
  Frontend: Vercel / Cloudflare Pages (CDN)
  Backend: 4x Node.js instances + PM2 cluster
  DB: PostgreSQL (Supabase) + read replicas
  Cache: Redis Cloud (real-time + leaderboard)
  WebSocket: Socket.IO + Redis adapter (multi-node)
  Storage: Cloudflare R2 (avatars, clan badges)
  CDN: Cloudflare (map tiles cached)
  Push: Firebase Cloud Messaging

SCALING STRATEGY:
  0-10K users:    Single server + managed DB
  10K-100K:       2 app servers + Redis + CDN
  100K-1M:        Microservices split:
                    auth-service
                    territory-service
                    notification-service
                    leaderboard-service (read-heavy)
  1M+:            Kubernetes + geographic sharding
                  Territory data sharded by city

PERFORMANCE:
  Leaderboard: Materialized view, refresh 5 min
  Map tiles: CartoDB CDN (free) → Mapbox (paid, more control)
  Territory query: BBox index → PostGIS (upgrade)
  WS rooms: Geographic hex cells (H3 library)

GEOGRAPHIC EXPANSION PLAN:
  Phase 1: Toshkent (MVP)
  Phase 2: Samarqand, Namangan, Buxoro, Andijon
  Phase 3: Barcha viloyat markazlari
  Phase 4: Qozog'iston, Qirg'iziston (CIS expansion)
  Phase 5: Global
```

---

## Tech Stack Xulosa

```
Frontend:  React 18 + Vite + TailwindCSS + Framer Motion
Map:       Leaflet + react-leaflet (CartoDB dark tiles)
State:     Zustand + persist middleware
Router:    React Router v6
Icons:     Lucide React

Backend:   Node.js + Express + Socket.IO
Database:  PostgreSQL (Supabase)
Cache:     Redis (Upstash)
Auth:      JWT + bcrypt
Push:      Firebase Cloud Messaging

Deployment:
  Frontend → Vercel
  Backend  → Railway / Render
  DB       → Supabase
  Cache    → Upstash Redis
```
