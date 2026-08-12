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

function renderDocumentItem(
  overrides: Partial<Document> = {},
  extracting = false,
  onRenameImpl: (id: string, filename: string) => Promise<boolean> = () => Promise.resolve(true)
) {
  const doc = { ...baseDoc, ...overrides }
  const onReassign = vi.fn()
  const onRename = vi.fn(onRenameImpl)
  const onDelete = vi.fn()
  const onPreview = vi.fn()
  const onExtractEvents = vi.fn()
  render(
    <ul>
      <DocumentItem
        doc={doc}
        familyMembers={members}
        downloadUrl="http://api.test/api/documents/doc-1/download"
        extracting={extracting}
        onPreview={onPreview}
        onReassign={onReassign}
        onRename={onRename}
        onDelete={onDelete}
        onExtractEvents={onExtractEvents}
      />
    </ul>
  )
  return { doc, onReassign, onRename, onDelete, onPreview, onExtractEvents }
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

describe('DocumentItem — Termine extrahieren', () => {
  it('zeigt den Button bei einem PDF-Dokument', () => {
    renderDocumentItem({ contentType: 'application/pdf' })
    expect(screen.getByRole('button', { name: 'Termine aus impfausweis.pdf extrahieren' })).toBeInTheDocument()
  })

  it('zeigt den Button bei einem Bild-Dokument', () => {
    renderDocumentItem({ contentType: 'image/jpeg' })
    expect(screen.getByRole('button', { name: 'Termine aus impfausweis.pdf extrahieren' })).toBeInTheDocument()
  })

  it('zeigt den Button NICHT bei einem nicht unterstützten Dateityp', () => {
    renderDocumentItem({ contentType: 'application/msword' })
    expect(screen.queryByRole('button', { name: 'Termine aus impfausweis.pdf extrahieren' })).not.toBeInTheDocument()
  })

  it('ruft onExtractEvents mit dem Dokument auf', async () => {
    const user = userEvent.setup()
    const { onExtractEvents, doc } = renderDocumentItem({ contentType: 'application/pdf' })
    await user.click(screen.getByRole('button', { name: 'Termine aus impfausweis.pdf extrahieren' }))
    expect(onExtractEvents).toHaveBeenCalledWith(doc)
  })

  it('ist disabled während extracting=true', () => {
    renderDocumentItem({ contentType: 'application/pdf' }, true)
    expect(screen.getByRole('button', { name: 'Termine aus impfausweis.pdf extrahieren' })).toBeDisabled()
  })
})

describe('DocumentItem — Umbenennen', () => {
  it('zeigt ein vorausgefülltes Eingabefeld nach Klick auf Umbenennen', async () => {
    const user = userEvent.setup()
    renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf') as HTMLInputElement
    expect(input.value).toBe('impfausweis.pdf')
  })

  it('ruft onRename mit dem getrimmten neuen Namen auf und schließt das Eingabefeld', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf')
    await user.clear(input)
    await user.type(input, '  Impfausweis 2026.pdf  ')
    await user.click(screen.getByRole('button', { name: 'Umbenennen bestätigen' }))
    expect(onRename).toHaveBeenCalledWith('doc-1', 'Impfausweis 2026.pdf')
    expect(screen.queryByLabelText('Neuer Name für impfausweis.pdf')).not.toBeInTheDocument()
  })

  it('bestätigt auch per Enter-Taste', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf')
    await user.clear(input)
    await user.type(input, 'Neu.pdf{Enter}')
    expect(onRename).toHaveBeenCalledWith('doc-1', 'Neu.pdf')
  })

  it('lehnt einen leeren Namen ab, ohne onRename aufzurufen', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Umbenennen bestätigen' }))
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Name darf nicht leer sein.')).toBeInTheDocument()
    expect(screen.getByLabelText('Neuer Name für impfausweis.pdf')).toBeInTheDocument()
  })

  it('lehnt einen nur aus Leerzeichen bestehenden Namen ab', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf')
    await user.clear(input)
    await user.type(input, '   ')
    await user.click(screen.getByRole('button', { name: 'Umbenennen bestätigen' }))
    expect(onRename).not.toHaveBeenCalled()
  })

  it('bricht per Abbrechen-Button ab und stellt den ursprünglichen Namen wieder her', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf')
    await user.clear(input)
    await user.type(input, 'Verworfen.pdf')
    await user.click(screen.getByRole('button', { name: 'Umbenennen abbrechen' }))
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('impfausweis.pdf')).toBeInTheDocument()
  })

  it('bricht per Escape-Taste ab', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    const input = screen.getByLabelText('Neuer Name für impfausweis.pdf')
    await user.type(input, '{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('impfausweis.pdf')).toBeInTheDocument()
  })

  it('zeigt eine Fehlermeldung und bleibt im Bearbeitungsmodus, wenn onRename fehlschlägt', async () => {
    const user = userEvent.setup()
    const { onRename } = renderDocumentItem({}, false, () => Promise.resolve(false))
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    await user.click(screen.getByRole('button', { name: 'Umbenennen bestätigen' }))
    expect(onRename).toHaveBeenCalled()
    expect(screen.getByText('Umbenennen fehlgeschlagen. Bitte erneut versuchen.')).toBeInTheDocument()
    expect(screen.getByLabelText('Neuer Name für impfausweis.pdf')).toBeInTheDocument()
  })

  it('versteckt den Löschen-Bestätigungsdialog, während umbenannt wird (nur ein Inline-Modus gleichzeitig)', async () => {
    const user = userEvent.setup()
    renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf umbenennen' }))
    expect(screen.queryByText('Löschen?')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'impfausweis.pdf löschen' })).not.toBeInTheDocument()
  })

  it('versteckt das Umbenennen-Eingabefeld, während der Löschen-Bestätigungsdialog offen ist', async () => {
    const user = userEvent.setup()
    renderDocumentItem()
    await user.click(screen.getByRole('button', { name: 'impfausweis.pdf löschen' }))
    expect(screen.queryByLabelText('Neuer Name für impfausweis.pdf')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'impfausweis.pdf umbenennen' })).not.toBeInTheDocument()
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
