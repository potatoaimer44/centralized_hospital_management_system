# Medical Records Management System - Design Guidelines

## Design Approach

**System-Based Approach**: Material Design with healthcare industry adaptations

This is a professional medical application requiring trust, clarity, and efficiency. Material Design provides excellent data density management, clear hierarchy, and proven patterns for complex information systems used in clinical settings.

## Core Design Principles

1. **Clinical Clarity**: Information must be instantly scannable with zero ambiguity
2. **Professional Trust**: Visual design conveys security and medical professionalism
3. **Role-Based Optimization**: Each dashboard tailored to specific workflow needs
4. **Data Density Balance**: Dense information presentation without overwhelming users

---

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts) - exceptional readability for dense medical data
- Monospace: JetBrains Mono - for patient IDs, record numbers, timestamps

**Type Scale**:
- Page Headers: `text-3xl font-semibold` (30px)
- Section Titles: `text-xl font-semibold` (20px)
- Card Headers: `text-lg font-medium` (18px)
- Body Text: `text-base` (16px)
- Labels/Metadata: `text-sm text-gray-600` (14px)
- Timestamps/IDs: `text-xs font-mono text-gray-500` (12px)

**Hierarchy Rules**:
- Patient names always bold (`font-semibold`)
- Critical medical data (diagnoses, allergies) emphasized with `font-medium`
- Timestamps and IDs de-emphasized with smaller size and muted styling

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: `p-4` or `p-6`
- Section gaps: `gap-6` or `gap-8`
- Card spacing: `space-y-4`
- Form field gaps: `gap-4`

**Container Strategy**:
- Dashboard layouts: `max-w-7xl mx-auto` with `px-6`
- Form containers: `max-w-3xl`
- Modal content: `max-w-2xl`

**Grid Patterns**:
- Dashboard cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Data tables: Full-width with sticky headers
- Form layouts: `grid grid-cols-1 md:grid-cols-2 gap-4` for paired fields

---

## Component Library

### Navigation
**Top Navigation Bar** (all roles):
- Fixed top bar with hospital logo/name on left
- User profile dropdown on right showing role badge (Admin/Doctor/Nurse/Patient)
- Quick access icons for notifications and alerts
- Height: `h-16` with `shadow-sm`

**Sidebar Navigation** (Admin/Doctor/Nurse):
- Left sidebar `w-64` with role-specific menu items
- Active state: subtle background with left border accent
- Icons from Heroicons (outline style)
- Collapsible on tablet viewports

### Dashboards

**Admin Dashboard**:
- Stats grid at top: 4 cards showing total hospitals, users, patients, pending requests
- Recent activity feed (2-column on desktop)
- System alerts panel with severity indicators
- User management table with search/filter

**Doctor Dashboard**:
- Patient list as primary view with search/quick filters
- Recent medical records timeline
- Pending access requests badge
- Quick action: "Add New Record" prominent button

**Nurse Dashboard**:
- Today's patient queue
- Vital signs entry form quick access
- Recent vital signs recorded
- Simpler, task-focused layout

**Patient Dashboard**:
- Personal medical timeline (chronological cards)
- Hospital visit history grouped by facility
- Downloadable medical summary
- Guardian/emergency contact information panel

### Data Tables
- Zebra striping for row differentiation
- Sticky header row with sort indicators
- Action buttons in rightmost column
- Hover states for interactive rows
- Pagination at bottom with page size selector

### Forms
**Medical Record Entry**:
- Multi-section form with clear headings
- Required fields marked with red asterisk
- Textarea fields for diagnosis, prescriptions, notes with `min-h-32`
- Auto-save indicator in header
- Submit/Cancel buttons right-aligned

**Vital Signs Form**:
- Horizontal layout for quick entry (2-3 columns)
- Input validation with real-time feedback
- Unit labels clearly displayed (°C, mmHg, bpm, kg, cm)
- Large, touch-friendly inputs

### Cards
**Patient Summary Card**:
- Header: Patient name + age + ID number
- Key info: Blood group, allergies (if any - highlighted in amber)
- Last visit date and hospital
- Action buttons: View Records, Request Access

**Medical Record Card**:
- Date header with hospital name
- Doctor name and specialization
- Diagnosis prominently displayed
- Collapsible sections for prescriptions, lab results, notes
- Edit/Delete actions for authorized users

**Alert/Notification Cards**:
- Severity-based left border (red/amber/blue)
- Icon indicating alert type
- Timestamp and triggering user
- Action: Dismiss or Investigate

### Modals
- Overlay with `bg-black/50` backdrop
- Centered modal with `rounded-lg shadow-xl`
- Clear header with close button
- Content area with scroll if needed
- Footer with action buttons right-aligned

### Security Elements
**Audit Log Viewer**:
- Filterable timeline view
- Each entry shows: timestamp, user, action, resource, IP address
- Expandable details with JSON data viewer
- Export functionality

**Access Request System**:
- List view with status badges (Pending/Approved/Denied)
- Requester info, patient context, reason
- Approve/Deny buttons for authorized users
- Timestamp trail showing request → review → decision

---

## Interaction Patterns

**Primary Actions**: Solid buttons with clear CTAs ("Add Medical Record", "Approve Request")
**Secondary Actions**: Ghost/outline buttons
**Destructive Actions**: Red accent with confirmation modal
**Loading States**: Skeleton loaders for tables, spinner for actions
**Success Feedback**: Toast notifications (top-right), green checkmark icons
**Error Handling**: Inline validation messages, error toast with retry option

---

## Specialized Features

**Role Badge System**: Small pill badges displaying user role (Admin: purple, Doctor: blue, Nurse: green, Patient: gray)

**Severity Indicators**: 
- Critical: Red dot + bold text
- High: Amber dot
- Medium: Yellow dot
- Low: Gray dot

**Medical Data Emphasis**:
- Allergies always in amber/yellow highlight boxes
- Emergency contacts with red phone icon
- Critical diagnoses flagged with warning icon

---

This design creates a professional, efficient medical system prioritizing clarity, trust, and role-specific workflows while maintaining strict information hierarchy for clinical decision-making.