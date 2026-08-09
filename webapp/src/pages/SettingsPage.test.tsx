import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { FamilyMember } from '../types/family'
import SettingsPage from './SettingsPage'

const MOCK_MEMBERS: FamilyMember[] = [
  { id: '1', name: 'Anton',  initials: 'A', color: '#5B6AF0', online: true,  createdAt: '2024-01-01T00:00:00' },
  { id: '2', name: 'Milena', initials: 'M', color: '#F0805B', online: true,  createdAt: '2024-01-02T00:00:00' },
  { id: '3', name: 'Lena',   initials: 'L', color: '#4CAF82', online: false, createdAt: '2024-01-03T00:00:00' },
  { id: '4', name: 'Nikola', initials: 'N', color: '#F0C75B', online: false, createdAt: '2024-01-04T00:00:00' },
]

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () => ({ theme: 'light' as const, toggleTheme: vi.fn() }),
  }
})

vi.mock('../hooks/useFamilyMembers', () => ({
  useFamilyMembers: () => ({
    members: MOCK_MEMBERS,
    loading: false,
    error: null,
    addMember: vi.fn(),
    editMember: vi.fn(),
    removeMember: vi.fn(),
  }),
}))

describe('SettingsPage', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )
  }

  it('rendert die Darstellung-Sektion mit ThemeToggle', () => {
    renderPage()
    expect(screen.getByText('Darstellung')).toBeInTheDocument()
    expect(screen.getByText('Farbschema')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument()
  })

  it('rendert die Familie-Sektion', () => {
    renderPage()
    expect(screen.getByText('Familie')).toBeInTheDocument()
  })

  it('rendert alle Familienmitglieder mit Namen', () => {
    renderPage()
    for (const member of MOCK_MEMBERS) {
      expect(screen.getByText(member.name)).toBeInTheDocument()
    }
  })

  it('zeigt „Online" für Online-Mitglieder', () => {
    renderPage()
    const onlineCount = MOCK_MEMBERS.filter(m => m.online).length
    expect(screen.getAllByText('Online')).toHaveLength(onlineCount)
  })

  it('zeigt „Offline" für Offline-Mitglieder', () => {
    renderPage()
    const offlineCount = MOCK_MEMBERS.filter(m => !m.online).length
    expect(screen.getAllByText('Offline')).toHaveLength(offlineCount)
  })

  it('rendert Initialen-Avatare für alle Mitglieder', () => {
    renderPage()
    for (const member of MOCK_MEMBERS) {
      expect(screen.getByText(member.initials)).toBeInTheDocument()
    }
  })

  it('zeigt „Mitglied hinzufügen"-Button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /mitglied hinzufügen/i })).toBeInTheDocument()
  })

  it('zeigt Bearbeiten-Button für jedes Mitglied', () => {
    renderPage()
    const editBtns = screen.getAllByRole('button', { name: /bearbeiten/i })
    expect(editBtns).toHaveLength(MOCK_MEMBERS.length)
  })

  it('rendert die App-Sektion mit Download-Link zur APK', () => {
    renderPage()
    expect(screen.getByText('App')).toBeInTheDocument()
    expect(screen.getByText('Android-App')).toBeInTheDocument()

    const downloadLink = screen.getByRole('link', { name: /herunterladen/i })
    expect(downloadLink).toHaveAttribute('href', '/downloads/familio.apk')
    expect(downloadLink).toHaveAttribute('download')
  })
})
