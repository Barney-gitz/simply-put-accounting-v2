# Database Schema v1

## Status

Draft

---

# Core Tables

## clients

Stores permanent client information.

### Purpose

Represents a person or organisation.

Contains identity information only.

Does **not** contain workflow state.

### Columns

| Column | Notes |
|---------|------|
| id | UUID Primary Key |
| client_type | individual / limited_company / partnership |
| status | active / inactive / archived |
| display_name | Name shown throughout the application |
| legal_name | Legal registered name |
| utr | UTR where applicable |
| company_number | Companies House number (limited companies only) |
| email | Primary email |
| phone | Primary phone |
| address_line_1 | |
| address_line_2 | |
| town | |
| county | |
| postcode | |
| created_at | |
| updated_at | |
| archived_at | Nullable |

---

## staff_users

Represents practice staff.

### Columns

- id
- email
- name
- job_title
- is_admin
- is_active
- created_at

---

## service_types

Lookup table.

Initial records:

- Accounts
- Self Assessment
- AML

Future records:

- VAT
- PAYE
- CIS
- MTD ITSA
- Confirmation Statement

---

## client_services

Represents which services a client receives.

### Columns

- id
- client_id
- service_type_id
- status
- lead_staff_id
- start_date
- end_date
- notes

---

## work_items

Represents a single piece of work.

### Purpose

This is the operational heart of the application.

Dashboards, reports and calendars are built from Work Items.

### Columns

- id
- client_id
- client_service_id
- work_type
- period_label
- period_start
- period_end
- due_date
- assigned_staff_id
- status
- rolled_over_from_id
- archived_at

---

## notes

Contextual notes.

### Columns

- id
- client_id
- work_item_id
- staff_user_id
- note
- created_at
- updated_at

---

## audit_log

Append-only history.

### Columns

- id
- actor_staff_id
- entity_type
- entity_id
- action
- before
- after
- created_at

---

## year_end_runs

Tracks manual rollover operations.

---

## year_end_run_items

Tracks individual rollover results.

---

# Relationship Summary

Client

↓

Client Service

↓

Work Item

↓

Notes

Audit exists alongside every entity.