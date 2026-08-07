export interface FamilyMember {
  id: string
  name: string
  initials: string
  color: string
  online: boolean
  createdAt: string
}

export interface CreateFamilyMemberInput {
  name: string
  initials: string
  color: string
}
