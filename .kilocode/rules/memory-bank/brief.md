# Project Brief: Sistema de Gestión Hospitalaria

## Purpose

Healthcare management system for patient transfers and clinical history. Handles user management with role-based access, patient admissions, transfers between departments, clinical history records, and data export in PDF/Excel formats.

## Target Users

- Administrators with full system access
- Admission staff for patient registration and admission management
- Medical staff for clinical history and patient transfers

## Core Modules

### Module 1: User Management (Administrador only)
- Create/edit/deactivate users
- Assign role profiles: administrador, admision, medico

### Module 2: Patient Admission
- Register new patients with document ID
- Create admissions with department, bed, reason
- Discharge patients

### Module 3: Patient Transfers
- Transfer patients between departments
- Record transfer reason and responsible staff

### Module 4: Clinical History
- Record diagnoses, symptoms, treatment
- Track vital signs and notes
- View patient history details

### Module 5: Export (PDF & Excel)
- Export admissions, transfers, and clinical histories
- Generate PDF reports with jsPDF
- Generate Excel files with xlsx

## Role-Based Access

| Module | Administrador | Admisión | Médico |
|--------|:---:|:---:|:---:|
| Usuarios | ✅ | ❌ | ❌ |
| Admisión | ✅ | ✅ | ✅ |
| Traslados | ✅ | ❌ | ✅ |
| Historia Clínica | ✅ | ❌ | ✅ |
| Exportar | ✅ | ✅ | ❌ |

## Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | administrador |
| admision | admision123 | admision |
| medico | medico123 | medico |

## Key Requirements

- Session-based authentication with iron-session
- SQLite database with Drizzle ORM
- Spanish language UI
- Responsive sidebar navigation
