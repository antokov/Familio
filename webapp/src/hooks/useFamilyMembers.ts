import { useState, useCallback, useEffect } from 'react'
import type { FamilyMember, CreateFamilyMemberInput } from '../types/family'
import { API_BASE } from '../api/config'

function fromApi(raw: Record<string, unknown>): FamilyMember {
  return {
    id: raw['id'] as string,
    name: raw['name'] as string,
    initials: raw['initials'] as string,
    color: raw['color'] as string,
    online: raw['online'] as boolean,
    createdAt: raw['created_at'] as string,
  }
}

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/family-members`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Record<string, unknown>[]
      setMembers(data.map(fromApi))
    } catch {
      setError('Familienmitglieder konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const addMember = useCallback(async (input: CreateFamilyMemberInput): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/family-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name.trim(),
          initials: input.initials.toUpperCase(),
          color: input.color,
        }),
      })
      if (res.status === 409) return 'Diese Initialen sind bereits vergeben'
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = (await res.json()) as Record<string, unknown>
      setMembers(prev => [...prev, fromApi(raw)])
      return null
    } catch {
      return 'Mitglied konnte nicht erstellt werden'
    }
  }, [])

  const editMember = useCallback(
    async (id: string, input: Partial<CreateFamilyMemberInput>): Promise<string | null> => {
      try {
        const body: Record<string, unknown> = {}
        if (input.name !== undefined) body['name'] = input.name.trim()
        if (input.initials !== undefined) body['initials'] = input.initials.toUpperCase()
        if (input.color !== undefined) body['color'] = input.color
        const res = await fetch(`${API_BASE}/api/family-members/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.status === 409) return 'Diese Initialen sind bereits vergeben'
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = (await res.json()) as Record<string, unknown>
        setMembers(prev => prev.map(m => m.id === id ? fromApi(raw) : m))
        return null
      } catch {
        return 'Mitglied konnte nicht aktualisiert werden'
      }
    },
    []
  )

  const removeMember = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/family-members/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMembers(prev => prev.filter(m => m.id !== id))
    } catch {
      setError('Mitglied konnte nicht entfernt werden')
    }
  }, [])

  return { members, loading, error, addMember, editMember, removeMember }
}
