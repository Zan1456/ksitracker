# Repline — Edzéskövető

Szintenkénti edzésterveket követő webalkalmazás: 3 szint × 4 edzés, feladatonként ismétlés-, idő- vagy stoppermérős célokkal, fókusz-módú időzítővel, napi 1 edzés limittel, ranglistával és admin felülettel. A dizájn a Vercel weboldalának minimalista, sötét, Geist betűtípusos stílusát követi.

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Neon** (serverless Postgres) + **Drizzle ORM**
- **Auth.js (NextAuth v5)** — e-mail/jelszó bejelentkezés (bcrypt), opcionális Google OAuth
- **Tailwind CSS v4** — a mockup design tokenjeivel (sötét/világos téma)
- Geist / Geist Mono betűtípus

## Első indítás

### 1. Függőségek

```bash
npm install
```

### 2. Neon adatbázis létrehozása

1. Regisztrálj / jelentkezz be a [neon.tech](https://neon.tech) oldalon, és hozz létre egy új projektet.
2. A Dashboardon **Connect** → válaszd a **Pooled connection**-t, és másold ki a connection stringet
   (`postgresql://user:password@ep-xxxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require`).

### 3. Környezeti változók

```bash
cp .env.example .env.local
```

Töltsd ki:

- `DATABASE_URL` — a Neon connection string
- `AUTH_SECRET` — generáld le: `npx auth secret`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — opcionális; enélkül a "Folytatás Google-fiókkal" gomb látszik, de inaktív
- `NEXTAUTH_URL` — helyi fejlesztéshez maradhat `http://localhost:3000`

### 4. Séma létrehozása és feltöltés

```bash
npm run db:push    # táblák létrehozása a Neon adatbázisban a séma alapján
npm run db:seed     # 3 szint × 4 edzés + feladatok, és egy admin fiók
```

A seed script egy admin belépést is létrehoz:

- **E-mail:** `admin@repline.app`
- **Jelszó:** `admin1234`

(Felülírható a `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env változókkal a seed futtatása előtt.)

Rendes felhasználói fiókot a `/register` oldalon lehet létrehozni.

### 5. Fejlesztői szerver

```bash
npm run dev
```

Nyisd meg: [http://localhost:3000](http://localhost:3000)

## Egyéb hasznos parancsok

| Parancs | Leírás |
| --- | --- |
| `npm run db:generate` | Drizzle migrációs SQL generálása a séma (`src/db/schema.ts`) alapján |
| `npm run db:migrate` | Generált migrációk futtatása |
| `npm run db:push` | Séma közvetlen szinkronizálása (gyors iterációhoz) |
| `npm run db:studio` | Drizzle Studio — vizuális adatbázis-böngésző |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Domain modell / működés

- **Szintek → Edzések → Feladatok**: 3 szint, szintenként 4 edzés, edzésenként több feladat.
- **Feladat típusok**:
  - `reps` — ismétlésszám alapú (pl. "15 fekvőtámasz", opcionálisan több körben)
  - `time` — időhöz kötött, countdown időzítővel vezetett feladat (pl. "1:30 fal melletti ülés")
  - `stopwatch` — a felhasználó saját eredményét rögzíti (idő vagy ismétlésszám), ezek kerülnek be a **ranglistába**
- **Napi limit**: felhasználónként naponta 1 edzés fejezhető be. Admin a "Napi limit feloldása" gombbal egy adott napra +1 edzést engedélyezhet.
- **Szintek/edzések feloldása**: egy szint addig zárolt, amíg az előző szint összes edzése nincs kész; egy szinten belül az edzések sorban oldódnak fel.
- **Fókusz mód** (`/workout/[id]/live`): egy feladatot mutat egyszerre, countdown / stopper / AMRAP logikával, a feladat végén automatikusan lép a következőre.
- **Ranglista** (`/leaderboard`): a stopperes feladatok (pl. "Sprint 400 m", "Plank") felhasználónkénti legjobb eredménye alapján, kategóriánként szűrhető.
- **Admin** (`/admin`, csak `role: admin` felhasználóknak): felhasználók keresése/szűrése, részletes nézet szintenkénti készültséggel és legjobb idővel, felhasználó tiltása/feloldása, napi limit feloldása, edzéstervek és aggregált statisztika áttekintése.

## Megjegyzések / egyszerűsítések

- A "nap" határa UTC éjfél — ha valós, sok időzónás felhasználóbázisra szánod, érdemes a `todayIso()` / `getWeekStrip()` logikát (`src/lib/format.ts`, `src/lib/workout-data.ts`) felhasználói időzónára cserélni.
- A Google bejelentkezés csak akkor aktív, ha a `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` be van állítva.
- Az admin fiók a seedből jön létre; nincs külön admin-meghívó UI — ha további adminra van szükség, állítsd át a `role` mezőt közvetlenül az adatbázisban (pl. `npm run db:studio`).
