# Ticket Booking Platform - Movies & Concerts

[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com)
[![Firebase Auth](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)](https://firebase.google.com)
[![Prisma SQLite/Postgres](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Glassmorphism-38B2AC?logo=tailwindcss)](https://tailwindcss.com)

An ultra-premium, high-concurrency ticket booking platform for movies and concerts built with Node.js, Express, React, WebSockets, Prisma ORM, Firebase Web SDK, and Glassmorphism UI.

🔗 **GitHub Repository**: [https://github.com/VIswendrachoudary/ticketbooking](https://github.com/VIswendrachoudary/ticketbooking)

---

## 🌟 Key Features

1. **Firebase Authentication**:
   - Integrated with Firebase Web SDK (`ticketbookin-7f4d2`).
   - Supports **Firebase Google OAuth**, **Email/Password**, and **Instant One-Click Demo Sign-In**.
2. **Interactive 3D Visual Seat Map**:
   - Category seat tiles (VIP Gold, Premium Violet, Standard Cyan) with real-time status sync via Socket.IO.
3. **10-Minute Hold Reservation TTL**:
   - Atomic concurrency protection preventing double-bookings, background sweeper releasing expired holds, and circular countdown timer.
4. **Automated Category Waitlist Queue**:
   - Sold-out categories queue waitlist candidates with 15-minute time-limited claim offer links upon seat cancellations.
5. **Digital QR Code Tickets**:
   - Instant vector SVG & PNG QR code generation with HTML email dispatch via Nodemailer.
6. **Multi-Currency Converter**:
   - Real-time conversion across **USD ($)**, **EUR (€)**, **GBP (£)**, and **INR (₹)**.
7. **Promo & Discount Engine**:
   - Apply discount codes (`VIP20` for 20% off, `FIRST10` for $10 off).
8. **Event Add-ons & VIP Merchandise**:
   - Gourmet Popcorn Combos ($12), IMAX 3D Laser Glasses ($5), VIP Fast-Track Entry ($20).

---

## ⚡ Vercel Deployment Instructions

### Method 1: Deploying via Vercel Dashboard (Recommended)

1. Fork or push this repository to GitHub: [`https://github.com/VIswendrachoudary/ticketbooking`](https://github.com/VIswendrachoudary/ticketbooking)
2. Log into [Vercel Dashboard](https://vercel.com) and click **"Add New..."** -> **"Project"**.
3. Import `VIswendrachoudary/ticketbooking`.
4. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave blank/default)
   - **Build Command**: `npm run build -w frontend`
   - **Output Directory**: `frontend/dist`
5. Add Environment Variables:
   - `DATABASE_URL`: `file:./dev.db` (or PostgreSQL connection URL)
   - `JWT_SECRET`: `super-secret-key-12345`
6. Click **"Deploy"**!

### Method 2: Deploying via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy project
vercel
```

---

## 🛠️ Local Setup Guide

```bash
# 1. Clone Repository
git clone https://github.com/VIswendrachoudary/ticketbooking.git
cd ticketbooking

# 2. Install Workspace Dependencies
npm install

# 3. Push Prisma Schema & Seed Demo Database
npm run seed -w backend

# 4. Start Local Development Servers
npm run dev
```

- **Frontend App**: `http://localhost:5173` (or `http://localhost:5174`)
- **Backend API**: `http://localhost:3000`

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Customer 1** | `customer1@gmail.com` | `password123` |
| **Customer 2** | `customer2@gmail.com` | `password123` |
| **Organiser** | `organiser@cinema.com` | `password123` |
| **Admin** | `admin@tickets.com` | `password123` |

---

## 🧪 Automated Concurrency Race Condition Test

```bash
npm run test:concurrency -w backend
```
Executes 10 parallel HTTP POST requests targeting seat `A1` at the exact same millisecond. Strictly **1 request wins (`200 OK`)** and **9 receive `409 Conflict`**.
