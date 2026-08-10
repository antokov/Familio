import { render, screen } from '@testing-library/react'
import { DocumentGroupHeader } from './DocumentGroupHeader'
import type { FamilyMember } from '../../types/family'

const MIRA: FamilyMember = { id: 'fm-1', name: 'Mira', initials: 'M', color: '#4CAF82', online: false, createdAt: '2024-01-01T00:00:00' }

describe('DocumentGroupHeader', () => {
  it('zeigt Name und Avatar für ein Familienmitglied', () => {
    render(<DocumentGroupHeader member={MIRA} />)
    expect(screen.getByText('Mira')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('zeigt "Allgemein" ohne Avatar, wenn kein Mitglied übergeben wird', () => {
    render(<DocumentGroupHeader member={null} />)
    expect(screen.getByText('Allgemein')).toBeInTheDocument()
    expect(screen.queryByText('M')).not.toBeInTheDocument()
  })
})
