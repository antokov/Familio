package com.kovacevic.familio.ui.shopping

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.ShoppingItemWriteRequest
import com.kovacevic.familio.data.repository.ShoppingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class ShoppingUiState(
    val items: List<ShoppingItem> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
) {
    val openItems: List<ShoppingItem> get() = items.filterNot { it.checked }
    val checkedItems: List<ShoppingItem> get() = items.filter { it.checked }
}

class ShoppingViewModel(private val repository: ShoppingRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ShoppingUiState())
    val uiState: StateFlow<ShoppingUiState> = _uiState

    init {
        loadItems()
    }

    fun loadItems() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repository.getItems().fold(
                onSuccess = { items -> _uiState.value = _uiState.value.copy(items = items, loading = false) },
                onFailure = { e -> _uiState.value = _uiState.value.copy(error = e.message, loading = false) },
            )
        }
    }

    suspend fun addItem(input: ShoppingItemWriteRequest): String? {
        val result = repository.createItem(input)
        result.onSuccess { loadItems() }
        return result.exceptionOrNull()?.message
    }

    suspend fun editItem(id: String, input: ShoppingItemWriteRequest): String? {
        val result = repository.updateItem(id, input)
        result.onSuccess { loadItems() }
        return result.exceptionOrNull()?.message
    }

    fun toggleItem(id: String, checked: Boolean) {
        viewModelScope.launch {
            repository.setChecked(id, checked).onSuccess { loadItems() }
        }
    }

    fun deleteItem(id: String) {
        viewModelScope.launch {
            repository.deleteItem(id).onSuccess { loadItems() }
        }
    }
}
