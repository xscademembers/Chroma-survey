# Dr Sunita Aesthetics Survey App

Production-style patient check-in and lead-attribution app built with Next.js (App Router), MongoDB, and a dashboard for operations + analytics.

This README is intentionally written as a **replication blueprint**, so you can use this project to create another similar clinic survey/check-in product quickly.

---

## 1) What this project does

### Patient-facing flow (`/`)
- Multi-step check-in form with progress bar and conditional navigation.
- Supports two journeys:
  - **First-time visitor**
  - **Returning visitor** (mobile number lookup, greet if found).
- Captures:
  - Visit type, name, mobile, age, gender, address
  - Procedure category and procedure reason
  - Lead source (+ optional "Other" details)
- Saves submissions into MongoDB via `/api/patients`.

### Admin flow (`/dashboard`)
- Login screen (credentials validated through `/api/login`).
- Session flag stored in browser localStorage (`drsunita_admin_session`).
- Three dashboard tabs:
  - **Data Table**: searchable patient records
  - **Analytics**: charts for source, visit type, demographics, categories, procedures, ad attribution
  - **Settings**: manage categorized procedure reasons and lead sources (saved in DB via `/api/options`)

---

## 2) Tech stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind CSS
- **Charts**: Recharts
- **Database**: MongoDB (`mongodb` native driver)
- **Icons**: `lucide-react`
- **Utilities**: `date-fns`

---

## 3) Project structure

```text
app/
  layout.tsx                  # global metadata + root layout
  page.tsx                    # patient check-in app (all slide logic)
  dashboard/page.tsx          # admin shell (auth + tabs)
  api/
    patients/route.ts         # GET patients, POST submission
    patients/lookup/route.ts  # returning user lookup by mobile
    options/route.ts          # GET/POST form options (reasons/sources)
    login/route.ts            # admin login
    seed/route.ts             # create/check default admin

components/
  Button.tsx
  OptionCard.tsx
  ProgressBar.tsx
  dashboard/
    Login.tsx
    PatientTable.tsx
    Analytics.tsx
    Settings.tsx
    Dashboard.tsx             # legacy/alternate dashboard wrapper

lib/
  mongodb.ts                  # MongoClient singleton connection

scripts/
  seed-admin.ts               # CLI seed script for default admin

types.ts                      # shared enums/interfaces/default options
```

---

## 4) Data model (MongoDB)

Database name used in code: **`dr_sunita_db`**

Collections:
- `patients`
- `admins`
- `form_options`

### `patients` document shape
```ts
{
  fullName: string;
  mobileNumber: string;
  visitType?: "First-Time" | "Returning";
  age?: string;
  gender?: string;
  address?: string;
  selectedCategory?: string;
  reason?: string;
  leadSource?: string;
  otherSourceDetails?: string;
  adAttribution?: string;
  submittedAt: Date;
  source: "nextjs-dr-sunita-app";
  userAgent: string;
}
```

### `admins` document shape
```ts
{
  username: string;
  password: string; // currently plain text in this codebase
  createdAt: Date;
  role: "admin";
}
```

### `form_options` document shape
```ts
{
  key: "global_options";
  reasons: Array<{ name: string; items: string[] }>;
  sources: string[];
  updatedAt: Date;
}
```

---

## 5) API reference

### `GET /api/patients`
- Returns all patient submissions sorted by newest first.

### `POST /api/patients`
- Saves a patient record.
- Includes a duplicate-protection check (same name + mobile + reason + category within last 5 seconds).

### `POST /api/patients/lookup`
- Input: `{ mobileNumber }`
- Returns latest matching patient name if found.

### `GET /api/options`
- Returns form options from DB.
- If no options document exists, returns empty arrays (`{ reasons: [], sources: [] }`).

### `POST /api/options`
- Input:
```json
{
  "reasons": [{ "name": "Category", "items": ["Option A"] }],
  "sources": ["Google Search", "Instagram", "Other"]
}
```
- Upserts `global_options`.

### `POST /api/login`
- Validates username/password against `admins` collection.
- Auto-seeds default admin if `admin` user does not exist.

### `GET /api/seed`
- Checks whether default admin exists.

### `POST /api/seed`
- Creates default admin if missing.

---

## 6) Local setup

### Prerequisites
- Node.js 18+ (recommended: latest LTS)
- npm
- MongoDB Atlas (or compatible MongoDB URI)

### Install and run
```bash
npm install
npm run dev
```

Open:
- App: [http://localhost:3000](http://localhost:3000)
- Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### Optional seed
```bash
npm run seed
```
or:
```bash
curl -X POST http://localhost:3000/api/seed
```

---

## 7) Environment configuration (important)

Current code supports:
- `MONGODB_URI` environment variable (preferred)
- fallback hardcoded URI in `lib/mongodb.ts` and `scripts/seed-admin.ts` (not recommended)

Create `.env.local`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
```

Then update code to remove hardcoded connection string usage for secure cloning/deployment.

---

## 8) Default credentials

Current default admin credentials:
- Username: `admin`
- Password: `password`

These are intended only for initial setup and should be replaced.

---

## 9) How to clone this into a new similar project

Use this checklist when creating a new clinic/brand implementation:

1. **Clone this repository and rename the project metadata**
   - Update `package.json` name
   - Update app title/description in `app/layout.tsx`
   - Update visible brand strings in `app/page.tsx` and dashboard components

2. **Configure your own MongoDB**
   - Set `MONGODB_URI` in `.env.local`
   - Remove hardcoded URI values
   - Optionally change database name (`dr_sunita_db`) across:
     - `app/api/*`
     - `scripts/seed-admin.ts`

3. **Define your intake form taxonomy**
   - Update default categories/sources in `types.ts`
   - Or manage everything from dashboard Settings after first run

4. **Update attribution channels**
   - Revise `AD_SOURCES` and `AdType` values in `types.ts`
   - Adjust attribution UI questions/slides in `app/page.tsx`

5. **Update media assets (if using visual source selection)**
   - Replace externally hosted media URLs in `app/page.tsx`

6. **Harden authentication/security (high priority)**
   - Hash passwords (e.g. bcrypt)
   - Replace localStorage-only auth with server/session auth
   - Add route protection middleware for `/dashboard`

7. **Deploy**
   - Set environment variables in hosting platform
   - Verify API routes and dashboard workflows on production

---

## 10) Operational notes

- Form options are DB-driven. If options are empty in DB, the app falls back to local defaults on the client for a usable form experience.
- Dashboard refresh button refetches patient records from `/api/patients`.
- Search in Data Table matches: name, mobile, category, reason, gender, address.
- Analytics are computed client-side from fetched patient records.

---

## 11) Scripts

```bash
npm run dev      # start development server
npm run build    # production build
npm run start    # run production server
npm run lint     # run linter
npm run seed     # seed default admin using scripts/seed-admin.ts
```

---

## 12) Known limitations and recommended improvements

- Admin password is currently stored in plain text.
- Dashboard auth relies on localStorage session flag.
- No role-based access control.
- No pagination/export on patient table.
- No automated tests yet.

For production use in a new project, implement authentication hardening, secrets management, logging, and tests before go-live.
