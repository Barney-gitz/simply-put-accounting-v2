# 003 - Database Principles

## Goals

The database should model the business.

Avoid designing around old spreadsheets.

---

## General Rules

- UUID primary keys.
- Never duplicate information.
- Use foreign keys for relationships.
- Prefer lookup tables over duplicated values where appropriate.
- Keep workflow data separate from client identity.

---

## Naming

Tables:

snake_case plural

Examples:

- clients
- client_services
- work_items

Columns:

snake_case

Examples:

- created_at
- client_id
- assigned_staff_id

TypeScript:

camelCase

React Components:

PascalCase

---

## Migrations

Never edit an existing migration.

Every schema change must create a new migration.

Migration history forms part of the audit trail of the application.

---

## Database Responsibility

The database stores facts.

The application implements behaviour.