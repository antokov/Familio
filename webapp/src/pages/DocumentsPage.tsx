import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDocuments } from '../hooks/useDocuments'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { DocumentItem } from '../components/DocumentItem/DocumentItem'
import { DocumentUploadModal } from '../components/DocumentUploadModal/DocumentUploadModal'
import { DocumentPreviewModal } from '../components/DocumentPreviewModal/DocumentPreviewModal'
import type { Document } from '../types/document'
import styles from './DocumentsPage.module.css'

export default function DocumentsPage() {
  const { documents, loading, error, uploadDocument, reassignDocument, deleteDocument, downloadUrl, viewUrl } = useDocuments()
  const { members: familyMembers } = useFamilyMembers()
  const [modalOpen, setModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | undefined>()

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

      {loading && <p className={styles.loadingText}>Lädt…</p>}

      {!loading && documents.length === 0 && !error && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Keine Dokumente</p>
          <p className={styles.emptyHint}>Lad dein erstes Dokument mit dem Button oben hoch.</p>
        </div>
      )}

      {documents.length > 0 && (
        <ul className={styles.list}>
          {documents.map(doc => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              familyMembers={familyMembers}
              downloadUrl={downloadUrl(doc.id)}
              onPreview={setPreviewDoc}
              onReassign={(id, familyMemberId) => void reassignDocument(id, familyMemberId)}
              onDelete={id => void deleteDocument(id)}
            />
          ))}
        </ul>
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
    </div>
  )
}
