# SimplyPut Accounting V2 - Project Roadmap

This document tracks the current development direction of the application.

It is not intended to be a detailed specification.

---

# Current Milestone

## Self Assessment (MVP)

### Completed

- [x] Client Management
- [x] Service Assignment
- [x] Service Routing
- [x] Self Assessment database schema
- [x] Self Assessment workspace
- [x] Permanent vs Current Year separation
- [x] Staff assignment
- [x] Progress workflow
- [x] Save functionality
- [x] History section
- [x] Save notifications

### Remaining

- [ ] Filed Date
- [ ] Read-only historical tax year view
- [ ] Dashboard integration
- [ ] History improvements
- [ ] Remove legacy client UTR usage

---

# Future Services

- [ ] Accounts Tracking
- [ ] AML
- [ ] VAT
- [ ] PAYE
- [ ] CIS
- [ ] MTD ITSA
- [ ] Confirmation Statements

---

# Core Features

- [ ] Client Relationships
- [ ] Dashboard
- [ ] Global Activity Timeline
- [ ] Reporting
- [ ] Documents
- [ ] Year-End Rollover

---

# Polish Backlog

## User Experience

- [ ] Replace redirect-based saves with useTransition()
- [ ] Preserve scroll position after save
- [ ] Save button feedback (Save → Saving... → ✓ Saved)
- [ ] Remove toast notification after inline feedback exists
- [ ] Warn before navigating away with unsaved changes

## User Interface

- [ ] Service colour themes
- [ ] Colour-coded workflow status badges
- [ ] Improved History timeline
- [ ] Service icons
- [ ] Consistent spacing and typography
- [ ] Review mobile layouts

## Dashboard

- [ ] Dashboard cards drive all workflow
- [ ] Clickable dashboard cards
- [ ] Due Soon indicators
- [ ] Workload by staff member

---

# Architectural Principles

- Dashboard-first
- Client-centric
- Services own their own data
- Database is the source of truth
- Permanent information separated from yearly workflow
- Avoid recreating Excel
- Build for commercial maintainability
- Complete one service before starting the next
- No premature abstraction