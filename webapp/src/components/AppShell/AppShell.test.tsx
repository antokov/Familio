import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from './AppShell'


function renderShell(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell />
    </MemoryRouter>
  )
}

describe('AppShell — Mobile-Drawer Interaktion', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Drawer ist initial geschlossen', () => {
    renderShell()
    expect(screen.getByRole('complementary')).not.toHaveClass('drawerOpen')
  })

  it('Hamburger-Klick öffnet den Drawer', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByRole('complementary')).toHaveClass('drawerOpen')
  })

  it('X-Button schließt den Drawer', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    await user.click(screen.getByRole('button', { name: 'Menü schließen' }))
    expect(screen.getByRole('complementary')).not.toHaveClass('drawerOpen')
  })

  it('Overlay-Klick schließt den Drawer und entfernt das Overlay', async () => {
    const user = userEvent.setup()
    const { container } = renderShell()
    await user.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).toBeInTheDocument()
    await user.click(overlay!)
    expect(screen.getByRole('complementary')).not.toHaveClass('drawerOpen')
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })

  it('Nav-Link-Klick schließt den Drawer', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    await user.click(screen.getByRole('link', { name: 'Kalender' }))
    expect(screen.getByRole('complementary')).not.toHaveClass('drawerOpen')
  })
})

describe('AppShell', () => {
  it('zeigt alle vier Navigationspunkte', () => {
    renderShell()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kalender' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aufgaben' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Einkauf' })).toBeInTheDocument()
  })

  it('zeigt den korrekten Seitentitel für Dashboard', () => {
    renderShell('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard')
  })

  it('zeigt den korrekten Seitentitel für Kalender', () => {
    renderShell('/calendar')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kalender')
  })

  it('Theme-Toggle Button ist vorhanden', () => {
    renderShell()
    expect(
      screen.getByRole('button', { name: /dark mode|light mode/i })
    ).toBeInTheDocument()
  })
})
