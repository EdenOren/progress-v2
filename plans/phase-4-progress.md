# Phase 4 — Progress Tab

Branch: `feature/4-progress`

## Scope

- Subject list (fetched via `resource()` from Supabase)
- Create-subject dialog (Signal Forms + MatDialog)
- Subject detail page (entry list + delete subject)
- Entry detail page (stub — full session tracking is Phase 5)

## Routing

```
HomeComponent (shell — always visible)
  /progress                                       → ProgressComponent (subject list)
  /progress/subject/:subjectId                    → SubjectComponent (entry list)
  /progress/subject/:subjectId/entry/:entryId     → EntryComponent (stub)
  /kpi                                            → KpiComponent
  /menu                                           → MenuComponent
```

Routes are siblings under HomeComponent's children so the bottom nav stays visible throughout.

## New enums

- `core/enums/progress-route.enum.ts` — `ProgressRoute.Subject`, `ProgressRoute.Entry`

## Data layer

- `core/services/data/domains.data.ts` — `getWorkoutDomainId(supabase)`
- `core/services/data/subjects.data.ts` — `Subject` interface, Zod schema, `getSubjects`, `getSubjectById`, `createSubject`, `deleteSubject`
- `core/services/data/entries.data.ts` — `Entry` interface, Zod schema, `getEntries`

## Feature components

### Progress
- `ProgressFacade` — subjects resource, domain-ID resource, openCreateSubjectDialog(), navigateToSubject()
- `ProgressComponent` — smart, injects ProgressFacade
- `SubjectCardComponent` — dumb, `subject` input, `selected` output
- `CreateSubjectDialogComponent` — mini-smart dialog, Signal Form, closes with form data

### Subject
- `SubjectFacade` — injects ActivatedRoute for :subjectId, subject + entries resources, deleteSubject(), navigateToEntry(), navigateBack()
- `SubjectComponent` — smart, injects SubjectFacade
- `EntryCardComponent` — dumb, `entry` input, `selected` output

### Entry
- `EntryFacade` — injects ActivatedRoute for :entryId/:subjectId, navigateBack()
- `EntryComponent` — smart stub

## Shared

- `ConfirmationDialogComponent` — generic confirm/cancel dialog (title, message, confirm/cancel labels via MAT_DIALOG_DATA)

## MatIcon usage

- `add` — create subject button
- `chevron_right` — subject card navigation indicator
- `arrow_back` — back button on detail pages
- `fitness_center` — empty state on subject list
- `check_circle` — completed entry indicator
- `delete` — delete subject button

## Delete flow

1. User taps "Delete" on SubjectComponent
2. Facade opens ConfirmationDialogComponent with subject name + entry count
3. On confirm → `deleteSubject()` API call
4. On success → navigate to `/progress`
5. DB cascade deletes entries → items → item_sets → item_feedback
