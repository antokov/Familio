import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDocuments } from '../hooks/useDocuments'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { useEvents } from '../hooks/useEvents'
import { DocumentItem } from '../components/DocumentItem/DocumentItem'
import { DocumentGroupHeader } from '../components/DocumentGroupHeader/DocumentGroupHeader'
import { DocumentUploadModal } from '../components/DocumentUploadModal/DocumentUploadModal'
import { DocumentPreviewModal } from '../components/DocumentPreviewModal/DocumentPreviewModal'
import { ExtractEventsModal } from '../components/ExtractEventsModal/ExtractEventsModal'
import type { Document, ExtractedEventCandidate } from '../types/document'
import type { FamilyMember } from '../types/family'
import styles from './DocumentsPage.module.css'

interface ExtractionState {
  docId: string
  filename: string
  candidates: ExtractedEventCandidate[]
}

export interface DocumentGroup {
  member: FamilyMember | null
  docs: Document[]
}

export function groupDocuments(documents: Document[], familyMembers: FamilyMember[]): DocumentGroup[] {
  const knownMemberIds = new Set(familyMembers.map(m => m.id))

  const byMemberId = new Map<string | null, Document[]>()
  for (const doc of documents) {
    // A familyMemberId with no matching family member (e.g. a stale reference) is
    // treated as unassigned rather than silently dropped from every group.
    const key = doc.familyMemberId !== null && knownMemberIds.has(doc.familyMemberId) ? doc.familyMemberId : null
    const existing = byMemberId.get(key)
    if (existing) {
      existing.push(doc)
    } else {
      byMemberId.set(key, [doc])
    }
  }

  const groups: DocumentGroup[] = []
  const unassigned = byMemberId.get(null)
  if (unassigned) groups.push({ member: null, docs: unassigned })
  for (const member of familyMembers) {
    const docs = byMemberId.get(member.id)
    if (docs) groups.push({ member, docs })
  }
  return groups
}

export default function DocumentsPage() {
  const { documents, loading, error, uploadDocument, reassignDocument, deleteDocument, downloadUrl, viewUrl, extractEvents } = useDocuments()
  const { members: familyMembers } = useFamilyMembers()
  const { createEvent } = useEvents()
  const [modalOpen, setModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | undefined>()
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<ExtractionState | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleExtract(doc: Document) {
    setExtractingId(doc.id)
    setExtractionError(null)
    setSuccessMessage(null)
    const result = await extractEvents(doc.id)
    setExtractingId(null)
    if ('error' in result) {
      setExtractionError(result.error)
      return
    }
    setExtraction({ docId: doc.id, filename: doc.filename, candidates: result.events })
  }

  function handleExtractionDone(createdCount: number) {
    setSuccessMessage(
      createdCount === 1 ? '1 Termin wurde angelegt.' : `${createdCount} Termine wurden angelegt.`
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Dokumente</h2>
        <button className={styles.newBtn} onClick={() => setModalOpen(true)} disabled={loading}>
          <Plus size={16} />
          Hochladen
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {extractionError && <div className={styles.errorBanner}>{extractionError}</div>}
      {successMessage && <div className={styles.successBanner}>{successMessage}</div>}

      {loading && <p className={styles.loadingText}>Lädt…</p>}

      {!loading && documents.length === 0 && !error && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Keine Dokumente</p>
          <p className={styles.emptyHint}>Lad dein erstes Dokument mit dem Button oben hoch.</p>
        </div>
      )}

      {documents.length > 0 && (
        <div className={styles.groups}>
          {groupDocuments(documents, familyMembers).map(group => (
            <div key={group.member?.id ?? 'general'} className={styles.group}>
              <DocumentGroupHeader member={group.member} />
              <ul className={styles.list}>
                {group.docs.map(doc => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    familyMembers={familyMembers}
                    downloadUrl={downloadUrl(doc.id)}
                    extracting={extractingId === doc.id}
                    onPreview={setPreviewDoc}
                    onReassign={(id, familyMemberId) => void reassignDocument(id, familyMemberId)}
                    onDelete={id => void deleteDocument(id)}
                    onExtractEvents={d => void handleExtract(d)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <DocumentUploadModal
          familyMembers={familyMembers}
          onSave={uploadDocument}
          onClose={() => setModalOpen(false)}
        />
      )}

      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          viewUrl={viewUrl(previewDoc.id)}
          downloadUrl={downloadUrl(previewDoc.id)}
          onClose={() => setPreviewDoc(undefined)}
        />
      )}

      {extraction && (
        <ExtractEventsModal
          filename={extraction.filename}
          candidates={extraction.candidates}
          familyMembers={familyMembers}
          createEvent={createEvent}
          onDone={handleExtractionDone}
          onClose={() => setExtraction(null)}
        />
      )}
    </div>
  )
}
