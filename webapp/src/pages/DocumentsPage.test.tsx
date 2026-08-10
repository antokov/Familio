import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import DocumentsPage, { groupDocuments } from './DocumentsPage'
import type { Document } from '../types/document'
import type { FamilyMember } from '../types/family'

const ANTON: FamilyMember = { id: 'fm-1', name: 'Anton', initials: 'A', color: '#5B6AF0', online: false, createdAt: '2024-01-01T00:00:00' }
const MIRA: FamilyMember = { id: 'fm-2', name: 'Mira', initials: 'M', color: '#4CAF82', online: false, createdAt: '2024-01-02T00:00:00' }

function doc(overrides: Partial<Document>): Document {
  return {
    id: 'doc-1',
    filename: 'test.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1024,
    familyMemberId: null,
    uploadedAt: '2024-01-01T00:00:00',
    ...overrides,
  }
}

describe('groupDocuments', () => {
  it('gruppiert nach Allgemein zuerst, dann nach Familienmitgliedern in ihrer Reihenfolge', () => {
    const docs = [
      doc({ id: 'd1', familyMemberId: MIRA.id }),
      doc({ id: 'd2', familyMemberId: null }),
      doc({ id: 'd3', familyMemberId: ANTON.id }),
    ]
    const groups = groupDocuments(docs, [ANTON, MIRA])
    expect(groups.map(g => g.member?.name ?? 'Allgemein')).toEqual(['Allgemein', 'Anton', 'Mira'])
  })

  it('lässt leere Gruppen komplett weg', () => {
    const docs = [doc({ id: 'd1', familyMemberId: ANTON.id })]
    const groups = groupDocuments(docs, [ANTON, MIRA])
    expect(groups.map(g => g.member?.name ?? 'Allgemein')).toEqual(['Anton'])
  })

  it('lässt die Allgemein-Gruppe weg, wenn kein Dokument unzugewiesen ist', () => {
    const docs = [doc({ id: 'd1', familyMemberId: ANTON.id }), doc({ id: 'd2', familyMemberId: MIRA.id })]
    const groups = groupDocuments(docs, [ANTON, MIRA])
    expect(groups.some(g => g.member === null)).toBe(false)
  })

  it('liefert eine leere Liste ohne Dokumente', () => {
    expect(groupDocuments([], [ANTON, MIRA])).toEqual([])
  })

  it('liefert nur die Allgemein-Gruppe, wenn alle Dokumente unzugewiesen sind', () => {
    const docs = [doc({ id: 'd1', familyMemberId: null }), doc({ id: 'd2', familyMemberId: null })]
    const groups = groupDocuments(docs, [ANTON, MIRA])
    expect(groups).toEqual([{ member: null, docs }])
  })

  it('gruppiert Dokumente eines gelöschten Mitglieds unter Allgemein', () => {
    const docs = [doc({ id: 'd1', familyMemberId: 'deleted-member-id' })]
    const groups = groupDocuments(docs, [ANTON])
    expect(groups).toEqual([{ member: null, docs: [docs[0]] }])
  })

  it('behält die Reihenfolge der Dokumente innerhalb einer Gruppe bei', () => {
    const docs = [
      doc({ id: 'newer', familyMemberId: ANTON.id }),
      doc({ id: 'older', familyMemberId: ANTON.id }),
    ]
    const groups = groupDocuments(docs, [ANTON])
    expect(groups[0].docs.map(d => d.id)).toEqual(['newer', 'older'])
  })
})

const mocks = vi.hoisted(() => ({
  documents: [] as Document[],
  familyMembers: [] as FamilyMember[],
}))

vi.mock('../hooks/useDocuments', () => ({
  useDocuments: () => ({
    documents: mocks.documents,
    loading: false,
    error: null,
    uploadDocument: vi.fn(),
    reassignDocument: vi.fn(),
    deleteDocument: vi.fn(),
    downloadUrl: (id: string) => `/api/documents/${id}/download`,
    viewUrl: (id: string) => `/api/documents/${id}/view`,
    extractEvents: vi.fn(),
  }),
}))

vi.mock('../hooks/useFamilyMembers', () => ({
  useFamilyMembers: () => ({
    members: mocks.familyMembers,
    loading: false,
    error: null,
    addMember: vi.fn(),
    editMember: vi.fn(),
    removeMember: vi.fn(),
  }),
}))

vi.mock('../hooks/useEvents', () => ({
  useEvents: () => ({
    events: [],
    loading: false,
    error: null,
    fetchEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  }),
}))

describe('DocumentsPage — Gruppierung', () => {
  beforeEach(() => {
    mocks.documents = []
    mocks.familyMembers = []
  })

  it('zeigt Gruppen-Header für zugewiesene und unzugewiesene Dokumente', () => {
    mocks.familyMembers = [ANTON, MIRA]
    mocks.documents = [
      doc({ id: 'd1', filename: 'anton.pdf', familyMemberId: ANTON.id }),
      doc({ id: 'd2', filename: 'allgemein.pdf', familyMemberId: null }),
    ]
    render(<DocumentsPage />)

    expect(screen.getByRole('heading', { name: 'Anton' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Allgemein' })).toBeInTheDocument()
  })

  it('zeigt keine Allgemein-Gruppe, wenn alle Dokumente zugewiesen sind', () => {
    mocks.familyMembers = [ANTON]
    mocks.documents = [doc({ id: 'd1', filename: 'anton.pdf', familyMemberId: ANTON.id })]
    render(<DocumentsPage />)

    expect(screen.queryByRole('heading', { name: 'Allgemein' })).not.toBeInTheDocument()
  })

  it('zeigt den leeren Zustand statt Gruppen-Headern, wenn keine Dokumente existieren', () => {
    mocks.familyMembers = [ANTON]
    mocks.documents = []
    render(<DocumentsPage />)

    expect(screen.getByText('Keine Dokumente')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Allgemein' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Anton' })).not.toBeInTheDocument()
  })

  it('bewegt ein Dokument live in seine neue Gruppe und entfernt die alte, wenn sie leer wird (Reassign ohne Reload)', () => {
    mocks.familyMembers = [ANTON, MIRA]
    mocks.documents = [doc({ id: 'd1', filename: 'shared.pdf', familyMemberId: ANTON.id })]
    const { rerender } = render(<DocumentsPage />)

    expect(screen.getByRole('heading', { name: 'Anton' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mira' })).not.toBeInTheDocument()

    // Simulates the state useDocuments would hold after a successful reassignDocument call.
    mocks.documents = [doc({ id: 'd1', filename: 'shared.pdf', familyMemberId: MIRA.id })]
    rerender(<DocumentsPage />)

    expect(screen.queryByRole('heading', { name: 'Anton' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mira' })).toBeInTheDocument()
  })
})
