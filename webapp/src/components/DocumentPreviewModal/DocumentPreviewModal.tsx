import { useEffect } from 'react'
import { X, FileText, Download } from 'lucide-react'
import type { Document as FamilioDocument } from '../../types/document'
import styles from './DocumentPreviewModal.module.css'

interface DocumentPreviewModalProps {
  doc: FamilioDocument
  viewUrl: string
  downloadUrl: string
  onClose: () => void
}

function isPreviewableImage(contentType: string): boolean {
  return contentType.startsWith('image/') && contentType !== 'image/heic' && contentType !== 'image/heif'
}

export function DocumentPreviewModal({ doc, viewUrl, downloadUrl, onClose }: DocumentPreviewModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isPdf = doc.contentType === 'application/pdf'
  const isImage = isPreviewableImage(doc.contentType)

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Vorschau: ${doc.filename}`}>
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>{doc.filename}</h2>
          <div className={styles.headerActions}>
            <a
              className={styles.actionBtn}
              href={downloadUrl}
              aria-label={`${doc.filename} herunterladen`}
            >
              <Download size={16} />
            </a>
            <button className={styles.actionBtn} onClick={onClose} aria-label="Schließen">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {isPdf && <iframe className={styles.pdfFrame} src={viewUrl} title={doc.filename} />}
          {isImage && <img className={styles.image} src={viewUrl} alt={doc.filename} />}
          {!isPdf && !isImage && (
            <div className={styles.fallback}>
              <FileText size={48} className={styles.fallbackIcon} />
              <p className={styles.fallbackText}>Vorschau für diesen Dateityp nicht verfügbar</p>
              <a className={styles.fallbackDownloadBtn} href={downloadUrl}>
                <Download size={16} />
                Herunterladen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
