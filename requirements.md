# redo — Product Requirements (v1)

## 1. Vision

**redo** is a web app for people who want to stay on top of things that repeat — oil changes, dentist visits, filter replacements, backup checks. You define a task and an interval, and redo tells you when it's time again.

No notifications. No collaboration. No dashboards. Just a clear list of what's due and a one-tap way to mark it done.

## 2. Scope

The first version of redo focuses on a tight set of capabilities:

- **Authenticated individual accounts** — each user sees only their own data.
- **Recurring items with fixed calendar intervals** — every N days, weeks, months, or years.
- **A responsive web UI** — usable on phones, tablets, and desktops.
- **Completion history** — a log of every time you completed a task, with optional metadata.
- **Undo support** — mistakes can be corrected by deleting a completion.

Explicitly **out of scope** for v1: push notifications, shared/team accounts, analytics dashboards, and advanced scheduling (e.g., "every second Tuesday").

## 3. Glossary

| Term | Meaning |
|------|---------|
| **Redo** | A recurring task defined by a name and an interval. |
| **Completion** | A timestamped record created when a redo is marked done. |
| **Skip** | Advancing a redo's due date without recording a completion. |
| **Due** | A redo whose next due date falls within the configured lookahead window. |
| **Archived** | A redo that has been shelved — hidden from active views but preserved with its full history. |
| **Interval** | A recurrence period expressed as a positive integer and a unit (days, weeks, months, or years). |

## 4. Authentication

- Users must log in before accessing any data.
- The system supports registration, login, and logout.
- Every redo and completion belongs to exactly one user — there is no shared ownership.

## 5. Categories

- The system ships with a predefined set of categories (e.g., "Health", "Home", "Vehicle").
- Users can assign a category when creating or editing a redo, but cannot create or modify categories themselves.
- A redo has at most one category (or none).

## 6. The Redo Entity

### 6.1 User-defined attributes

| Attribute | Required | Notes |
|-----------|----------|-------|
| Name | Yes | Free-text label for the task. |
| Interval value | Yes | A positive integer (e.g., `3`). |
| Interval unit | Yes | One of `days`, `weeks`, `months`, `years`. |
| Description | No | Optional free-text detail. |
| Category | No | One of the predefined categories. |

### 6.2 System-managed attributes

| Attribute | Description |
|-----------|-------------|
| `id` | Unique identifier. |
| `user_id` | Owning user. |
| `created_at` | Timestamp of creation. |
| `last_completed_at` | Timestamp of most recent completion, or `null` if never completed. |
| `next_due_at` | When the redo is next due. |
| `archived` | Whether the redo is archived (flag or timestamp). |

## 7. Creating a Redo

When a user creates a new redo:

1. It starts as **active** (not archived).
2. `last_completed_at` is `null` — it has never been done.
3. `next_due_at` is set to **now** — the task is immediately due.

This means every new redo shows up in the "due" list right away, prompting the user to either complete it or skip it to set the first future due date.

## 8. Editing a Redo

### 8.1 Editable fields

Users can update: name, description, category, interval value, interval unit, and archive state.

### 8.2 Non-interval changes

Changing the name, description, or category has **no effect on scheduling**. Archive state changes follow the rules in [Section 9](#9-archiving).

### 8.3 Interval changes

When the interval value or unit changes, the system must recompute `next_due_at`. The goal is to be **deterministic and history-preserving** — no completions are created, deleted, or modified, and only the due date changes.

#### 8.3.1 Constraints

- No completion records are created or deleted.
- The creation timestamp is untouched.
- Completion history is untouched.
- Only `next_due_at` is recalculated.

#### 8.3.2 Reference date

To recompute the due date, the system picks a **reference date**:

- If the redo has been completed at least once → use `last_completed_at`.
- Otherwise → use `created_at`.

#### 8.3.3 Recomputation formula

```
next_due_at = reference_date + new_interval
```

The addition respects calendar semantics (e.g., adding 1 month to Jan 31 yields Feb 28/29).

#### 8.3.4 Overdue after an interval change

If the recomputed `next_due_at` lands in the past, the redo is simply **overdue**. The system does not auto-skip or auto-complete — it surfaces the redo in the due list and lets the user decide.

## 9. Archiving

Archiving lets users hide redos they no longer care about without losing data.

- Archived redos **do not appear** in the active list.
- Archived redos **cannot be completed or skipped**.
- Archived redos **keep their full completion history**.
- Unarchiving a redo restores it exactly as it was — no history or due-date changes.

## 10. Completions

### 10.1 What a completion records

Each completion stores:

- A unique identifier.
- A reference to the parent redo.
- A timestamp of when the completion occurred.
- Optional key–value metadata (arbitrary string pairs, no schema enforced, keys must be non-empty).

### 10.2 Metadata

Metadata is intentionally free-form. Users can attach whatever context makes sense for a given task — mileage on an oil change, cost of a service, brand of a replacement filter, etc. No validation beyond requiring non-empty keys.

## 11. Completing and Skipping

### 11.1 Completing a redo

When a user marks a redo as complete:

1. A new completion record is created.
2. `last_completed_at` is set to the completion timestamp.
3. `next_due_at` is recomputed as:

```
next_due_at = completion_timestamp + interval
```

The redo disappears from the due list until the new due date arrives.

### 11.2 Skipping a redo

When a user skips a redo:

- No completion record is created.
- `last_completed_at` is **not changed**.
- `next_due_at` is advanced by one interval from its current value:

```
next_due_at = current_next_due_at + interval
```

Skipping is useful when a task isn't relevant this cycle (e.g., skipping a seasonal chore during the off-season).

### 11.3 Undoing a completion

Users can delete the most recent completion to correct mistakes. When a completion is deleted:

- The completion record is removed.
- `last_completed_at` reverts to the timestamp of the now-most-recent completion (or `null` if none remain).
- `next_due_at` is recomputed from the new `last_completed_at` (or from `created_at` if no completions remain).
