import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import type { Document } from '../../types/document'

const pdfDoc: Document = {
  id: 'doc-1',
  filename: 'impfausweis.pdf',
  contentType: 'application/pdf',
  sizeBytes: 2048,
  familyMemberId: null,
  uploadedAt: '2024-01-15T10:00:00Z',
}

function renderModal(doc: Document = pdfDoc) {
  const onClose = vi.fn()
  render(
    <DocumentPreviewModal
      doc={doc}
      viewUrl={`http://api.test/api/documents/${doc.id}/view`}
      downloadUrl={`http://api.test/api/documents/${doc.id}/download`}
      onClose={onClose}
    />
  )
  return { onClose }
}

describe('DocumentPreviewModal — Typ-Erkennung', () => {
  it('rendert ein iframe für PDF-Dokumente', () => {
    renderModal(pdfDoc)
    expect(screen.getByTitle('impfausweis.pdf').tagName).toBe('IFRAME')
  })

  it('rendert ein img-Tag für Bild-Dokumente', () => {
    renderModal({ ...pdfDoc, filename: 'foto.jpg', contentType: 'image/jpeg' })
    expect(screen.getByAltText('foto.jpg').tagName).toBe('IMG')
  })

  it('zeigt Fallback-Hinweis für nicht-vorschaufähige Typen (z.B. docx)', () => {
    renderModal({ ...pdfDoc, filename: 'vertrag.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    expect(screen.getByText('Vorschau für diesen Dateityp nicht verfügbar')).toBeInTheDocument()
  })

  it('behandelt HEIC als nicht-vorschaufähig (Fallback statt img)', () => {
    renderModal({ ...pdfDoc, filename: 'foto.heic', contentType: 'image/heic' })
    expect(screen.getByText('Vorschau für diesen Dateityp nicht verfügbar')).toBeInTheDocument()
    expect(screen.queryByAltText('foto.heic')).not.toBeInTheDocument()
  })

  it('Fallback zeigt einen Download-Button', () => {
    renderModal({ ...pdfDoc, filename: 'archiv.zip', contentType: 'application/zip' })
    const link = screen.getByRole('link', { name: 'Herunterladen' })
    expect(link).toHaveAttribute('href', 'http://api.test/api/documents/doc-1/download')
  })
})

describe('DocumentPreviewModal — Schließen', () => {
  it('ruft onClose bei Klick auf den X-Button auf', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Schließen' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ruft onClose bei Escape-Taste auf', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('zeigt den Download-Button auch im Header', () => {
    renderModal()
    const link = screen.getByRole('link', { name: 'impfausweis.pdf herunterladen' })
    expect(link).toHaveAttribute('href', 'http://api.test/api/documents/doc-1/download')
  })
})
