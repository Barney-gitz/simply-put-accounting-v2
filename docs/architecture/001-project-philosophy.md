# 001 - Project Philosophy

## Status

Accepted

---

## Purpose

Simply Put is an internal accounting practice management application.

It is **not accounting software**.

It exists to manage:

- Clients
- Services
- Work
- Deadlines
- Notes
- Audit
- Staff workflows

---

## Core Principles

### PostgreSQL is the source of truth

The database represents the business.

The UI is simply a way of interacting with that data.

---

### Client-centric

Every piece of work belongs to a client.

Services extend clients.

Work belongs to services.

---

### Workflow-first

The application models how the practice operates.

It should never recreate the structure of an Excel spreadsheet.

---

### Dashboard-driven

The dashboard is the operational centre of the application.

Dashboard cards are summaries that drill into filtered work.

---

### Manual year-end rollover

Year-end rollover is always initiated by staff.

No automatic rollover will occur.

Every rollover must be auditable.

---

### Audit everything important

Important changes should record:

- who
- when
- previous value
- new value

---

### Build for extension

Future services should integrate into the existing architecture rather than requiring redesign.

Examples include:

- VAT
- PAYE
- CIS
- MTD ITSA
- Confirmation Statements