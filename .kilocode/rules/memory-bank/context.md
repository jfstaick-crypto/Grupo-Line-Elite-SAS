# Active Context: Sistema de Gestión Hospitalaria

## Current State

**Status**: ✅ All 5 modules implemented and functional

The system is a complete healthcare management application with authentication, role-based access control, and 5 operational modules.

## Recently Completed

- [x] Database schema (users, patients, admissions, transfers, clinicalHistories, invoices, companySettings)
- [x] Authentication system with iron-session
- [x] Login page with credential validation
- [x] Dashboard layout with sidebar navigation
- [x] Module 1: User management CRUD (admin only)
- [x] Module 2: Patient admission with patient registration
- [x] Module 3: Patient transfers between departments
- [x] Module 4: Clinical history with detail view
- [x] Module 5: Export to PDF (jsPDF) and Excel (xlsx)
- [x] Module 6: Facturación (invoices)
- [x] Module 7: Empresa (company settings)
- [x] Role-based access control for all modules
- [x] Default seed users (admin, admision, medico)
- [x] Fix: ROLE_PERMISSIONS desincronizado entre layout.tsx y auth.ts - unificados importando desde auth.ts

## Database Tables

| Table | Purpose |
|-------|---------|
| users | System users with roles |
| patients | Patient records with document ID |
| admissions | Patient admissions with status tracking |
| transfers | Inter-department transfers |
| clinicalHistories | Medical records with diagnosis/treatment |

## File Structure

```
src/
├── app/
│   ├── login/page.tsx              # Login page
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard with sidebar (imports ROLE_PERMISSIONS from auth.ts)
│   │   ├── page.tsx                # Dashboard home
│   │   ├── usuarios/page.tsx       # User management
│   │   ├── admision/page.tsx       # Patient admission
│   │   ├── traslados/page.tsx      # Patient transfers
│   │   ├── historia-clinica/page.tsx # Clinical history
│   │   ├── exportar/page.tsx       # PDF/Excel export
│   │   ├── facturacion/page.tsx    # Invoicing
│   │   └── empresa/page.tsx        # Company settings
│   └── api/
│       ├── auth/                   # Login/logout/session
│       ├── usuarios/               # Users CRUD
│       ├── pacientes/              # Patients CRUD
│       ├── admisiones/             # Admissions CRUD
│       ├── traslados/              # Transfers CRUD
│       ├── historias/              # Clinical histories CRUD
│       └── exportar/               # Export data endpoint
├── db/
│   ├── schema.ts                   # Drizzle schema
│   ├── index.ts                    # DB client
│   ├── migrate.ts                  # Migration script
│   └── seed.ts                     # Default users
└── lib/
    └── auth.ts                     # Auth utilities
```

## Session History

| Date | Changes |
|------|---------|
| 2026-03-28 | Complete healthcare management system built with 5 modules |
| 2026-03-31 | Fix: Synchronized ROLE_PERMISSIONS in layout.tsx with auth.ts (added facturacion, empresa for admin; fixed admision and medico permissions; added ROLE_LABELS for auxiliar_enfermeria, enfermera_jefe, chofer) |

## Current Focus

All modules are implemented and passing typecheck + lint. Ready for use.
