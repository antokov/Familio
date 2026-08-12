import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import DocumentsPage from './DocumentsPage'
import { useDocuments } from '../hooks/useDocuments'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { useEvents } from '../hooks/useEvents'
import type { Document, ExtractedEventCandidate } from '../types/document'
import type { FamilyMember } from '../types/family'
import type { CreateEventInput } from '../types/event'

vi.mock('../hooks/useDocuments', () => ({ useDocuments: vi.fn() }))
vi.mock('../hooks/useFamilyMembers', () => ({ useFamilyMembers: vi.fn() }))
vi.mock('../hooks/useEvents', () => ({ useEvents: vi.fn() }))

interface ExtractModalStubProps {
  filename: string
  candidates: ExtractedEventCandidate[]
  familyMembers: FamilyMember[]
  createEvent: (input: CreateEventInput) => Promise<boolean>
  onDone: (createdCount: number) => void
  onClose: () => void
}

vi.mock('../components/ExtractEventsModal/ExtractEventsModal', () => ({
  ExtractEventsModal: (props: ExtractModalStubProps) => (
    <div data-testid="extract-modal-stub">
      <span data-testid="extract-modal-filename">{props.filename}</span>
      <span data-testid="extract-modal-count">{props.candidates.length}</span>
      <button onClick={() => props.onDone(props.candidates.length)}>Fake-Bestätigen</button>
      <button onClick={props.onClose}>Fake-Schließen</button>
    </div>
  ),
}))

const MEMBER_A: FamilyMember = { id: 'member-1', name: 'Anton', initials: 'AK', color: '#5B6AF0', online: true, createdAt: '2024-01-01T00:00:00' }
const MEMBER_B: FamilyMember = { id: 'member-2', name: 'Milena', initials: 'ML', color: '#F0805B', online: true, createdAt: '2024-01-02T00:00:00' }

const DOC_UNASSIGNED: Document = { id: 'doc-1', filename: 'rechnung.pdf', contentType: 'application/pdf', sizeBytes: 1024, familyMemberId: null, uploadedAt: '2026-01-01T00:00:00' }
const DOC_MEMBER_A: Document = { id: 'doc-2', filename: 'impfausweis.pdf', contentType: 'application/pdf', sizeBytes: 2048, familyMemberId: 'member-1', uploadedAt: '2026-01-02T00:00:00' }
const DOC_MEMBER_B: Document = { id: 'doc-3', filename: 'zeugnis.jpg', contentType: 'image/jpeg', sizeBytes: 4096, familyMemberId: 'member-2', uploadedAt: '2026-01-03T00:00:00' }

function mockDocuments(overrides: {
  documents?: Document[]
  loading?: boolean
  error?: string | null
  extractEvents?: ReturnType<typeof vi.fn>
} = {}) {
  const uploadDocument = vi.fn()
  const reassignDocument = vi.fn()
  const renameDocument = vi.fn()
  const deleteDocument = vi.fn()
  const extractEvents = overrides.extractEvents ?? vi.fn()
  vi.mocked(useDocuments).mockReturnValue({
    documents: overrides.documents ?? [],
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    uploadDocument,
    reassignDocument,
    renameDocument,
    deleteDocument,
    downloadUrl: (id: string) => `/api/documents/${id}/download`,
    viewUrl: (id: string) => `/api/documents/${id}/view`,
    extractEvents,
  })
  return { uploadDocument, reassignDocument, renameDocument, deleteDocument, extractEvents }
}

function mockFamilyMembers(members: FamilyMember[] = []) {
  vi.mocked(useFamilyMembers).mockReturnValue({
    members,
    loading: false,
    error: null,
    addMember: vi.fn(),
    editMember: vi.fn(),
    removeMember: vi.fn(),
  })
}

function mockEvents() {
  const createEvent = vi.fn().mockResolvedValue(true)
  vi.mocked(useEvents).mockReturnValue({
    events: [],
    loading: false,
    error: null,
    fetchEvents: vi.fn(),
    createEvent,
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  })
  return { createEvent }
}

function renderPage() {
  return render(<DocumentsPage />)
}

beforeEach(() => {
  mockDocuments()
  mockFamilyMembers()
  mockEvents()
})

describe('DocumentsPage — Gruppierung & Zustände (AC2)', () => {
  it('zeigt einen Ladeindikator, wenn geladen wird', () => {
    mockDocuments({ loading: true })
    renderPage()
    expect(screen.getByText('Lädt…')).toBeInTheDocument()
  })

  it('zeigt einen Leerzustand, wenn keine Dokumente vorhanden sind', () => {
    mockDocuments({ documents: [] })
    renderPage()
    expect(screen.getByText('Keine Dokumente')).toBeInTheDocument()
  })

  it('zeigt die Fehler-Banner, wenn useDocuments einen Fehler liefert', () => {
    mockDocuments({ error: 'Dokumente konnten nicht geladen werden' })
    renderPage()
    expect(screen.getByText('Dokumente konnten nicht geladen werden')).toBeInTheDocument()
  })

  it('gruppiert Dokumente nach zugewiesener Person, "Allgemein" zuerst', () => {
    mockFamilyMembers([MEMBER_A, MEMBER_B])
    mockDocuments({ documents: [DOC_MEMBER_A, DOC_UNASSIGNED, DOC_MEMBER_B] })
    renderPage()

    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(headings).toEqual(['Allgemein', 'Anton', 'Milena'])
    expect(screen.getByText('rechnung.pdf')).toBeInTheDocument()
    expect(screen.getByText('impfausweis.pdf')).toBeInTheDocument()
    expect(screen.getByText('zeugnis.jpg')).toBeInTheDocument()
  })
})

