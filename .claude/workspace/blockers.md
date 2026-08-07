# Blockers — FS-22: Familienmitglieder-CRUD

## BLOCKING — OQ-1: TaskFormModal Scope

**Kontext:** Die Settings-Seite liest aktuell `FAMILY_MEMBERS` aus `constants/family.ts` (hardcoded). Wenn wir Familie auf die API umstellen, hat `TaskFormModal` (Assignee-Picker) ebenfalls einen Import dieser Konstante. Wenn ein neues Mitglied über die Settings-Seite hinzugefügt wird, aber `TaskFormModal` noch die hardcoded Konstante nutzt, erscheint das neue Mitglied **nicht** im Assignee-Picker — ein sofortiger Datenkonsistenz-Bug.

**Optionen:**

**A) Voll-Migration (empfohlen):** `TaskFormModal` ebenfalls auf einen `useFamilyMembers`-Hook (API) umstellen. `constants/family.ts` wird gelöscht. Konsistent, aber größerer Scope.

**B) Konstante parallel:** `FAMILY_MEMBERS` bleibt in `constants/family.ts` als Fallback. Settings-Seite zeigt API-Daten, `TaskFormModal` nutzt weiterhin Konstante. Einfacher, aber inkonsistent — neues Mitglied ist zwar gespeichert, erscheint aber nicht im Picker.

**C) Lokaler State ohne API in TaskFormModal:** `TaskFormModal` fetcht selbst. Kein globaler State, aber doppelte Requests.

**Frage an den Menschen:** Soll `TaskFormModal` in FS-22 mit auf die API umgestellt werden (Option A), oder bleibt die Konstante vorerst bestehen (Option B)?
