# 🚀 Event Fulfillment Engine (Codename: Distância Zero)

An end-to-end e-commerce, ticketing, and logistics platform designed to handle high concurrency in sales and physical product handoffs for large-scale events.

## 🧠 Architecture & Technical Decisions

This project was built to solve the "Ghost Cart Problem" and guarantee data integrity during high-traffic spikes.

* **Atomic Stock Locking:** SQL transactions via RPC in Supabase to ensure inventory never drops below zero, even with hundreds of users purchasing in the exact same millisecond.
* **Real-time Dashboard:** WebSockets (Supabase Channels) for instant admin panel synchronization across multiple devices during the live event.
* **Automated Ticketing:** Serverless integration with Z-API for instant receipts and dynamic QR Code generation via WhatsApp.
* **Native Fulfillment:** Integrated front-end QR Code scanner for seamless ticket validation and real-time physical inventory deduction.

## 🛠️ Tech Stack

* **Front-end:** Next.js (App Router), React, Tailwind CSS, Lucide Icons.
* **Back-end/BaaS:** Supabase (PostgreSQL, Auth, Storage, Real-time).
* **Integrations:** Z-API (WhatsApp Automation), React QR Scanner.
* **Deploy:** Vercel (Edge Network & Serverless Functions).

## ⚙️ Order Lifecycle
1. `Pending`: Inventory reservation on the storefront.
2. `Approved`: Financial validation (PIX) and Digital Ticket (QR Code) dispatch via WhatsApp.
3. `Delivered`: Physical QR Code scanning at the warehouse, syncing virtual and physical inventory.