describe('DocumentsPage — Upload-Flow (AC3)', () => {
  it('öffnet DocumentUploadModal beim Klick auf "Hochladen"', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /hochladen/i }))
    expect(screen.getByRole('dialog', { name: 'Dokument hochladen' })).toBeInTheDocument()
  })

  it('schließt das Upload-Modal beim Klick auf Abbrechen', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /hochladen/i }))
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.queryByRole('dialog', { name: 'Dokument hochladen' })).not.toBeInTheDocument()
  })
})

describe('DocumentsPage — Extraktion (handleExtract, AC4)', () => {
  function extractBtnFor(doc: Document) {
    return screen.getByRole('button', { name: `Termine aus ${doc.filename} extrahieren` })
  }

  it('ruft extractEvents mit der Dokument-id auf und zeigt einen In-Flight-Zustand nur am jeweiligen Dokument', async () => {
    const user = userEvent.setup()
    let resolveExtract: (r: { events: ExtractedEventCandidate[] }) => void = () => {}
    const extractEvents = vi.fn(() => new Promise(resolve => { resolveExtract = resolve }))
    mockFamilyMembers([MEMBER_A, MEMBER_B])
    mockDocuments({ documents: [DOC_MEMBER_A, DOC_MEMBER_B], extractEvents })
    renderPage()

    await user.click(extractBtnFor(DOC_MEMBER_A))
    expect(extractEvents).toHaveBeenCalledWith('doc-2')
    expect(extractBtnFor(DOC_MEMBER_A)).toBeDisabled()
    expect(extractBtnFor(DOC_MEMBER_B)).not.toBeDisabled()

    await act(async () => resolveExtract({ events: [] }))
  })

  it('öffnet ExtractEventsModal mit Dateiname und Kandidaten bei Erfolg', async () => {
    const user = userEvent.setup()
    const candidate: ExtractedEventCandidate = {
      id: 'candidate-0', title: 'Elternabend', startDt: '2026-03-01T18:00:00', endDt: '2026-03-01T19:00:00', allDay: false, attendees: [],
    }
    const extractEvents = vi.fn().mockResolvedValueOnce({ events: [candidate] })
    mockFamilyMembers([MEMBER_A])
    mockDocuments({ documents: [DOC_MEMBER_A], extractEvents })
    renderPage()

    await user.click(extractBtnFor(DOC_MEMBER_A))

    expect(screen.getByTestId('extract-modal-stub')).toBeInTheDocument()
    expect(screen.getByTestId('extract-modal-filename')).toHaveTextContent('impfausweis.pdf')
    expect(screen.getByTestId('extract-modal-count')).toHaveTextContent('1')
  })

  it('zeigt eine Fehler-Banner und öffnet kein Modal, wenn die Extraktion fehlschlägt', async () => {
    const user = userEvent.setup()
    const extractEvents = vi.fn().mockResolvedValueOnce({ error: 'Claude API nicht konfiguriert' })
    mockFamilyMembers([MEMBER_A])
    mockDocuments({ documents: [DOC_MEMBER_A], extractEvents })
    renderPage()

    await user.click(extractBtnFor(DOC_MEMBER_A))

    expect(screen.getByText('Claude API nicht konfiguriert')).toBeInTheDocument()
    expect(screen.queryByTestId('extract-modal-stub')).not.toBeInTheDocument()
  })

  it('löscht eine vorherige Extraktions-Fehlermeldung, sobald ein neuer Extraktionsversuch startet', async () => {
    const user = userEvent.setup()
    let resolveSecond: (r: { events: ExtractedEventCandidate[] }) => void = () => {}
    const extractEvents = vi.fn()
      .mockResolvedValueOnce({ error: 'Erster Fehler' })
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve }))
    mockFamilyMembers([MEMBER_A])
    mockDocuments({ documents: [DOC_MEMBER_A], extractEvents })
    renderPage()

    const extractBtn = extractBtnFor(DOC_MEMBER_A)
    await user.click(extractBtn)
    expect(screen.getByText('Erster Fehler')).toBeInTheDocument()

    await user.click(extractBtn)
    expect(screen.queryByText('Erster Fehler')).not.toBeInTheDocument()

    await act(async () => resolveSecond({ events: [] }))
  })

  it('löscht eine vorherige Erfolgsmeldung, sobald ein neuer Extraktionsversuch startet', async () => {
    const user = userEvent.setup()
    let resolveSecond: (r: { events: ExtractedEventCandidate[] }) => void = () => {}
    const extractEvents = vi.fn()
      .mockResolvedValueOnce({ events: [] })
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve }))
    mockFamilyMembers([MEMBER_A])
    mockDocuments({ documents: [DOC_MEMBER_A], extractEvents })
    renderPage()

    const extractBtn = extractBtnFor(DOC_MEMBER_A)
    await user.click(extractBtn)
    await user.click(screen.getByRole('button', { name: 'Fake-Bestätigen' }))
    expect(screen.getByText('0 Termine wurden angelegt.')).toBeInTheDocument()

    await user.click(extractBtn)
    expect(screen.queryByText('0 Termine wurden angelegt.')).not.toBeInTheDocument()

    await act(async () => resolveSecond({ events: [] }))
  })
})

