import { useState } from 'react'
import { useShoppingListApi } from '../hooks/useShoppingListApi'
import { ShoppingItem } from '../components/ShoppingItem/ShoppingItem'
import { ShoppingFormModal } from '../components/ShoppingFormModal/ShoppingFormModal'
import { QuickAddBar } from '../components/QuickAddBar/QuickAddBar'
import type { ShoppingItem as ShoppingItemType, CreateShoppingInput } from '../types/shopping'
import styles from './ShoppingPage.module.css'

export default function ShoppingPage() {
  const { openItems, checkedItems, loading, error, addItem, toggleItem, deleteItem, editItem } = useShoppingListApi()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingItem,  setEditingItem]  = useState<ShoppingItemType | undefined>()

  function handleEdit(item: ShoppingItemType) {
    setEditingItem(item)
    setModalOpen(true)
  }

  async function handleSave(input: CreateShoppingInput) {
    if (editingItem) {
      await editItem(editingItem.id, input)
    } else {
      await addItem(input)
    }
    setModalOpen(false)
    setEditingItem(undefined)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingItem(undefined)
  }

  const isEmpty = openItems.length === 0 && checkedItems.length === 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Einkaufsliste</h2>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading && <p className={styles.loadingText}>Lädt…</p>}

      {!loading && !error && isEmpty && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Keine Artikel</p>
          <p className={styles.emptyHint}>Tippe unten einen Artikel ein und drücke Enter.</p>
        </div>
      )}

      {openItems.length > 0 && (
        <ul className={styles.list}>
          {openItems.map(item => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onEdit={handleEdit}
            />
          ))}
        </ul>
      )}

      {checkedItems.length > 0 && (
        <details className={styles.checkedSection}>
          <summary className={styles.checkedSummary}>
            <span>Erledigt</span>
            <span className={styles.checkedCount}>{checkedItems.length}</span>
          </summary>
          <ul className={`${styles.list} ${styles.checkedList}`}>
            {checkedItems.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onDelete={deleteItem}
                onEdit={handleEdit}
              />
            ))}
          </ul>
        </details>
      )}

      <QuickAddBar onAdd={addItem} />

      {modalOpen && (
        <ShoppingFormModal
          editItem={editingItem}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
