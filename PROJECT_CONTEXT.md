# CloudPilot

## Vision

CloudPilot is a next-generation, real-time cloud control plane designed to replace OpenStack Horizon.

This is NOT a Horizon clone.

The goal is to build a modern cloud operating platform comparable to:

- VMware vCenter
- Proxmox VE
- Rancher
- Portainer

while remaining fully compatible with OpenStack APIs.

The platform should be event-driven, realtime, fast, scalable, modular, secure and enterprise ready.

---

# Core Philosophy

CloudPilot is built around these principles:

1. Realtime-first
2. API-first
3. Event-driven
4. Infrastructure-as-Code native
5. Enterprise UX
6. Plugin architecture
7. Multi-cloud ready
8. Rust backend
9. Vue frontend
10. High performance

Never design features like Horizon.

Always design for cloud operators managing thousands of resources.

---

# Tech Stack

Frontend

- Vue 3.5
- TypeScript
- Vite
- TailwindCSS v4
- Pinia
- Vue Router
- shadcn-vue
- Lucide Icons
- Axios
- VueUse

Backend (future)

- Rust
- Axum
- Tokio
- SQLx
- PostgreSQL
- Redis
- RabbitMQ
- WebSocket
- OpenTelemetry

---

# Frontend Architecture

Use Feature-Sliced Design.

src/

app/
shared/
entities/
features/
widgets/
pages/
stores/

Never place everything inside components/.

---

# Design Language

Dark theme.

Inspired by

- vCenter
- Proxmox
- Grafana
- Rancher
- Portainer

Avoid Horizon-like UI.

---

# Navigation

Dashboard

Infrastructure
Instances
Images
Flavors

Storage
Volumes
Snapshots
Backups
Ceph

Networking
Networks
Routers
Floating IPs
Security Groups

Identity
Projects
Users
Roles

Monitoring

Automation

OpenTofu

AI Assistant

Settings

---

# Primary Features

Realtime Dashboard

Live updates.

No browser refresh.

WebSocket driven.

---

Infrastructure

Manage

- Instances
- Volumes
- Images
- Networks
- Routers
- Floating IPs
- Projects
- Users

---

OpenTofu

Built-in Infrastructure as Code.

Users should never need to manually write Terraform/OpenTofu unless they want to.

Every UI workflow can generate OpenTofu.

---

Bulk Deployment

Support workflows like

Deploy 100 VMs

Each VM

Boot Volume

100GB

Data Volume

500GB

Logs Volume

2TB

Cloud Init

Networks

Security Groups

Single Deploy button.

---

Realtime Deployment

Show

Planning

Creating

Attaching

Waiting

Cloud Init

Finished

with live logs.

---

Ceph

Realtime Ceph dashboard.

Show

OSDs

Pools

PGs

Recovery

Health

Capacity

Slow Ops

CRUSH

---

Monitoring

Prometheus

Grafana

Alertmanager

Realtime charts.

---

AI Assistant

Examples

Create twenty Ubuntu servers.

Generate OpenTofu.

Explain VM failure.

Find unused volumes.

Find orphaned floating IPs.

Explain scheduler decisions.

---

Security

RBAC

MFA

OIDC

LDAP

Keystone

Audit Logging

Session Management

Rate Limiting

---

# UI Principles

Never use browser refresh.

Everything updates automatically.

Use WebSocket.

All tables should support

Sorting

Filtering

Pagination

Column selection

Bulk actions

Export

Search

---

# Current Sprint

Sprint 1

Application Shell

Status

IN PROGRESS

Completed

✔ Vue setup
✔ Tailwind
✔ Pinia
✔ Router
✔ shadcn-vue

Current Work

Application Shell

Need

Sidebar

Header

Footer

Breadcrumbs

Notification Center

Global Search

Responsive Layout

Dark Theme

Layout Store

---

# Future Sprints

Sprint 2

Dashboard

Sprint 3

Compute

Sprint 4

Storage

Sprint 5

Networking

Sprint 6

Identity

Sprint 7

Monitoring

Sprint 8

Ceph

Sprint 9

OpenTofu

Sprint 10

Realtime

Sprint 11

AI Assistant

Sprint 12

Plugin System

Sprint 13

Production

---

# Coding Rules

Always use TypeScript.

Never use Options API.

Use Composition API only.

Use script setup.

Never duplicate components.

Prefer reusable widgets.

Keep pages thin.

Business logic belongs in stores/services.

UI belongs in widgets/components.

Never call APIs directly from components.

Always use

Component

↓

Store

↓

Service

↓

API

Never hardcode API URLs.

Use environment variables.

---

# Naming Convention

Pages

DashboardPage.vue

Components

InstanceCard.vue

Stores

useComputeStore

Services

compute.service.ts

Types

instance.ts

Composables

useWebSocket.ts

---

# Performance Goals

Dashboard load

<1 second

Realtime latency

<200ms

Support

100,000+ instances

10,000+ users

Millions of events

---

# Long-Term Vision

CloudPilot should eventually become

A complete cloud operating platform

instead of merely being an OpenStack dashboard.

It should support

OpenStack

Proxmox

VMware

Kubernetes

AWS

Azure

through provider plugins.
