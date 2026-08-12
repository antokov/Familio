import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FamilyMemberFormModal } from './FamilyMemberFormModal'
import type { FamilyMember } from '../../types/family'

const EDIT_MEMBER: FamilyMember = {
  id:        'member-1',
  name:      'Anton',
  initials:  'AK',
  color:     '#4CAF82',
  online:    true,
  createdAt: '2024-01-01T00:00:00',
}

function renderModal(props: { editMember?: FamilyMember } = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  const utils = render(<FamilyMemberFormModal {...props} onSave={onSave} onClose={onClose} />)
  return { ...utils, onSave, onClose }
}

describe('FamilyMemberFormModal — Create-Modus', () => {
  it('zeigt leere Felder und die erste Farbe als Standard', () => {
    renderModal()
    expect((screen.getByLabelText('Name *') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Initialen * (max. 2)') as HTMLInputElement).value).toBe('')
    expect(screen.getByRole('button', { name: 'Farbe #5B6AF0' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Titel lautet "Neues Mitglied"', () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Neues Mitglied' })).toBeInTheDocument()
  })

  it('Submit-Button heißt "Hinzufügen" und ist zunächst disabled', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled()
  })

  it('fokussiert das Namensfeld automatisch', () => {
    renderModal()
    expect(screen.getByLabelText('Name *')).toHaveFocus()
  })

  it('zeigt "?" als Vorschau-Initialen, solange keine Initialen eingegeben wurden', () => {
    renderModal()
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})

describe('FamilyMemberFormModal — Edit-Modus', () => {
  it('füllt Name, Initialen und Farbe aus editMember vor (inkl. nicht-Standard-Farbe)', () => {
    renderModal({ editMember: EDIT_MEMBER })
    expect((screen.getByLabelText('Name *') as HTMLInputElement).value).toBe('Anton')
    expect((screen.getByLabelText('Initialen * (max. 2)') as HTMLInputElement).value).toBe('AK')
    expect(screen.getByRole('button', { name: 'Farbe #4CAF82' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Farbe #5B6AF0' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('Titel lautet "Mitglied bearbeiten"', () => {
    renderModal({ editMember: EDIT_MEMBER })
    expect(screen.getByRole('dialog', { name: 'Mitglied bearbeiten' })).toBeInTheDocument()
  })

  it('Submit-Button heißt "Speichern" und ist initial enabled', () => {
    renderModal({ editMember: EDIT_MEMBER })
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled()
  })
})

describe('FamilyMemberFormModal — Initialen-Eingabe (AC3)', () => {
  it('wandelt Kleinbuchstaben live in Großbuchstaben um', async () => {
    const user = userEvent.setup()
    renderModal()
    const initialsInput = screen.getByLabelText('Initialen * (max. 2)') as HTMLInputElement
    await user.type(initialsInput, 'ak')
    expect(initialsInput.value).toBe('AK')
  })

  it('kürzt die Eingabe live auf 2 Zeichen', async () => {
    const user = userEvent.setup()
    renderModal()
    const initialsInput = screen.getByLabelText('Initialen * (max. 2)') as HTMLInputElement
    await user.type(initialsInput, 'anton')
    expect(initialsInput.value).toBe('AN')
  })
})

describe('FamilyMemberFormModal — Farb-Swatch (AC3)', () => {
  it('markiert die angeklickte Farbe als aktiv und aktualisiert die Vorschau', async () => {
    const user = userEvent.setup()
    renderModal()
    const defaultSwatch = screen.getByRole('button', { name: 'Farbe #5B6AF0' })
    const newSwatch = screen.getByRole('button', { name: 'Farbe #F0805B' })
    expect(defaultSwatch).toHaveAttribute('aria-pressed', 'true')

    await user.click(newSwatch)

    expect(newSwatch).toHaveAttribute('aria-pressed', 'true')
    expect(defaultSwatch).toHaveAttribute('aria-pressed', 'false')
    // Der Swatch selbst zeigt immer seine eigene fixe Farbe (unabhängig vom Auswahlstatus) —
    // der eigentliche Beweis, dass die Auswahl übernommen wurde, ist die Vorschau-AvatarBadge.
    expect(screen.getByText('?')).toHaveStyle({ backgroundColor: '#F0805B' })
  })
})

describe('FamilyMemberFormModal — Validierung (AC5)', () => {
  it('Submit-Button bleibt disabled, wenn nur der Name gesetzt ist', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText('Name *'), 'Anton')
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled()
  })

  it('Submit-Button bleibt disabled, wenn Name/Initialen nur aus Leerzeichen bestehen', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText('Name *'), '   ')
    await user.type(screen.getByLabelText('Initialen * (max. 2)'), ' ')
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled()
  })

  it('ruft onSave nicht auf, wenn ein Formular-Submit-Event mit leeren Feldern ausgelöst wird (Guard in handleSubmit)', () => {
    const { onSave, container } = renderModal()
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('FamilyMemberFormModal — Absenden (AC4)', () => {
  it('ruft onSave mit getrimmten Werten und großgeschriebenen Initialen auf', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()
    await user.type(screen.getByLabelText('Name *'), '  Anton  ')
    await user.type(screen.getByLabelText('Initialen * (max. 2)'), 'ak')
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ name: 'Anton', initials: 'AK', color: '#5B6AF0' })
  })

  it('schließt das Modal, wenn onSave mit null (Erfolg) auflöst', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValueOnce(null)
    const onClose = vi.fn()
    render(<FamilyMemberFormModal onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByLabelText('Name *'), 'Anton')
    await user.type(screen.getByLabelText('Initialen * (max. 2)'), 'AK')
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('zeigt die Fehlermeldung inline und lässt das Modal offen, wenn onSave einen Fehlertext liefert', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValueOnce('Diese Initialen sind bereits vergeben')
    const onClose = vi.fn()
    render(<FamilyMemberFormModal onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByLabelText('Name *'), 'Anton')
    await user.type(screen.getByLabelText('Initialen * (max. 2)'), 'AK')
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    expect(screen.getByText('Diese Initialen sind bereits vergeben')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('zeigt "Speichern…" und deaktiviert den Button, während onSave läuft', async () => {
    const user = userEvent.setup()
    let resolveSave: (err: string | null) => void = () => {}
    const onSave = vi.fn(() => new Promise<string | null>(resolve => { resolveSave = resolve }))
    const onClose = vi.fn()
    render(<FamilyMemberFormModal onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByLabelText('Name *'), 'Anton')
    await user.type(screen.getByLabelText('Initialen * (max. 2)'), 'AK')
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }))

    const pendingBtn = screen.getByRole('button', { name: 'Speichern…' })
    expect(pendingBtn).toBeDisabled()

    await act(async () => resolveSave(null))
  })

  it('ruft onSave nur einmal auf, wenn während eines laufenden Requests erneut geklickt wird', async () => {
    const user = userEvent.setup()
    let resolveSave: (err: string | null) => void = () => {}
    const onSave = vi.fn(() => new Promise<string | null>(resolve => { resolveSave = resolve }))
    const onClose = vi.fn()
    render(<FamilyMemberFormModal onSave={onSave} onClose={onClose} />)
    await user.type(screen.getByLabelText('Name *'), 'Anton')
    await user.type(screen.getByLabelText('Initialen * (max. 2)'), 'AK')

    const submitBtn = screen.getByRole('button', { name: 'Hinzufügen' })
    await user.click(submitBtn)
    expect(onSave).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Speichern…' }))
    expect(onSave).toHaveBeenCalledTimes(1)

    await act(async () => resolveSave(null))
  })
})

describe('FamilyMemberFormModal — Schließen', () => {
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
