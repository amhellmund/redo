# redo — Software Requirements Specification (v1)

## 1. Purpose

The redo application shall provide a simple, web-based tool for managing recurring actions (“redos”) using calendar-based intervals. The system shall allow users to view redos that are due or due soon, complete or skip them, and optionally attach structured metadata to completions.


## 2. Scope

The system shall:
- Support authenticated individual users
- Store and manage recurring items with fixed calendar intervals
- Provide a responsive web interface usable on mobile, tablet, and desktop
- Maintain a history of completions
- Allow limited correction of user actions (undo via deletion)

The system shall not provide notifications, collaboration, analytics, or advanced scheduling.


## 3. Definitions

- **Redo**: A recurring item defined by a name and interval.
- **Completion**: A record created when a redo is completed.
- **Skip**: An action that advances the due date without creating a completion.
- **Due**: A redo whose next due date lies within a defined future window.
- **Archived**: A redo that is inactive and excluded from active views.
- **Interval**: A calendar-based recurrence defined by a numeric value and a unit.


## 4. Users and Authentication

### 4.1 Authentication
- The system shall require users to authenticate before accessing any data.
- The system shall support user registration, login, and logout.
- Each redo and completion shall belong to exactly one user.


## 5. Categories

### 5.1 Category definition
- The system shall provide a predefined, system-managed list of categories.
- Categories shall be selectable when creating or editing a redo.
- Categories shall not be user-editable.
- A redo may have zero or one category.


## 6. Redo Entity

### 6.1 Required attributes
Each redo shall have:
- a name
- an interval value (positive integer)
- an interval unit (`days`, `weeks`, `months`, or `years`)

### 6.2 Optional attributes
Each redo may have:
- a description
- a category

### 6.3 System-managed attributes
Each redo shall have:
- a unique identifier
- an owning user identifier
- a creation timestamp
- a `last_completed_at` timestamp (nullable)
- a `next_due_at` timestamp
- an archived flag or timestamp


## 7. Redo Creation

- When a redo is created, it shall be active.
- When a redo is created, `last_completed_at` shall be `null`.
- When a redo is created, `next_due_at` shall be set to the current date and time.
- A newly created redo shall therefore be immediately due.


## 8. Redo Updating

### 8.1 Editable fields
The system shall allow the following redo fields to be updated:
- name
- description
- category
- interval value
- interval unit
- archive state


### 8.2 Updating non-interval fields
- Updating name, description, or category shall not affect scheduling.
- Updating archive state shall follow the rules in Section 9.


### 8.3 Updating the interval

When a redo’s interval value or interval unit is changed, the system shall recompute the redo’s due date in a deterministic and history-preserving manner.

#### 8.3.1 General rules
- Updating the interval shall not create or delete completion records.
- Updating the interval shall not modify the redo’s creation timestamp.
- Updating the interval shall not modify completion history.
- Updating the interval shall only affect `next_due_at`.


#### 8.3.2 Reference date selection

To recompute the due date, the system shall determine a reference date as follows:

- If `last_completed_at` is not null, the reference date shall be:


#### 8.3.3 Due date recomputation

The system shall compute the new due date as:



#### 8.3.4 Overdue handling after interval change

- If the recomputed `next_due_at` lies in the past, the redo shall be considered overdue.
- No automatic skipping, completion, or adjustment shall occur.
- The redo shall appear in the due list according to the standard due-window rules.


## 9. Redo Archiving

- The system shall allow a redo to be archived.
- Archived redos shall not appear in active redo lists.
- Archived redos shall not be completable or skippable.
- Archived redos shall retain all completion history.
- The system shall allow archived redos to be unarchived.
- Unarchiving shall not modify completion history or due dates.


## 10. Completion Records

### 10.1 Completion creation
- The system shall create a completion record when a user completes a redo.
- Each completion shall store:
  - a unique identifier
  - a reference to the redo
  - a completion timestamp
  - optional user-defined key–value metadata

### 10.2 Completion metadata
- Metadata shall consist of arbitrary key–value string pairs.
- Keys and values shall be user-defined.
- Keys shall be non-empty.
- No schema validation shall be applied.


## 11. Completion Behavior

### 11.1 Completing a redo
When a redo is completed:

- A completion record shall be created.
- `last_completed_at` shall be set to the completion timestamp.
- `next_due_at` shall be computed as:

