<div align="center">
  
  <h1>🎟️ Event Fulfillment Engine</h1>
  <p><i>Codename: <b>Distância Zero</b></i></p>

  <p>
    An end-to-end e-commerce, recurrent ticketing, and logistics platform designed to handle high concurrency in sales, physical product handoffs, and access control for large-scale events.
  </p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </div>

  <br />
</div>

---

## 🧠 Architecture & Technical Highlights

This architecture was specifically engineered to solve the **"Ghost Cart Problem"**, prevent ticketing fraud, and guarantee strict data integrity during high-traffic spikes.

* 🔒 **Atomic Stock Locking:** Built with SQL transactions (RPC) in Supabase. Ensures inventory never drops below zero, even if hundreds of users checkout in the exact same millisecond.
* 🪪 **DZ Passport (Persistent Digital Identity):** A dynamic, glassmorphic digital pass with a persistent QR Code. The interface automatically updates in real-time when the user's presence is validated at the door.
* 🎯 **Intelligent Check-in Engine:** Dual-mode validation (Camera Scanner + Manual Search) built to handle multi-profile accounts (e.g., families sharing one WhatsApp number), with strict anti-fraud checks preventing duplicate entries per event.
* 📊 **Real-time Dashboard & Analytics:** Powered by WebSockets (Supabase Channels) for instant admin panel synchronization. Features a "Raio-X" module aggregating attendance metrics by origin in real-time.
* 🤖 **Automated Ticketing:** Serverless integration with Z-API for instant receipts and dynamic ticket link dispatching directly via WhatsApp.

---

## ⚙️ Core Lifecycles

### 🛒 Order Fulfillment (E-commerce)
| Step | Phase | Description |
| :---: | :--- | :--- |
| ⏳ | **Pending** | Inventory reservation on the storefront. |
| 💳 | **Approved** | Financial validation and payment confirmation notification via WhatsApp. |
| 📦 | **Delivered** | Physical QR Code scanning at the event/warehouse, permanently syncing virtual and physical inventory. |

### 🎫 Access Control (Ticketing)
| Step | Phase | Description |
| :---: | :--- | :--- |
| 📝 | **Registered** | User creates an account (or is added via Admin POS) and receives a unique UUID. |
| 📲 | **Dispatched** | Dynamic persistent QR Code link is sent automatically via WhatsApp. |
| 📅 | **Configured** | Admin creates a specific session/event on the dashboard. |
| ✅ | **Checked-In** | QR Code scanned at the door. Validates the event, registers timestamp, increments presence history, and blocks double-scanning. |

---

<div align="center">
  <p>Built with ⚡ for high performance and seamless user experience.</p>
</div>
