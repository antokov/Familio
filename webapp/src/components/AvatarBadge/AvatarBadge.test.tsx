import { render, screen } from '@testing-library/react'
import { AvatarBadge } from './AvatarBadge'

describe('AvatarBadge — Initialen & Farbe', () => {
  it('rendert die übergebenen Initialen als Text', () => {
    render(<AvatarBadge initials="A" color="#5B6AF0" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('rendert zwei Buchstaben als Initialen', () => {
    render(<AvatarBadge initials="AK" color="#5B6AF0" />)
    expect(screen.getByText('AK')).toBeInTheDocument()
  })

  it('setzt die Hintergrundfarbe als Inline-Style', () => {
    const { container } = render(<AvatarBadge initials="A" color="#5B6AF0" />)
    expect(container.firstChild).toHaveStyle({ backgroundColor: '#5B6AF0' })
  })

  it('setzt die Hintergrundfarbe auch als CSS-Custom-Property', () => {
    const { container } = render(<AvatarBadge initials="M" color="var(--color-primary)" />)
    expect(container.firstChild).toHaveStyle({ backgroundColor: 'var(--color-primary)' })
  })
})

describe('AvatarBadge — CSS-Klassen', () => {
  it('Root-Element hat immer die Basisklasse avatar', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" />)
    expect(container.firstChild).toHaveClass('avatar')
  })

  it('size="sm" → Root hat Klasse sm', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" size="sm" />)
    expect(container.firstChild).toHaveClass('sm')
  })

  it('size="md" → Root hat Klasse md', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" size="md" />)
    expect(container.firstChild).toHaveClass('md')
  })

  it('size="lg" → Root hat Klasse lg', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" size="lg" />)
    expect(container.firstChild).toHaveClass('lg')
  })

  it('Default-Size ohne Prop → Root hat Klasse md', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" />)
    expect(container.firstChild).toHaveClass('md')
  })
})

describe('AvatarBadge — Online-Dot', () => {
  it('online={true} → Dot-Element ist im DOM', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" online={true} />)
    expect(container.querySelector('.dot')).toBeInTheDocument()
  })

  it('online={false} → kein Dot-Element im DOM', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" online={false} />)
    expect(container.querySelector('.dot')).not.toBeInTheDocument()
  })

  it('Default online (kein Prop) → kein Dot-Element im DOM', () => {
    const { container } = render(<AvatarBadge initials="A" color="#c" />)
    expect(container.querySelector('.dot')).not.toBeInTheDocument()
  })
})

describe('AvatarBadge — Kombinations-Tests', () => {
  it('size="sm" online={true} → Klasse sm und Dot vorhanden', () => {
    const { container } = render(<AvatarBadge initials="L" color="#4CAF82" size="sm" online={true} />)
    expect(container.firstChild).toHaveClass('sm')
    expect(container.querySelector('.dot')).toBeInTheDocument()
  })

  it('size="lg" online={true} → Klasse lg und Dot vorhanden', () => {
    const { container } = render(<AvatarBadge initials="N" color="#F0C75B" size="lg" online={true} />)
    expect(container.firstChild).toHaveClass('lg')
    expect(container.querySelector('.dot')).toBeInTheDocument()
  })

  it('size="lg" online={false} → Klasse lg, kein Dot', () => {
    const { container } = render(<AvatarBadge initials="N" color="#F0C75B" size="lg" online={false} />)
    expect(container.firstChild).toHaveClass('lg')
    expect(container.querySelector('.dot')).not.toBeInTheDocument()
  })
})
