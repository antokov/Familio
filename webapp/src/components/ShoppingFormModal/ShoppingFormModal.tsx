import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { ShoppingItem, CreateShoppingInput, ShoppingUnit, ShoppingStore } from '../../types/shopping'
import styles from './ShoppingFormModal.module.css'

const UNIT_LABELS: Record<ShoppingUnit, string> = {
  stk: 'Stk.',
  g:   'g',
}

const STORE_LABELS: Record<ShoppingStore, string> = {
  egal:   'Egal (Standard)',
  migros: 'Migros',
  lidl:   'Lidl',
  coop:   'Coop',
  aldi:   'Aldi',
  andere: 'Andere',
}

interface ShoppingFormModalProps {
  editItem?: ShoppingItem
  onSave:    (input: CreateShoppingInput) => void
  onClose:   () => void
}

export function ShoppingFormModal({ editItem, onSave, onClose }: ShoppingFormModalProps) {
  const [name,     setName]     = useState(editItem?.name             ?? '')
  const [quantity, setQuantity] = useState(String(editItem?.quantity  ?? 1))
  const [unit,     setUnit]     = useState<ShoppingUnit> (editItem?.unit  ?? 'stk')
  const [store,    setStore]    = useState<ShoppingStore>(editItem?.store ?? 'egal')

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const qty = parseFloat(quantity)
    if (!isFinite(qty) || qty <= 0) return
    onSave({ name: trimmed, quantity: qty, unit, store })
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isValid = name.trim().length > 0 && parseFloat(quantity) > 0

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={editItem ? 'Artikel bearbeiten' : 'Neuer Artikel'}
      >
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>{editItem ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="shopping-name" className={styles.label}>Produktname *</label>
            <input
              id="shopping-name"
              ref={nameRef}
              type="text"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Was wird gebraucht?"
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Menge</span>
            <div className={styles.quantityRow}>
              <input
                id="shopping-quantity"
                type="number"
                className={`${styles.input} ${styles.quantityInput}`}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="0.01"
                step="any"
                required
              />
              <select
                id="shopping-unit"
                className={`${styles.select} ${styles.unitSelect}`}
                value={unit}
                onChange={e => setUnit(e.target.value as ShoppingUnit)}
              >
                {(Object.keys(UNIT_LABELS) as ShoppingUnit[]).map(key => (
                  <option key={key} value={key}>{UNIT_LABELS[key]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="shopping-store" className={styles.label}>Laden</label>
            <select
              id="shopping-store"
              className={styles.select}
              value={store}
              onChange={e => setStore(e.target.value as ShoppingStore)}
            >
              {(Object.keys(STORE_LABELS) as ShoppingStore[]).map(key => (
                <option key={key} value={key}>{STORE_LABELS[key]}</option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className={styles.saveBtn} disabled={!isValid}>
              {editItem ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
