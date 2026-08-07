export type ShoppingUnit  = 'stk' | 'g'
export type ShoppingStore = 'migros' | 'lidl' | 'coop' | 'aldi' | 'andere' | 'egal'

export interface ShoppingItem {
  id:         string
  name:       string
  quantity:   number
  unit:       ShoppingUnit
  store:      ShoppingStore
  checked:    boolean
  createdAt:  string
  checkedAt?: string
}

export interface CreateShoppingInput {
  name:     string
  quantity: number
  unit:     ShoppingUnit
  store:    ShoppingStore
}
