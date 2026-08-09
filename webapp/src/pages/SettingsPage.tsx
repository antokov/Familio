import { useState } from 'react'
import { Pencil, Trash2, Plus, Smartphone, Download } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { AvatarBadge } from '../components/AvatarBadge/AvatarBadge'
import { FamilyMemberFormModal } from '../components/FamilyMemberFormModal/FamilyMemberFormModal'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import type { FamilyMember } from '../types/family'
import type { AppShellOutletContext } from '../components/AppShell/AppShell'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { theme, toggleTheme } = useOutletContext<AppShellOutletContext>()
  const { members, loading, error, addMember, editMember, removeMember } = useFamilyMembers()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | undefined>()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function openAdd() {
    setEditingMember(undefined)
    setModalOpen(true)
  }

  function openEdit(member: FamilyMember) {
    setEditingMember(member)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingMember(undefined)
  }

  async function handleSave(input: Parameters<typeof addMember>[0]) {
    if (editingMember) {
      return editMember(editingMember.id, input)
    }
    return addMember(input)
  }

  async function handleDeleteConfirm(id: string) {
    await removeMember(id)
    setConfirmDeleteId(null)
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Darstellung</h2>
        <div className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Farbschema</span>
              <span className={styles.settingHint}>Hell oder Dunkel</span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Familie</h2>
        <div className={styles.card}>
          {loading && <p className={styles.stateMsg}>Lade…</p>}
          {error && <p className={styles.errorMsg}>{error}</p>}

          {!loading && !error && members.map(member => (
            <div key={member.id} className={styles.memberRow}>
              {confirmDeleteId === member.id ? (
                <>
                  <span className={styles.confirmText}>Entfernen?</span>
                  <button
                    className={styles.confirmBtn}
                    onClick={() => handleDeleteConfirm(member.id)}
                  >
                    Ja
                  </button>
                  <button
                    className={styles.cancelConfirmBtn}
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Nein
                  </button>
                </>
              ) : (
                <>
                  <AvatarBadge
                    initials={member.initials}
                    color={member.color}
                    online={member.online}
                    size="md"
                  />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span
                      className={styles.memberStatus}
                      style={member.online ? { color: 'var(--color-success)' } : undefined}
                    >
                      {member.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className={styles.memberActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openEdit(member)}
                      aria-label={`${member.name} bearbeiten`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => setConfirmDeleteId(member.id)}
                      aria-label={`${member.name} entfernen`}
                      disabled={members.length === 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <button className={styles.addMemberRow} onClick={openAdd}>
            <Plus size={16} />
            <span>Mitglied hinzufügen</span>
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>App</h2>
        <div className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.appInfo}>
              <span className={styles.appIconWrap}>
                <Smartphone size={20} />
              </span>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Android-App</span>
                <span className={styles.settingHint}>APK herunterladen und installieren</span>
              </div>
            </div>
            <a className={styles.downloadBtn} href="/downloads/familio.apk" download>
              <Download size={16} />
              <span>Herunterladen</span>
            </a>
          </div>
        </div>
      </section>

      {modalOpen && (
        <FamilyMemberFormModal
          editMember={editingMember}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
