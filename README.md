# StatusPage App

A modern and minimal *status page application* built using *FastAPI* ,*React(Vite)* and *Clerk*, designed to help teams share real-time operational status of their services. Inspired by tools like StatusPage.io and BetterStack.

---

## Features

### ✅ Authentication with Clerk
- Secure and seamless login using *Clerk*.
- Admin routes protected to ensure only authorized users can update service status or incidents.

### 🚦 Service Monitoring Dashboard
- Add, update, and remove services.
- Assign and track current status (Operational, Degraded, Down, etc.).
- Display relevant messages for transparency during outages or degradations.

### 🌐 Public Status Page
- A clean, user-friendly interface to communicate the real-time status of your services to end users.
- Incident history and updates shown transparently.

### ⚡ Real-time Updates with WebSockets
- Uses *WebSockets* to push real-time service status updates to the public status page without requiring refreshes.

### ⚙ Automatic Scheduled Incident Handling
- Schedule upcoming incidents (e.g., maintenance windows).
- Incident statuses are *automatically updated* at the scheduled start and end times using a *background scheduler*.

### 📡 Incident Management
- Log incidents with custom messages, severity, and timestamps.
- Add resolution updates and auto-archive resolved incidents.

### 🚀 FastAPI Backend
- Built with *FastAPI* for high-performance asynchronous APIs.
- RESTful endpoints to manage services, incidents, and public views.

---
