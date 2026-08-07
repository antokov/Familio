import { useState, useRef, useEffect } from 'react'
import { CornerDownLeft } from 'lucide-react'
import type { CreateShoppingInput, ShoppingStore, ShoppingUnit } from '../../types/shopping'
import styles from './QuickAddBar.module.css'

const UNIT_LABELS: Record<ShoppingUnit, string> = {
  stk: 'Stk.',
  g:   'g',
}

const STORE_LABELS: Record<ShoppingStore, string> = {
  egal:   'Egal',
  migros: 'Migros',
  lidl:   'Lidl',
  coop:   'Coop',
  aldi:   'Aldi',
  andere: 'Andere',
}

interface QuickAddBarProps {
  onAdd: (input: CreateShoppingInput) => Promise<void>
}

export function QuickAddBar({ onAdd }: QuickAddBarProps) {
  const [name,       setName]       = useState('')
  const [unit,       setUnit]       = useState<ShoppingUnit>('stk')
  const [quantity,   setQuantity]   = useState('')
  const [store,      setStore]      = useState<ShoppingStore>('egal')
  const [submitting, setSubmitting] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    const qty = parseFloat(quantity)
    await onAdd({
      name:     trimmed,
      unit,
      quantity: isFinite(qty) && qty > 0 ? qty : 1,
      store,
    })
    setName('')
    setQuantity('')
    setStore('egal')
    setSubmitting(false)
    nameRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className={styles.bar}>
      <input
        ref={nameRef}
        type="text"
        className={styles.nameInput}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Was wird gebraucht?"
        maxLength={100}
        tabIndex={1}
        aria-label="Produktname"
      />

      <select
        className={styles.select}
        value={unit}
        onChange={e => setUnit(e.target.value as ShoppingUnit)}
        onKeyDown={handleKeyDown}
        tabIndex={2}
        aria-label="Einheit"
      >
        {(Object.keys(UNIT_LABELS) as ShoppingUnit[]).map(key => (
          <option key={key} value={key}>{UNIT_LABELS[key]}</option>
        ))}
      </select>

      <input
        type="number"
        className={styles.quantityInput}
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="1"
        min="0.01"
        step="any"
        tabIndex={3}
        aria-label="Menge"
      />

      <select
        className={styles.select}
        value={store}
        onChange={e => setStore(e.target.value as ShoppingStore)}
        onKeyDown={handleKeyDown}
        tabIndex={4}
        aria-label="Laden"
      >
        {(Object.keys(STORE_LABELS) as ShoppingStore[]).map(key => (
          <option key={key} value={key}>{STORE_LABELS[key]}</option>
        ))}
      </select>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={() => void handleSubmit()}
        onKeyDown={handleKeyDown}
        disabled={!name.trim() || submitting}
        tabIndex={5}
        aria-label="Artikel hinzufügen"
      >
        <CornerDownLeft size={16} />
      </button>
    </div>
  )
}
