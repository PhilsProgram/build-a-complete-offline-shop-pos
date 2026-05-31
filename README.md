# Offline Shop POS + Management System

Production-style offline-first POS scaffold for a local shop network.

The admin PC runs the Node.js server, owns the SQLite database at `server/database/pos.db`, and exposes the frontend/API to devices on the same WiFi/router. No cloud services, Firebase, or online database are used.

## Stack

- React + TypeScript + Vite + TailwindCSS
- React Router and Context API
- Node.js + Express REST API
- SQLite via `better-sqlite3`
- LAN-ready local server on `0.0.0.0`

## First Install

```bash
npm install
npm run db:init
```

Default seeded admin:

- Username: `admin`
- Password: `Admin@1234`

Change this password after first login.

## Development

```bash
npm run dev
```

- Frontend: `http://localhost:4173`
- Backend API: `http://localhost:4000/api`

For LAN testing in development, open the frontend using the admin PC LAN IP:

```text
http://192.168.x.x:4173
```

The Vite dev server proxies `/api` calls to the local backend.

## Production LAN Use

Build the frontend and server:

```bash
npm run build
npm start
```

The backend serves the built frontend and API from one LAN-accessible server:

```text
http://192.168.x.x:4000
```

Find the admin PC IPv4 address:

```powershell
ipconfig
```

Use the IPv4 address on other devices connected to the same router/WiFi.

## Progressive Web App

The frontend is installable as a PWA using the KET Dynasty icon from `frontend/public/App.png`.

Included PWA behavior:

- Install prompt on supported browsers
- Fullscreen/standalone app window after install
- App icons for desktop, Android, and iOS home screen
- Service worker app-shell caching
- Offline fallback for the already-loaded frontend
- Network-first caching for safe catalog/settings reads

Install from a LAN device by opening:

http://192.168.x.x:4000

Then use the browser install action or the in-app `Install App` button when it appears.

Sales, checkout, employee changes, stock writes, and reports still require the admin PC server because the shared SQLite database lives on that machine. The PWA cache keeps the interface launchable and improves resilience, but it does not create a separate device database.

Browser note: service workers are allowed on `localhost`, but phones/tablets usually require HTTPS for installable PWAs on a LAN IP. For real device installs, run the local server with a trusted LAN certificate:

```env
HTTPS_ENABLED=true
HTTPS_KEY_PATH=./certs/pos-key.pem
HTTPS_CERT_PATH=./certs/pos-cert.pem
```

Then open:

```text
https://192.168.x.x:4000
```

## Database

SQLite file:

```text
server/database/pos.db
```

The backend enables foreign keys and WAL mode. Backups are exported to `server/backups`.

## Automatic Nightly Backups

The server automatically creates a safe SQLite backup once per day. By default it runs every night at `23:59` and saves files like:

```text
server/backups/auto-pos-backup-2026-05-07-23-59-00.db
```

Backup settings:

```env
BACKUP_DIR=./backups
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_TIME=23:59
AUTO_BACKUP_RETENTION_DAYS=30
```

The scheduler checks every minute. If the admin PC was off at the scheduled time, the server creates that day's backup the next time it starts after the configured time. Manual admin exports still work and are saved separately as `pos-backup-...db`.

The running app uses SQLite's backup API rather than a raw copy so backups are consistent even while WAL mode is enabled.

## Environment

Copy examples if you need custom ports or secrets:

```bash
copy server\.env.example server\.env
copy frontend\.env.example frontend\.env
```

Important server settings:

- `HOST=0.0.0.0`
- `PORT=4000`
- `JWT_SECRET=change-this-before-real-use`
- `POS_DB_PATH=./database/pos.db`

## Core Modules

- Auth with admin/employee roles
- Admin dashboard and analytics
- Employee POS checkout
- Products, categories, inventory
- Employees and performance
- Customers/debtors
- Expenses
- Transactions and receipt reprint
- Reports
- End-of-day balancing
- Settings
- Database backup/restore endpoint

## Offline/LAN Notes

- Run the app on the admin PC.
- Keep the admin PC powered on while employees use POS devices.
- All devices use the same SQLite database because all writes go through the admin PC backend.
- Allow the selected port through the admin PC firewall for LAN devices.
