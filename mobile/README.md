# Emergency Responder App

A mobile emergency response application that connects users to nearby responders (CDRRMO, MDRRMO, Police, Fire) based on their exact location, with offline fallback capability.

## 🏗️ Architecture

**Supabase-Only Backend** - No separate backend server needed!

```
Mobile App → Supabase (PostgreSQL + Realtime)
```

- Direct database access via Supabase client
- Real-time updates via Supabase Realtime
- Offline queue syncs when back online
- Row Level Security for data protection

## 🚀 Features

- **📍 GPS Location Detection** - Automatic location tracking with high accuracy
- **🚨 SOS Emergency Button** - One-tap emergency response activation
- **📱 Offline Mode** - Queues requests, syncs when online
- **☁️ Supabase Integration** - Real-time incident reporting
- **💾 Local Database** - SQLite storage for emergency contacts
- **🗺️ Dark Map UI** - Geoapify-powered map display

## 📱 Tech Stack

- **Expo SDK 54** (TypeScript)
- **React Native 0.81**
- **Supabase** - Database + Realtime + Auth
- **expo-location** - GPS & geolocation
- **expo-sqlite** - Local database
- **Geoapify** - Map tiles

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase Project (with anon key)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   Edit `src/config/app.config.ts` with your Supabase credentials:
   ```typescript
   SUPABASE_CONFIG = {
       url: 'https://your-project.supabase.co',
       anonKey: 'your-anon-key',
   }
   ```

3. **Start the development server:**
   ```bash
   npx expo start --tunnel
   ```

4. **Run on device:**
   - Scan QR code with Expo Go app
   - iOS: Press `i`
   - Android: Press `a`

## 📂 Project Structure

```
mobile/
├── App.tsx                          # Root component
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Main SOS screen
│   │   └── ActiveEmergencyScreen   # Active emergency UI
│   ├── components/
│   │   ├── GeoapifyMap.tsx         # Dark map component
│   │   ├── SOSButton.tsx           # Emergency button
│   │   └── StatusBadge.tsx         # Status indicators
│   ├── services/
│   │   ├── emergencyApiService.ts  # Supabase API
│   │   ├── networkService.ts       # Online/offline detection
│   │   ├── offlineQueueService.ts  # Offline queue
│   │   └── locationService.ts      # GPS & location
│   ├── contexts/
│   │   └── AppContext.tsx          # Global state
│   ├── lib/
│   │   └── supabase.ts             # Supabase client
│   └── config/
│       └── app.config.ts           # App configuration
```

## 🔒 Permissions Required

### iOS
- Location (When in Use)
- Location (Always) - for background tracking
- Camera - for emergency documentation

### Android
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- SEND_SMS
- CALL_PHONE

## 🧪 Testing

### Test Location (Butuan City)
```
Latitude: 8.9475
Longitude: 125.5406
```

### Test Emergency Flow

1. Open app
2. Grant location permissions
3. Wait for location to be detected
4. Press emergency button
5. Confirm emergency action
6. App will call/SMS emergency responders

## 🏗️ Build for Production

### Android (APK)
```bash
npx eas build --platform android
```

### iOS (IPA)
```bash
npx eas build --platform ios
```

## 📝 Environment Variables

Create `.env` file:
```
API_BASE_URL=https://your-backend-api.com/api
```

## ⚠️ Important Notes

- **Emergency Numbers**: Sample numbers are pre-loaded. Replace with real verified numbers before production.
- **Coverage Area**: MVP focuses on Caraga region. Additional regions require data collection.
- **Anti-Abuse**: Production version should add user registration and verification.

## 🚦 Current Status

✅ GPS location detection
✅ City/municipality detection  
✅ Emergency button UI
✅ Offline mode (SMS/Call)
✅ SQLite database
⚠️ Backend API integration (requires backend)
⏳ User authentication (future)
⏳ Admin dashboard (future)

## 📞 Support

For issues or questions, contact the development team.

## 📄 License

MIT License - See LICENSE file for details
