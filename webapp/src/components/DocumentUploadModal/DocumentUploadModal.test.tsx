import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentUploadModal } from './DocumentUploadModal'
import type { FamilyMember } from '../../types/family'

const MOCK_FAMILY: FamilyMember[] = [
  { id: 'member-1', name: 'Anton', initials: 'AK', color: '#5B6AF0', online: true, createdAt: '2024-01-01T00:00:00' },
]

function makeFile() {
  return new File(['dummy content'], 'impfausweis.pdf', { type: 'application/pdf' })
}

function renderModal(props: { familyMembers?: FamilyMember[] } = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  const utils = render(
    <DocumentUploadModal familyMembers={props.familyMembers ?? MOCK_FAMILY} onSave={onSave} onClose={onClose} />
  )
  return { ...utils, onSave, onClose }
}

// jsdom does not correctly clear `validity.valueMissing` on a `required`
// <input type="file"> even after userEvent.upload(), so a real click on the
// submit button never reaches native form submission. fireEvent.submit()
// dispatches the submit event directly, bypassing that jsdom limitation
// (this is not testing around a product bug — required-field validity is
// still covered by the disabled-button assertions below).
function submitForm(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form')!)
}

describe('DocumentUploadModal — Validierung (AC1)', () => {
  it('Submit-Button ist disabled, wenn keine Datei ausgewählt ist', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Hochladen' })).toBeDisabled()
  })

  it('aktiviert den Submit-Button, sobald eine Datei ausgewählt ist', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.upload(screen.getByLabelText('Datei *'), makeFile())
    expect(screen.getByRole('button', { name: 'Hochladen' })).toBeEnabled()
  })
})

describe('DocumentUploadModal — Absenden (AC1)', () => {
  it('ruft onSave mit der Datei und null auf, wenn keine Zuweisung gewählt ist', async () => {
    const user = userEvent.setup()
    const { onSave, container } = renderModal()
    const file = makeFile()
    await user.upload(screen.getByLabelText('Datei *'), file)
    await act(async () => submitForm(container))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(file, null)
  })

  it('ruft onSave mit der Datei und der family_member_id auf, wenn eine Zuweisung gewählt ist', async () => {
    const user = userEvent.setup()
    const { onSave, container } = renderModal()
    const file = makeFile()
    await user.upload(screen.getByLabelText('Datei *'), file)
    await user.selectOptions(screen.getByLabelText('Zuweisen an'), 'member-1')
    await act(async () => submitForm(container))

    expect(onSave).toHaveBeenCalledWith(file, 'member-1')
  })

  it('schließt das Modal, wenn onSave mit null (Erfolg) auflöst', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValueOnce(null)
    const onClose = vi.fn()
    const { container } = render(<DocumentUploadModal familyMembers={MOCK_FAMILY} onSave={onSave} onClose={onClose} />)
    await user.upload(screen.getByLabelText('Datei *'), makeFile())
    await act(async () => submitForm(container))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('zeigt die Fehlermeldung inline und lässt das Modal offen, wenn onSave einen Fehlertext liefert', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValueOnce('Nicht unterstützter Dateityp')
    const onClose = vi.fn()
    const { container } = render(<DocumentUploadModal familyMembers={MOCK_FAMILY} onSave={onSave} onClose={onClose} />)
    await user.upload(screen.getByLabelText('Datei *'), makeFile())
    await act(async () => submitForm(container))

    expect(screen.getByText('Nicht unterstützter Dateityp')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('zeigt "Wird hochgeladen…" und deaktiviert den Button, während onSave läuft', async () => {
    const user = userEvent.setup()
    let resolveSave: (err: string | null) => void = () => {}
    const onSave = vi.fn(() => new Promise<string | null>(resolve => { resolveSave = resolve }))
    const onClose = vi.fn()
    const { container } = render(<DocumentUploadModal familyMembers={MOCK_FAMILY} onSave={onSave} onClose={onClose} />)
    await user.upload(screen.getByLabelText('Datei *'), makeFile())
    submitForm(container)

    const pendingBtn = await screen.findByRole('button', { name: 'Wird hochgeladen…' })
    expect(pendingBtn).toBeDisabled()

    await act(async () => resolveSave(null))
  })

  it('ruft onSave nur einmal auf, wenn während eines laufenden Requests erneut geklickt wird', async () => {
    const user = userEvent.setup()
    let resolveSave: (err: string | null) => void = () => {}
    const onSave = vi.fn(() => new Promise<string | null>(resolve => { resolveSave = resolve }))
    const onClose = vi.fn()
    const { container } = render(<DocumentUploadModal familyMembers={MOCK_FAMILY} onSave={onSave} onClose={onClose} />)
    await user.upload(screen.getByLabelText('Datei *'), makeFile())

    submitForm(container)
    expect(onSave).toHaveBeenCalledTimes(1)

    // Der Button ist jetzt disabled — ein realer Klick eines Nutzers darauf ist ein No-op,
    // das ist der eigentliche (einzige) Doppel-Submit-Schutz dieser Komponente.
    const pendingBtn = await screen.findByRole('button', { name: 'Wird hochgeladen…' })
    await user.click(pendingBtn)
    expect(onSave).toHaveBeenCalledTimes(1)

    await act(async () => resolveSave(null))
  })
})

describe('DocumentUploadModal — Schließen', () => {
  it('ruft onClose beim Klick auf den Schließen-Button (X) auf', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Schließen' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ruft onClose beim Klick auf Abbrechen auf', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ruft onClose beim Klick auf den Backdrop auf', async () => {
    const user = userEvent.setup()
    const { onClose, container } = renderModal()
    await user.click(container.firstChild as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ruft onClose NICHT beim Klick innerhalb des Modal-Inhalts auf', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
