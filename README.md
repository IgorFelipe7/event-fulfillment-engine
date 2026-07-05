<div align="center">
  
  <h1>🎟️ Event Fulfillment & Ticketing Engine</h1>
  <p><i>Codename: <b>Distância Zero</b></i></p>

  <p>
    An end-to-end e-commerce, recurrent ticketing, and logistics platform designed to handle high concurrency in sales, physical product handoffs, and access control for large-scale events.
  </p>

  <div>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </div>

  <br />
</div>

---

## 🧠 Architecture & Engineering Highlights

This architecture was specifically engineered to solve the **"Ghost Cart Problem"**, prevent ticketing fraud, and guarantee strict data integrity during burst traffic spikes (e.g., ticket drops).

* 🔒 **Atomic Stock Locking (ACID Compliant):** Built with custom PostgreSQL RPCs via Supabase. Ensures inventory never drops below zero by handling row-level locks, even if hundreds of users checkout in the exact same millisecond.
* 🪪 **DZ Passport (Persistent Digital Identity):** A dynamic, glassmorphic digital pass with a persistent QR Code. The UI automatically updates in real-time when the user's presence is validated at the door.
* 🎯 **Intelligent Check-in Engine:** Dual-mode validation (Camera Scanner + Manual Search) built to smoothly handle multi-profile accounts (e.g., families sharing a single WhatsApp number), with strict anti-fraud checks preventing duplicate entries per event.
* 📊 **Real-time Dashboard & Analytics:** Powered by WebSockets (Supabase Channels) for instant admin panel synchronization. Features a "Raio-X" module aggregating attendance metrics and congregation rankings in real-time.
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
| 📅 | **Configured** | Admin configures an active session/event on the command center. |
| ✅ | **Checked-In** | QR Code scanned at the door. System validates the event constraint, records the timestamp, increments presence history, and locks double-scanning. |

---

## 💻 Getting Started (Local Development)

Follow these steps to run the engine locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* A [Supabase](https://supabase.com/) project (with PostgreSQL running)

### 1. Clone & Install
```bash
git clone [https://github.com/IgorFelipe7/event-fulfillment-engine.git](https://github.com/IgorFelipe7/event-fulfillment-engine.git)
cd event-fulfillment-engine
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
* **`/presenca`** - Ticketing Search & Registration Gateway
* **`/admin`** - Central Command Dashboard (Inventory, Real-time Sales, Check-in Scanner)

### 4. Build for Production
```bash
npm run build
npm start
```

---

<div align="center">
  <p>Built with ⚡ for high performance and seamless user experiences.</p>
</div>
