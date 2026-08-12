import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickAddBar } from './QuickAddBar'

function renderBar(onAdd = vi.fn(() => Promise.resolve())) {
  render(<QuickAddBar onAdd={onAdd} />)
  return { onAdd }
}

describe('QuickAddBar — Fokus (AC1)', () => {
  it('fokussiert das Namensfeld automatisch beim Mounten', () => {
    renderBar()
    expect(screen.getByLabelText('Produktname')).toHaveFocus()
  })
})

describe('QuickAddBar — Enter-Submit aus jedem Feld (AC2)', () => {
  it('ruft onAdd bei Enter im Namensfeld auf', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Milch{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({ name: 'Milch', unit: 'stk', quantity: 1, store: 'egal' })
  })

  it('ruft onAdd bei Enter im Einheit-Select auf', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Mehl')
    await user.selectOptions(screen.getByLabelText('Einheit'), 'g')
    await user.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({ name: 'Mehl', unit: 'g', quantity: 1, store: 'egal' })
  })

  it('ruft onAdd bei Enter im Mengenfeld auf', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Äpfel')
    await user.type(screen.getByLabelText('Menge'), '3{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({ name: 'Äpfel', unit: 'stk', quantity: 3, store: 'egal' })
  })

  it('ruft onAdd bei Enter im Laden-Select auf', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Butter')
    await user.selectOptions(screen.getByLabelText('Laden'), 'migros')
    await user.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({ name: 'Butter', unit: 'stk', quantity: 1, store: 'migros' })
  })

  it('ruft onAdd bei Enter auf dem Absenden-Button auf', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Eier')
    const submitBtn = screen.getByRole('button', { name: 'Artikel hinzufügen' })
    submitBtn.focus()
    await user.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith({ name: 'Eier', unit: 'stk', quantity: 1, store: 'egal' })
  })
})

describe('QuickAddBar — Mengen-Parsing', () => {
  it('übernimmt eine gültige Dezimalmenge unverändert', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Käse')
    await user.type(screen.getByLabelText('Menge'), '2.5{Enter}')
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2.5 }))
  })

  it('fällt bei leerer Menge auf 1 zurück', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Brot{Enter}')
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }))
  })

  it('fällt bei nicht-numerischer Menge auf 1 zurück', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Reis')
    const quantityInput = screen.getByLabelText('Menge') as HTMLInputElement
    // type="number" lässt Buchstaben ohnehin nicht ins DOM-Feld, direkte Wertsetzung umgeht das,
    // um den parseFloat-Fallback trotzdem realistisch zu erzwingen (z.B. bei Copy/Paste)
    fireEvent.change(quantityInput, { target: { value: 'abc' } })
    await user.click(screen.getByRole('button', { name: 'Artikel hinzufügen' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }))
  })

  it('fällt bei 0 auf 1 zurück', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Zucker')
    await user.type(screen.getByLabelText('Menge'), '0{Enter}')
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }))
  })

  it('fällt bei negativer Menge auf 1 zurück', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Salz')
    const quantityInput = screen.getByLabelText('Menge') as HTMLInputElement
    fireEvent.change(quantityInput, { target: { value: '-5' } })
    await user.click(screen.getByRole('button', { name: 'Artikel hinzufügen' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }))
  })
})

describe('QuickAddBar — Zurücksetzen nach erfolgreichem Absenden (AC3)', () => {
  it('setzt Name, Menge und Laden zurück, behält aber die gewählte Einheit', async () => {
    const user = userEvent.setup()
    renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Milch')
    await user.selectOptions(screen.getByLabelText('Einheit'), 'g')
    await user.type(screen.getByLabelText('Menge'), '5')
    await user.selectOptions(screen.getByLabelText('Laden'), 'lidl')
    await user.click(screen.getByRole('button', { name: 'Artikel hinzufügen' }))

    await waitFor(() => expect(screen.getByLabelText('Produktname')).toHaveValue(''))
    expect(screen.getByLabelText('Menge')).toHaveValue(null)
    expect(screen.getByLabelText('Laden')).toHaveValue('egal')
    expect(screen.getByLabelText('Einheit')).toHaveValue('g')
  })

  it('fokussiert das Namensfeld erneut nach dem Zurücksetzen', async () => {
    const user = userEvent.setup()
    renderBar()
    await user.type(screen.getByLabelText('Produktname'), 'Milch{Enter}')
    await waitFor(() => expect(screen.getByLabelText('Produktname')).toHaveFocus())
  })
})

describe('QuickAddBar — Doppel-Submit-Schutz (AC4)', () => {
  it('ruft onAdd nur einmal auf, wenn der Absenden-Button während eines laufenden Requests erneut geklickt wird', async () => {
    const user = userEvent.setup()
    let resolveAdd: () => void = () => {}
    const onAdd = vi.fn(() => new Promise<void>(resolve => { resolveAdd = resolve }))
    renderBar(onAdd)

    await user.type(screen.getByLabelText('Produktname'), 'Milch')
    const submitBtn = screen.getByRole('button', { name: 'Artikel hinzufügen' })
    await user.click(submitBtn)
    expect(submitBtn).toBeDisabled()

    await user.click(submitBtn)
    expect(onAdd).toHaveBeenCalledTimes(1)

    resolveAdd()
    await waitFor(() => expect(screen.getByLabelText('Produktname')).toHaveValue(''))
  })

  it('erlaubt einen neuen Submit, sobald der vorherige Request abgeschlossen ist (submitting-Flag bleibt nicht hängen)', async () => {
    const user = userEvent.setup()
    let resolveAdd: () => void = () => {}
    const onAdd = vi.fn(() => new Promise<void>(resolve => { resolveAdd = resolve }))
    renderBar(onAdd)

    const nameInput = screen.getByLabelText('Produktname')
    await user.type(nameInput, 'Milch')
    const submitBtn = screen.getByRole('button', { name: 'Artikel hinzufügen' })
    await user.click(submitBtn)
    expect(submitBtn).toBeDisabled()

    resolveAdd()
    await waitFor(() => expect(nameInput).toHaveValue(''))

    await user.type(nameInput, 'Butter')
    await user.click(submitBtn)
    expect(onAdd).toHaveBeenCalledTimes(2)
  })

  it('ruft onAdd nur einmal auf, wenn Enter während eines laufenden Requests erneut gedrückt wird', async () => {
    const user = userEvent.setup()
    let resolveAdd: () => void = () => {}
    const onAdd = vi.fn(() => new Promise<void>(resolve => { resolveAdd = resolve }))
    renderBar(onAdd)

    const nameInput = screen.getByLabelText('Produktname')
    await user.type(nameInput, 'Milch{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)

    await user.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)

    resolveAdd()
    await waitFor(() => expect(nameInput).toHaveValue(''))
  })
})

describe('QuickAddBar — Leerer/Whitespace-Name blockiert Submit (AC5)', () => {
  it('deaktiviert den Absenden-Button, wenn der Name leer ist', () => {
    renderBar()
    expect(screen.getByRole('button', { name: 'Artikel hinzufügen' })).toBeDisabled()
  })

  it('ruft onAdd nicht auf, wenn der Name nur aus Leerzeichen besteht', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderBar()
    const nameInput = screen.getByLabelText('Produktname')
    await user.type(nameInput, '   ')
    expect(screen.getByRole('button', { name: 'Artikel hinzufügen' })).toBeDisabled()

    await user.keyboard('{Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })
})
