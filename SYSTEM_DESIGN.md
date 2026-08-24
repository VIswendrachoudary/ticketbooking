# Ticket Booking System - System Design Architecture

## Overview
This system is an enterprise-grade high-demand event ticketing platform designed to handle peak booking spikes (e.g. instant sell-outs for blockbuster movies and stadium concerts), zero double-booking concurrency guarantees, automated seat hold TTL expirations, and real-time waitlist reallocations upon booking cancellations.

---

## 1. Seat Hold and TTL Mechanism

### Operational Flow
1. **Hold Acquisition**: When a customer selects seats on the visual grid and clicks "Place Hold", the backend validates seat availability and applies a status transition from `AVAILABLE` to `HELD`. 
2. **Configurable TTL**: A configurable Expiration Timestamp (`holdExpiresAt = NOW() + HOLD_TTL_SECONDS`, default 10 minutes / 600s) and `heldByUserId` are stored directly on the `ShowSeat` record.
3. **Background Sweeper Loop (`ttlWorker.ts`)**: A background worker executes every 5 seconds inspecting expired holds (`status = 'HELD'` AND `holdExpiresAt <= NOW()`).
4. **Auto-Release & Promotion**:
   - If an active waitlist queue exists for that show and seat category, the sweeper **automatically promotes** the seat to the next waitlisted user rather than dropping it to public pool.
   - If no waitlist exists, the seat status resets to `AVAILABLE`, and a real-time event is broadcast via WebSockets.
5. **Client-Side Countdown**: The frontend `CheckoutDrawer` syncs with `holdExpiresAt` to display a live countdown timer (`mm:ss`). If the timer hits zero, the client auto-releases the hold and updates the UI map dynamically.

---

## 2. Concurrency Protection Architecture

### Race Condition Scenarios
When thousands of users attempt to select and book the exact same seat (e.g. VIP Seat A1) at the same millisecond, standard read-then-write logic causes race conditions leading to duplicate seat holds or double bookings.

### Multi-Layer Concurrency Strategy
1. **Redis / Distributed Mutex Locks**:
   - Before executing DB operations for a show's seat selection, an atomic lock key (`show:{showId}:hold`) is requested via Redis `SET key val PX 3000 NX` (with in-memory mutex fallback).
2. **Atomic Database Transactions & Optimistic Locking**:
   - Database operations execute inside an atomic Prisma transaction.
   - The status update query enforces strict conditional filtering:
     ```sql
     UPDATE "ShowSeat"
     SET "status" = 'HELD', "heldByUserId" = :userId, "holdExpiresAt" = :expiresAt, "version" = "version" + 1
     WHERE "id" IN (:seatIds)
       AND ("status" = 'AVAILABLE' OR "heldByUserId" = :userId OR "holdExpiresAt" <= NOW());
     ```
3. **Strict Validation**:
   - If the returned modified row count does not equal the requested seat count, another user completed the transaction a fraction of a millisecond earlier.
   - The transaction immediately aborts and returns an explicit `HTTP 409 Conflict` error ("Seat A1 is currently held by another customer").
4. **Empirical Concurrency Verification**:
   - An automated script (`scripts/concurrency-test.ts`) simulates 10 parallel asynchronous HTTP POST requests at the exact same millisecond. Strictly 1 request succeeds (200 OK) while 9 requests safely receive 409 Conflict.

---

## 3. Waitlist Auto-Assignment & Time-Limited Offer Flow

```
   [Booking Cancelled / Seat Expired]
                  │
                  ▼
   [Inspect Waitlist Queue (FIFO)] ─── (No candidates) ───► [Reset Seat to AVAILABLE]
                  │
          (Candidate found)
                  ▼
  [Status: OFFERED, generate offerToken]
  [Set offerExpiresAt = NOW() + OFFER_TTL]
                  │
                  ▼
   [Dispatch Email Notification with Claim Link]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 [User Claims Offer]   [Offer Expires]
        │                   │
        ▼                   ▼
 [Seat Booked]       [Offer EXPIRED ──► Re-offer to Next Candidate]
```

1. **Queue Structure**:
   - Each show maintains a dedicated `Waitlist` queue per seat category (`VIP`, `PREMIUM`, `STANDARD`), ordered chronologically (`createdAt ASC`, FIFO).
2. **Automated Trigger on Cancellation**:
   - When a booking is cancelled via `cancelBooking()`, the seats immediately return to the reallocation engine.
   - For each seat, `processWaitlistForSeat()` inspects the earliest `WAITING` candidate for that show & category.
3. **Time-Limited Offer Generation**:
   - The seat transitions to status `OFFERED`.
   - A unique cryptographic `offerToken` is generated alongside a hard expiration timestamp (`offerExpiresAt = NOW() + 15 minutes`).
   - An email notification is sent containing a secure claim link: `/claim-offer/:offerToken`.
4. **Cascading Rollover on Expiry**:
   - If the waitlisted customer does not claim the offer within 15 minutes, the TTL sweeper marks the waitlist entry as `EXPIRED` and automatically offers the seat to the **next candidate in line**.

---

## 4. Real-Time Status Updates & Email Tickets

1. **WebSockets (Socket.IO)**:
   - Frontend clients join room `show:{showId}`. Whenever any seat status changes (`AVAILABLE`, `HELD`, `BOOKED`, `OFFERED`), `broadcastSeatUpdate` notifies all viewing clients to re-render without page refreshes.
2. **QR Code Ticket Generation**:
   - Upon confirmed checkout, a unique reference (`TKT-2026-XXXXX`) is generated.
   - High-density QR codes are generated encoding ticket metadata and attached inline as HTML image attachments in Nodemailer dispatches.
