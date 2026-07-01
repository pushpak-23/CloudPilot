# Codebase Memory Map

This document serves as the localized context and state directory for the CloudPilot control plane frontend. Use this as a reference guide for subsequent agents or models working on this project.

---

## 1. Project Overview & Vision
- **Project Name**: CloudPilot
- **Objective**: Real-time cloud control plane replacing OpenStack Horizon (similar to Proxmox / vCenter / Rancher in UX).
- **Theme**: Dark space theme (deep space background `#09090b`, sleek zinc borders, blue/cyan glowing accents).
- **Tech Stack**: Vue 3.5 (Composition API, `<script setup lang="ts">`), Vite, Tailwind CSS v4 (configured via `@theme` in `src/main.css`), Pinia (state management), Vue Router, ECharts.

---

## 2. Directory & Architecture Map
The project is structured according to Feature-Sliced Design (FSD) concepts:
```
src/
├── app/                  # Application initialization
├── layouts/              # Global page layout containers
│   └── DefaultLayout.vue # Responsive shell layout with margins & search modal
├── router/               # Route routing configuration
│   └── index.ts          # Page paths & meta breadcrumbs + authentication guards
├── services/             # API Mock Integration layer (axios-ready)
│   ├── auth.service.ts       # Keystone token authentication mock
│   ├── compute.service.ts    # Nova VM instance CRUD mock
│   ├── storage.service.ts    # Cinder volumes mock
│   ├── network.service.ts    # Neutron SDN subnets mock
│   ├── identity.service.ts   # Keystone projects mock
│   └── monitoring.service.ts # Prometheus telemetries & Alertmanager alerts mock
├── stores/               # State Management Stores (Pinia)
│   ├── auth.ts           # Session token & user properties
│   ├── layout.ts         # Sidebar collapse states & notifications center
│   ├── compute.ts        # Virtual machine instances, flavors, images
│   ├── storage.ts        # Block storage volumes
│   ├── network.ts        # Virtual networks
│   ├── identity.ts       # Project domains
├── components/           # UI Components
│   └── compute/          # Compute modals, tabs and wizard sub-elements
│       ├── ServerDetailsModal.vue
│       ├── ImageDetailsModal.vue
│       ├── DistroLogo.vue
│       ├── InstancesTab.vue
│       ├── FlavorsTab.vue
│       ├── ImagesTab.vue
│       ├── HypervisorsTab.vue
│       ├── KeypairsTab.vue
│       ├── BulkWizardTab.vue
│       ├── LaunchWizardModal.vue
│       ├── CreateFlavorModal.vue
│       └── CreateKeypairModal.vue
├── widgets/              # Reusable dashboard widgets
│   ├── sidebar/
│   │   └── AppSidebar.vue # Collapsible sidebar (desktop & mobile drawer overlay)
│   ├── header/
│   │   ├── AppHeader.vue  # Breadcrumbs, notifications, project selectors, search
│   │   └── components/
│   │       └── GlobalSearchModal.vue # Cmd+K fuzzy-search overlay
│   └── footer/
│   │   └── AppFooter.vue  # Pulse connection, region info, live latency
└── pages/                # Page route views
    ├── auth/
    │   └── LoginPage.vue  # Standalone Keystone authentication page
    ├── dashboard/
    │   ├── components/
    │   │   └── DashboardChart.vue # Live-updating ECharts load chart
    │   └── DashboardPage.vue # Main summaries, live graphs & health indicators
    ├── compute/
    │   └── ComputePage.vue # Nova virtual machine management
    ├── storage/
    │   └── StoragePage.vue # Cinder block storage volumes
    ├── network/
    │   └── NetworkPage.vue # Neutron networks & subnets
    ├── identity/
    │   └── IdentityPage.vue # Keystone project tenants & domains
    ├── monitoring/
    │   └── MonitoringPage.vue # Alertmanager alerts list & node metrics
    └── ai/
        └── AIPage.vue     # Co-pilot chat assistant & OpenTofu code generator
```

---

## 3. Data Flow Architecture
The application enforces a decoupled data layer routed through a stateless Rust Axum backend proxy:
$$\text{Component} \longrightarrow \text{Pinia Store} \longrightarrow \text{Service} \longrightarrow \text{Axum Proxy} \longrightarrow \text{OpenStack API}$$

- **UI Components**: Render states, trigger store actions, capture user interactions.
- **Pinia Stores**: Manage active memory states. All stores accept `force: boolean` parameter to bypass cache on navigation.
- **Services**: Query live OpenStack endpoints via the proxy gateway. Each service reads `endpoints` and `cp_token` from `localStorage`.
- **Proxy Gateway** (`POST /api/v1/proxy`): Stateless pass-through that injects `X-Auth-Token`, bypasses self-signed TLS (`danger_accept_invalid_certs`), and returns raw JSON.

### Service → OpenStack Endpoint Mapping
| Service File | OpenStack API | Endpoints Used |
|---|---|---|
| `compute.service.ts` | Nova Compute | `/servers/detail`, `/flavors/detail`, `/os-hypervisors/detail`, `/os-keypairs`, `/os-quota-sets/{id}/detail` |
| `compute.service.ts` | Glance Image | `/v2/images` |
| `storage.service.ts` | Cinder Volume v3 | `/volumes/detail` |
| `network.service.ts` | Neutron Network | `/v2.0/networks`, `/v2.0/subnets` |
| `identity.service.ts` | Keystone Identity | `/v3/auth/projects` |
| `monitoring.service.ts` | Nova (derived) | `/os-hypervisors/detail` → CPU/RAM utilization |

---

## 4. Current State & Configuration
- **TypeScript**: Option `baseUrl` deprecation warning is silenced via `"ignoreDeprecations": "6.0"` inside `tsconfig.app.json`.
- **Authentication**: Router redirects unauthenticated sessions to `/login`. Persisted sessions are tracked in `localStorage` (`cp_token` and `cp_user`). Session includes `endpoints` (service catalog map), `project_id`, `auth_url`, and `roles`.
- **Live Data**: All dashboard widgets, compute pages, storage, network, and identity views fetch real data from the user's OpenStack cluster. No mock data remains in production services.
- **Telemetry**: Monitoring metrics (CPU load, RAM allocation) are derived from live Nova hypervisor statistics. Chart history starts at zero and populates with real data points.
- **Advanced Launch Instance Wizard**: The Instances tab features a 6-step stepper wizard (Details, Source, Flavor, Networks, Security/Keypairs, Cloud-Init) validating inputs at each step and checking core/RAM resource quotas dynamically against live project quota limits from `/os-quota-sets`.
- **Backend Containers Stack**:
  - `backend/docker-compose.yml`: Multi-container layout containing `api` (Rust Axum API using `rustlang/rust:nightly` compiler) and `keystone-mock` (Node server).
  - `backend/src/main.rs` & `keystone.rs`: Exposes `/api/v1/auth/login` (Keystone v3 token + catalog parsing) and `/api/v1/proxy` (stateless OpenStack API pass-through).
  - `backend/keystone-mock/server.js`: Simulates standard Keystone endpoint on port 5000 (used for local dev without real cluster).

### Critical Integration Notes
- **Root Cause Fix**: `auth.service.ts` now preserves `endpoints`, `project_id`, and `auth_url` from the Keystone backend response into `localStorage`. Previously these were stripped, causing all proxy calls to fail silently.
- **SSL**: All internal OpenStack endpoints use self-signed certificates. The Rust proxy client uses `danger_accept_invalid_certs(true)`.
- **Rust Compiler**: Docker build requires `rustlang/rust:nightly` due to dependency crates needing Rust 1.86+.


