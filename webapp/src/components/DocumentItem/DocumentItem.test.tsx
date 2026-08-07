import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentItem } from './DocumentItem'
import type { Document } from '../../types/document'
import type { FamilyMember } from '../../types/family'

const baseDoc: Document = {
  id: 'doc-1',
  filename: 'impfausweis.pdf',
  contentType: 'application/pdf',
  sizeBytes: 2048,
  familyMemberId: null,
  uploadedAt: '2024-01-15T10:00:00Z',
}

const members: FamilyMember[] = [
  { id: 'member-1', name: 'Anton', initials: 'A', color: '#5B6AF0', online: false, createdAt: '2024-01-01T00:00:00' },
]

function renderDocumentItem(overrides: Partial<Document> = {}) {
  const doc = { ...baseDoc, ...overrides }
  const onReassign = vi.fn()
  const onDelete = vi.fn()
  const onPreview = vi.fn()
  render(
    <ul>
      <DocumentItem
        doc={doc}
        familyMembers={members}
        downloadUrl="http://api.test/api/documents/doc-1/download"
        onPreview={onPreview}
        onReassign={onReassign}
        onDelete={onDelete}
      />
    </ul>
  )
  return { doc, onReassign, onDelete, onPreview }
}

describe('DocumentItem — Render', () => {
  it('zeigt den Dateinamen an', () => {
    renderDocumentItem()
    expect(screen.getByText('impfausweis.pdf')).toBeInTheDocument()
  })

  it('zeigt Dateigröße und Datum an', () => {
    renderDocumentItem()
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument()
  })

  it('zeigt "Nicht zugewiesen" als Standard im Select', () => {
    renderDocumentItem()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('zeigt zugewiesenes Mitglied im Select', () => {
    renderDocumentItem({ familyMemberId: 'member-1' })
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('member-1')
  })

  it('Download-Link zeigt auf die downloadUrl', () => {
    renderDocumentItem()
    const link = screen.getByRole('link', { name: 'impfausweis.pdf herunterladen' })
    expect(link).toHaveAttribute('href', 'http://api.test/api/documents/doc-1/download')
  })
})

describe('DocumentItem — Ansehen', () => {
  it('ruft onPreview mit dem Dokument auf (kein Link, kein neuer Tab)', async () => {
    const user = userEvent.setup()
    const { onPreview, doc } = renderDocumentItem()
    const btn = screen.getByRole('button', { name: 'impfausweis.pdf ansehen' })
    await user.click(btn)
    expect(onPreview).toHaveBeenCalledWith(doc)
  })

  it('Ansehen ist ein Button, kein Link mit target="_blank"', () => {
    renderDocumentItem()
    expect(screen.queryByRole('link', { name: 'impfausweis.pdf ansehen' })).not.toBeInTheDocument()
  })
})

describe('DocumentItem — Zuweisung ändern', () => {
  it('ruft onReassign mit der Dokument-ID und Mitglied-ID auf', async () => {
    const user = userEvent.setup()
    const { onReassign } = renderDocumentItem()
    await user.selectOptions(screen.getByRole('combobox'), 'member-1')
    expect(onReassign).toHaveBeenCalledWith('doc-1', 'member-1')
  })

  it('ruft onReassign mit null auf, wenn "Nicht zugewiesen" gewählt wird', async () => {
    const user = userEvent.setup()
    const { onReassign } = renderDocumentItem({ familyMemberId: 'member-1' })
    await user.selectOptions(screen.getByRole('combobox'), '')
    expect(onReassign).toHaveBeenCalledWith('doc-1', null)
  })
})

describe('DocumentItem — Inline-Delete-Confirm', () => {
  it('zeigt nach Klick auf Löschen-Button den Bestätigungs-Dialog', async () => {
    const user = userEvent.setup()
    renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf löschen' }))
    expect(screen.getByText('Löschen?')).toBeInTheDocument()
  })

  it('ruft onDelete mit Dokument-ID auf nach Bestätigung', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf löschen' }))
    await user.click(screen.getByRole('button', { name: 'Ja' }))
    expect(onDelete).toHaveBeenCalledWith('doc-1')
  })

  it('ruft onDelete NICHT auf wenn Bestätigung abgebrochen wird', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf löschen' }))
    await user.click(screen.getByRole('button', { name: 'Nein' }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
