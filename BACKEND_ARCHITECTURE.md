# BACKEND_ARCHITECTURE.md

# CloudPilot Backend Architecture

Version: 1.0

---

# Vision

CloudPilot backend is **NOT** a wrapper around OpenStack.

It is a modern cloud control plane that sits between the frontend and OpenStack.

```
Vue Frontend

        │

 REST / WebSocket

        │

CloudPilot API Gateway

        │

────────────────────────────────────

Authentication

Authorization

Session Management

Audit Logging

Realtime Events

Infrastructure Engine

OpenTofu Engine

Notification Engine

AI Engine

────────────────────────────────────

        │

OpenStack Provider Layer

        │

Nova

Neutron

Cinder

Glance

Keystone

Placement

Heat

Magnum

Octavia

Designate

Watcher
```

---

# Technology Stack

Language

Rust

Framework

Axum

Runtime

Tokio

ORM

SQLx

Database

PostgreSQL

Cache

Redis

Messaging

RabbitMQ

Realtime

WebSocket

Authentication

JWT

Keystone

Logging

Tracing

OpenTelemetry

Metrics

Prometheus

Serialization

Serde

Configuration

config + dotenv

---

# Architecture Style

Use

Clean Architecture

Domain Driven Design

Hexagonal Architecture

Repository Pattern

Dependency Injection

Every service must be asynchronous.

---

# Project Structure

```
backend/

Cargo.toml

src/

main.rs

config/

constants/

common/

errors/

middleware/

database/

providers/

routes/

services/

repositories/

handlers/

models/

dto/

events/

websocket/

auth/

jobs/

utils/

tests/

```

---

# Microservices

CloudPilot consists of multiple logical services.

Initially they may live inside one repository.

Later they can become independent.

---

## API Gateway

Responsibilities

* HTTP API
* WebSocket
* Authentication
* Authorization
* Session Validation
* Request Validation
* API Versioning
* Rate Limiting

Never communicate directly with OpenStack from handlers.

Handlers call Services.

Services call Providers.

---

## Authentication Service

Responsibilities

* Login
* Logout
* Token Refresh
* Session Management
* MFA
* OIDC
* LDAP
* Keystone Authentication

Future Support

* Azure AD
* Google Workspace
* Okta

---

## Compute Service

Responsible for

Instances

Flavors

Server Groups

Hypervisors

Availability Zones

Host Aggregates

Live Migration

Resize

Evacuate

Shelve

Pause

Resume

---

## Storage Service

Responsible for

Volumes

Snapshots

Backups

Volume Types

Ceph Integration

---

## Networking Service

Responsible for

Networks

Subnets

Routers

Floating IPs

Security Groups

Ports

QoS

Trunks

---

## Identity Service

Projects

Domains

Users

Groups

Roles

Quotas

---

## Monitoring Service

Prometheus

Metrics

Cluster Health

Node Health

Resource Usage

---

## Notification Service

Email

Slack

Microsoft Teams

Webhook

---

## Audit Service

Every action

Every login

Every resource change

Every deployment

Everything must be recorded.

---

## OpenTofu Service

This is one of the most important services.

Responsibilities

Generate

main.tf

variables.tf

outputs.tf

providers.tf

terraform.tfvars

Execute

tofu init

tofu validate

tofu fmt

tofu plan

tofu apply

tofu destroy

Stream logs live.

Maintain workspace state.

Detect drift.

Support import.

---

## Realtime Service

Consumes

RabbitMQ

Processes

OpenStack Notifications

Publishes

WebSocket Events

No polling.

---

## AI Service

Future

Natural Language

Infrastructure Generation

Root Cause Analysis

Recommendations

Automation

---

# Provider Layer

Very important.

Business logic NEVER calls OpenStack SDK directly.

Correct architecture

```
Handler

↓

Service

↓

Provider Trait

↓

OpenStack Provider

↓

OpenStack REST API
```

Example

```
ComputeProvider

create_instance()

delete_instance()

resize()

migrate()

list()

```

Later

```
VMwareProvider

implements same trait

ProxmoxProvider

implements same trait

AWSProvider

implements same trait
```

This makes CloudPilot multi-cloud.

