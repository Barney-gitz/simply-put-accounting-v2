# 002 - Domain Model

## Core Entities

The application revolves around the following concepts.

```
Client
│
├── Client Service
│      │
│      ▼
│   Work Item
│
├── Notes
│
└── Audit
```

---

## Client

Represents a person or organisation.

Stores permanent information only.

Examples:

- Name
- UTR
- Company Number
- Contact details
- Status

---

## Client Service

Represents a service provided to a client.

Examples:

- Accounts
- Self Assessment
- AML

A client may have many services.

---

## Work Item

Represents a single piece of work.

Examples:

- Accounts for YE 31 March 2026
- Self Assessment 2025/26
- AML Review

Dashboards report on Work Items.

---

## Notes

Stores contextual information.

Notes are editable but audited.

---

## Audit

Stores historical changes.

Audit records are append-only.

---

## Staff User

Represents members of the practice.

Staff own work.

Staff create notes.

Staff perform year-end rollover.