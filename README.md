# 🚀 CloudPilot (formerly Horizon-Dashboard)

[![GitHub License](https://img.shields.io/github/license/pushpak-23/CloudPilot?color=blue)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/pushpak-23/CloudPilot?style=social)](https://github.com/pushpak-23/CloudPilot)
[![Vue Version](https://img.shields.io/badge/Vue-3.5%2B-emerald?logo=vue.js)](https://vuejs.org/)
[![Vite Version](https://img.shields.io/badge/Vite-6.0%2B-purple?logo=vite)](https://vite.dev/)
[![Axum Backend](https://img.shields.io/badge/Rust-Axum-orange?logo=rust)](https://github.com/tokio-rs/axum)

CloudPilot is a premium, high-performance, next-generation **OpenStack Horizon alternative**. Designed with a modern, glassmorphic dark-mode aesthetic, it provides an intuitive single-page application (SPA) control plane to manage compute, storage, networking, load balancers, and Heat orchestration.

If you are looking for a fast, responsive, and beautiful alternative to the legacy Django-based OpenStack Horizon dashboard, CloudPilot is built for you.

---

## 🌟 Why CloudPilot? (Horizon vs. CloudPilot)

| Feature | Legacy OpenStack Horizon | 🚀 CloudPilot |
| :--- | :--- | :--- |
| **Architecture** | Server-side rendered Django (Multiple page reloads) | Single Page Application (Vue 3, Vite, reactive state) |
| **Performance** | Slow page transitions, blocking API queries | Non-blocking parallel queries, zero-reload scoping |
| **UI Aesthetics** | Legacy Bootstrap 3 (Light mode, boxy tables) | Premium Glassmorphism (HSL themes, micro-animations) |
| **Network Topology** | Static HTML5 canvas map, slow port queries | Optimized Vis.js interactive canvas (N-to-1 queries) |
| **Orchestration** | Basic Heat stack listings, table resource lists | Full radial-tree HOT layout builder & interactive map |
| **Project Scoping** | Slow full-page scoped token swaps | In-place silent Keystone token exchange |

---

## ✨ Features

### 🖥️ Compute Control Plane (Nova & Glance)
* **Instance Operations**: Boot, terminate, power off, reboot, and resize virtual machines.
* **OS Images**: Manage Glance images, formats, visibility, and properties.
* **Flavors**: Custom flavor creation and instance resizing templates.
* **Bulk Deployer**: Batch provisioning wizard for fast multi-VM deployments.

### 🔌 SDN Networking (Neutron)
* **Network & Subnet management**: Visual IP allocation and subnet configurations.
* **Virtual Routers**: Route tables, gateway configurations, and interface assignments.
* **Interactive Network Topology**: Dynamic Vis.js map showcasing subnets, ports, routers, and VMs with **N-to-1 aggregated query performance**.

### ⚖️ Octavia Load Balancer (Octavia)
* **Load Balancer Wizard**: Provision high-availability load balancers in a single wizard.
* **Inspectors**: Monitor LB status, listeners, backend pools, and health monitors.

### 📦 Dynamic Heat Orchestration (Heat)
* **HOT Template Manager**: Deploy, edit, and audit Heat Orchestration Templates.
* **Live Event Stream**: Real-time stack deploy event auditing.
* **Connected Stack Topology**: Recreates **Horizon's radial tree view** mapping servers, networks, subnets, and load balancers to a central root stack node.

### 🔑 Identity & Scoping (Keystone)
* **Zero-Reload Project Switching**: Scopes tokens instantly using Keystone Project UUID IDs in the background, updating all proxy endpoints in-place.
* **Quota Inspector**: Real-time compute, storage, and networking domain quota details.

---

## 📦 Installation & Setup

### Prerequisites
* **Node.js** >= 20.x
* **Docker & Docker Compose** (for compiling backend proxies and local Keystone mock APIs)
* **Rust** (if building the backend binary without Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/pushpak-23/CloudPilot.git
cd CloudPilot
```

### 2. Frontend Development (Vite)
```bash
# Install packages
npm install

# Run hot-reloading dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Local Mock Backend (Axum & mock OpenStack endpoints)
A local mock OpenStack environment is included to support off-network testing:
```bash
cd backend
docker-compose up -d --build
```
This launches:
* An **Axum Gateway Proxy** at `http://localhost:8080` (with HTTPS certificate overrides).
* A **Keystone Mock Server** simulating token issue, token scoping, service catalogs, Nova, Neutron, Cinder, Octavia, and Heat v1 API endpoints.

---

## 🛠️ Architecture

CloudPilot utilizes a split-architecture to bypass CORS and secure communications:

```
[ Vue 3 SPA Client ]
        │ (Vite Dev Server Proxy / local assets)
        ▼
[ Axum Rust Proxy Gateway ]
        │ (Appends scoped X-Auth-Token and routes dynamically)
        ▼
[ OpenStack APIs (Keystone, Nova, Neutron, Cinder, Octavia, Heat) ]
```

The Rust proxy reads your active Keystone service catalog and handles proxy routing dynamically based on your scoped credentials.

---

## 🤝 Contributing

We welcome contributions to make the OpenStack ecosystem look and feel modern!

1. Fork the repository.
2. Create your feature branch: `git checkout -b feat/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feat/my-new-feature`
5. Submit a Pull Request.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

---

## 🔍 SEO Keywords
`openstack dashboard alternative` · `openstack horizon alternative` · `modern openstack ui` · `next-gen openstack` · `cloudpilot dashboard` · `vue openstack panel` · `neutron network topology visualizer` · `heat orchestration visualization tool` · `octavia loadbalancer control plane` · `beautiful dark theme openstack`
