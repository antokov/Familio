import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { ShoppingItem as ShoppingItemType, ShoppingStore } from '../../types/shopping'
import styles from './ShoppingItem.module.css'

const STORE_META: Record<ShoppingStore, { label: string; color: string }> = {
  migros: { label: 'Migros', color: '#E8610A' },
  lidl:   { label: 'Lidl',   color: '#0050AA' },
  coop:   { label: 'Coop',   color: '#CC0000' },
  aldi:   { label: 'Aldi',   color: '#007DC5' },
  andere: { label: 'Andere', color: '#7A736C' },
  egal:   { label: 'Egal',   color: '' },
}

interface ShoppingItemProps {
  item: ShoppingItemType
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit:   (item: ShoppingItemType) => void
}

export function ShoppingItem({ item, onToggle, onDelete, onEdit }: ShoppingItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const store = STORE_META[item.store]
  const unitLabel = item.unit === 'stk' ? 'Stk.' : 'g'

  return (
    <li className={`${styles.item} ${item.checked ? styles.checked : ''}`}>
      <button
        className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}
        onClick={() => onToggle(item.id)}
        aria-label={item.checked ? 'Artikel als offen markieren' : 'Artikel abhaken'}
      >
        {item.checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
            <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className={styles.content}>
        <span className={styles.name}>{item.name}</span>
        <div className={styles.meta}>
          <span className={styles.quantity}>{item.quantity} {unitLabel}</span>
          {item.store !== 'egal' && (
            <span
              className={styles.storeBadge}
              style={{ backgroundColor: store.color }}
            >
              {store.label}
            </span>
          )}
        </div>
      </div>

      {confirmDelete ? (
        <div className={styles.confirmRow}>
          <span className={styles.confirmText}>Löschen?</span>
          <button className={styles.confirmBtn} onClick={() => onDelete(item.id)}>Ja</button>
          <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Nein</button>
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(item)}
            aria-label="Artikel bearbeiten"
          >
            <Pencil size={15} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => setConfirmDelete(true)}
            aria-label="Artikel löschen"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </li>
  )
}