describe('DocumentsPage — Extraktion abgeschlossen (AC5)', () => {
  async function openExtractModalStub(extractEvents: ReturnType<typeof vi.fn>) {
    const user = userEvent.setup()
    mockFamilyMembers([MEMBER_A])
    mockDocuments({ documents: [DOC_MEMBER_A], extractEvents })
    renderPage()
    await user.click(screen.getByRole('button', { name: `Termine aus ${DOC_MEMBER_A.filename} extrahieren` }))
    return user
  }

  it('zeigt die Erfolgsmeldung im Singular bei einem angelegten Termin', async () => {
    const candidate: ExtractedEventCandidate = {
      id: 'candidate-0', title: 'Elternabend', startDt: '2026-03-01T18:00:00', endDt: '2026-03-01T19:00:00', allDay: false, attendees: [],
    }
    const extractEvents = vi.fn().mockResolvedValueOnce({ events: [candidate] })
    const user = await openExtractModalStub(extractEvents)

    await user.click(screen.getByRole('button', { name: 'Fake-Bestätigen' }))
    expect(screen.getByText('1 Termin wurde angelegt.')).toBeInTheDocument()
  })

  it('zeigt die Erfolgsmeldung im Plural bei 0 angelegten Terminen', async () => {
    const extractEvents = vi.fn().mockResolvedValueOnce({ events: [] })
    const user = await openExtractModalStub(extractEvents)

    await user.click(screen.getByRole('button', { name: 'Fake-Bestätigen' }))
    expect(screen.getByText('0 Termine wurden angelegt.')).toBeInTheDocument()
  })

  it('zeigt keine Erfolgsmeldung und schließt das Modal beim Klick auf Fake-Schließen (Abbruch ohne Abschluss)', async () => {
    const extractEvents = vi.fn().mockResolvedValueOnce({ events: [] })
    const user = await openExtractModalStub(extractEvents)

    await user.click(screen.getByRole('button', { name: 'Fake-Schließen' }))
    expect(screen.queryByTestId('extract-modal-stub')).not.toBeInTheDocument()
    expect(screen.queryByText(/wurde[n]? angelegt/)).not.toBeInTheDocument()
  })
})

describe('DocumentsPage — Reassign/Rename/Delete-Verdrahtung', () => {
  it('ruft reassignDocument mit id und family_member_id auf, wenn die Zuweisung geändert wird', async () => {
    const user = userEvent.setup()
    mockFamilyMembers([MEMBER_A])
    const { reassignDocument } = mockDocuments({ documents: [DOC_UNASSIGNED] })
    renderPage()

    await user.selectOptions(screen.getByLabelText(`Zuweisung für ${DOC_UNASSIGNED.filename}`), 'member-1')
    expect(reassignDocument).toHaveBeenCalledWith('doc-1', 'member-1')
  })

  it('ruft deleteDocument mit der id auf, wenn im DocumentItem endgültig gelöscht wird', async () => {
    const user = userEvent.setup()
    mockFamilyMembers([])
    const { deleteDocument } = mockDocuments({ documents: [DOC_UNASSIGNED] })
    renderPage()

    await user.click(screen.getByRole('button', { name: `${DOC_UNASSIGNED.filename} löschen` }))
    await user.click(screen.getByRole('button', { name: 'Ja' }))
    expect(deleteDocument).toHaveBeenCalledWith('doc-1')
  })

  it('ruft renameDocument auf, wenn im DocumentItem umbenannt und bestätigt wird', async () => {
    const user = userEvent.setup()
    mockFamilyMembers([])
    const { renameDocument } = mockDocuments({ documents: [DOC_UNASSIGNED] })
    vi.mocked(renameDocument).mockResolvedValue(true)
    renderPage()

    await user.click(screen.getByRole('button', { name: `${DOC_UNASSIGNED.filename} umbenennen` }))
    const input = screen.getByLabelText(`Neuer Name für ${DOC_UNASSIGNED.filename}`)
    await user.clear(input)
    await user.type(input, 'Neuer Name.pdf')
    await user.click(screen.getByRole('button', { name: 'Umbenennen bestätigen' }))

    expect(renameDocument).toHaveBeenCalledWith('doc-1', 'Neuer Name.pdf')
  })
})