---

# Database

Tables

users

roles

permissions

sessions

audit_logs

notifications

saved_filters

saved_searches

deployments

deployment_logs

workflows

plugins

settings

regions

clusters

api_tokens

OpenStack remains the source of truth for infrastructure.

CloudPilot stores only metadata and application state.

---

# REST API

Version

/api/v1

Example

Authentication

POST

/api/v1/auth/login

POST

/api/v1/auth/logout

POST

/api/v1/auth/refresh

Compute

GET

/api/v1/instances

POST

/api/v1/instances

GET

/api/v1/instances/{id}

DELETE

/api/v1/instances/{id}

POST

/api/v1/instances/{id}/resize

POST

/api/v1/instances/{id}/migrate

Storage

GET

/api/v1/volumes

POST

/api/v1/volumes

Networking

GET

/api/v1/networks

POST

/api/v1/networks

OpenTofu

POST

/api/v1/deployments

GET

/api/v1/deployments/{id}

POST

/api/v1/deployments/{id}/apply

POST

/api/v1/deployments/{id}/destroy

---

# WebSocket Events

Namespace

/ws

Events

instance.created

instance.deleted

instance.updated

instance.status.changed

volume.created

volume.deleted

volume.attached

volume.detached

network.created

network.deleted

router.updated

migration.started

migration.completed

deployment.started

deployment.progress

deployment.finished

notification.created

---

# Event Flow

```
Nova

↓

RabbitMQ

↓

Realtime Service

↓

Event Parser

↓

Redis

↓

WebSocket

↓

Vue Frontend
```

Everything updates instantly.

---

# Authentication Flow

```
Vue

↓

CloudPilot

↓

Keystone

↓

JWT

↓

Redis Session

↓

Browser
```

Never expose Keystone credentials to the frontend.

---

# OpenTofu Flow

```
User

↓

Deployment Wizard

↓

JSON Model

↓

Template Generator

↓

OpenTofu Files

↓

Validation

↓

Plan

↓

Approval

↓

Apply

↓

Realtime Logs

↓

Deployment Complete
```

---

# Security

Implement

JWT

RBAC

Session Expiration

Rate Limiting

Request Validation

CORS

CSRF

Secure Cookies

Encrypted Secrets

Vault Integration

Audit Logging

---

# Middleware

Authentication

Authorization

Logging

Request ID

Tracing

Metrics

Rate Limiting

Error Handling

Compression

---

# Error Format

Always return

```json
{
  "success": false,
  "error": {
    "code": "INSTANCE_NOT_FOUND",
    "message": "Instance does not exist",
    "details": {}
  }
}
```

Success

```json
{
  "success": true,
  "data": {}
}
```

Never return inconsistent responses.

---

# Logging

Use structured logging.

Every request must include

Request ID

User ID

Project ID

Region

Latency

Status Code

---

# Testing

Unit Tests

Integration Tests

Repository Tests

API Tests

Performance Tests

WebSocket Tests

OpenTofu Tests

---

# Performance Goals

API latency

<50ms

WebSocket delay

<200ms

Dashboard

<1 second

Concurrent Users

10,000+

Events

Millions/day

---

# Future Providers

OpenStack

VMware

Proxmox

AWS

Azure

Google Cloud

Kubernetes

OpenShift

Backend architecture must never assume OpenStack is the only provider.

---

# Development Order

Phase 1

Configuration

Logging

Database

Middleware

Authentication

Phase 2

API Gateway

REST

OpenAPI

Swagger

Phase 3

Provider Layer

OpenStack Client

Nova

Neutron

Cinder

Keystone

Phase 4

Compute

Storage

Networking

Identity

Phase 5

Realtime

RabbitMQ

WebSocket

Redis

Phase 6

OpenTofu

Workspace Engine

Template Generator

Execution Engine

Phase 7

Monitoring

Audit

Notifications

Phase 8

AI Service

Phase 9

Plugin System

Phase 10

Production Hardening

---

# Final Goal

CloudPilot should become a cloud operating platform capable of managing multiple infrastructure providers while delivering a modern, real-time, Infrastructure-as-Code-native experience that surpasses the capabilities of OpenStack Horizon.
