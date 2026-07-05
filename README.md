# 🚀 Event Fulfillment Engine (Codename: Distância Zero)

An end-to-end e-commerce, recurrent ticketing, and logistics platform designed to handle high concurrency in sales, physical product handoffs, and access control for large-scale events.

## 🧠 Architecture & Technical Decisions

This project was built to solve the "Ghost Cart Problem", prevent ticketing fraud, and guarantee data integrity during high-traffic spikes.

* **Atomic Stock Locking:** SQL transactions via RPC in Supabase to ensure inventory never drops below zero, even with hundreds of users purchasing in the exact same millisecond.
* **DZ Passport (Persistent Digital Identity):** A dynamic, glassmorphic digital pass with a persistent QR Code. The interface automatically updates in real-time when the user's presence is validated at the door.
* **Intelligent Check-in Engine:** Dual-mode validation (Camera Scanner + Manual Search) built to handle multi-profile accounts (e.g., families sharing one WhatsApp number), with strict anti-fraud checks to prevent duplicate entries per event.
* **Real-time Dashboard & Analytics:** WebSockets (Supabase Channels) for instant admin panel synchronization, featuring a "Raio-X" module that aggregates attendance metrics by congregation/origin in real-time.
* **Automated Ticketing:** Serverless integration with Z-API for instant receipts and dynamic ticket link dispatching via WhatsApp.

## 🛠️ Tech Stack

* **Front-end:** Next.js (App Router), React, Tailwind CSS (Glassmorphism UI), Lucide Icons.
* **Back-end/BaaS:** Supabase (PostgreSQL, Auth, Storage, Real-time).
* **Integrations:** Z-API (WhatsApp Automation), React QR Scanner, React-QR-Code.
* **Deploy:** Vercel (Edge Network & Serverless Functions).

## 🛒 Order Lifecycle (E-commerce)
1. `Pending`: Inventory reservation on the storefront.
2. `Approved`: Financial validation and payment confirmation notification via WhatsApp.
3. `Delivered`: Physical QR Code scanning at the event/warehouse, permanently syncing virtual and physical inventory.

## 🎟️ Access Lifecycle (Ticketing)
1. `Registered`: User creates an account (or is added via the Admin Fast POS) and gets assigned a unique UUID.
2. `Ticket Dispatched`: Dynamic link is sent via WhatsApp with their persistent QR Code.
3. `Event Configured`: Admin creates a specific session/event on the dashboard.
4. `Checked-In`: User's QR Code is scanned at the door. The system validates the specific event, registers the timestamp, increments their presence history, and blocks double-scanning.
