package com.kovacevic.familio.ui.shopping

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Checkbox
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.ShoppingStore
import com.kovacevic.familio.data.model.ShoppingUnit
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.components.CollapsibleSection
import com.kovacevic.familio.ui.theme.FamilioTheme
import kotlinx.coroutines.launch

@Composable
fun ShoppingScreen(modifier: Modifier = Modifier) {
    val container = LocalContext.current.familioContainer()
    val viewModel: ShoppingViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ShoppingViewModel(container.shoppingRepository) }
        },
    )
    val uiState by viewModel.uiState.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadItems() }
    val scope = rememberCoroutineScope()

    var editingItem by remember { mutableStateOf<ShoppingItem?>(null) }
    var showDialog by remember { mutableStateOf(false) }
    var formSaving by remember { mutableStateOf(false) }
    var formError by remember { mutableStateOf<String?>(null) }

    Scaffold(
        modifier = modifier,
        bottomBar = { QuickAddBar(onAdd = { input -> scope.launch { viewModel.addItem(input) } }) },
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when {
                uiState.loading -> Text("Lädt…", modifier = Modifier.padding(16.dp))
                uiState.error != null -> Text(
                    uiState.error ?: "",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error,
                )
                uiState.items.isEmpty() -> EmptyShoppingHint()
                else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(uiState.openItems, key = { it.id }) { item ->
                        ShoppingRow(
                            item = item,
                            onToggle = { viewModel.toggleItem(item.id, !item.checked) },
                            onEdit = { editingItem = item; formError = null; showDialog = true },
                            onDelete = { viewModel.deleteItem(item.id) },
                        )
                        HorizontalDivider()
                    }
                    if (uiState.checkedItems.isNotEmpty()) {
                        item {
                            CollapsibleSection(title = "Erledigt", count = uiState.checkedItems.size) {
                                Column {
                                    uiState.checkedItems.forEach { checkedItem ->
                                        ShoppingRow(
                                            item = checkedItem,
                                            onToggle = { viewModel.toggleItem(checkedItem.id, !checkedItem.checked) },
                                            onEdit = { editingItem = checkedItem; formError = null; showDialog = true },
                                            onDelete = { viewModel.deleteItem(checkedItem.id) },
                                        )
                                        HorizontalDivider()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        ShoppingFormDialog(
            editItem = editingItem,
            apiError = formError,
            saving = formSaving,
            onDismiss = { showDialog = false },
            onSave = { input ->
                scope.launch {
                    formSaving = true
                    val error = if (editingItem != null) {
                        viewModel.editItem(editingItem!!.id, input)
                    } else {
                        viewModel.addItem(input)
                    }
                    formSaving = false
                    if (error == null) {
                        showDialog = false
                        formError = null
                    } else {
                        formError = error
                    }
                }
            },
        )
    }
}

@Composable
private fun EmptyShoppingHint() {
    Column(modifier = Modifier.fillMaxWidth().padding(32.dp)) {
        Text("Keine Artikel", style = MaterialTheme.typography.titleMedium)
        Text(
            "Tippe unten einen Artikel ein und drücke Enter.",
            style = MaterialTheme.typography.bodyMedium,
            color = FamilioTheme.extendedColors.textMuted,
        )
    }
}

@Composable
private fun ShoppingRow(
    item: ShoppingItem,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Checkbox(checked = item.checked, onCheckedChange = { onToggle() })
        Column(modifier = Modifier.weight(1f)) {
            Text(
                item.name,
                style = MaterialTheme.typography.bodyLarge,
                textDecoration = if (item.checked) TextDecoration.LineThrough else TextDecoration.None,
                color = if (item.checked) FamilioTheme.extendedColors.textMuted else MaterialTheme.colorScheme.onSurface,
            )
            val meta = buildList {
                add("${item.quantity} ${ShoppingUnit.label(item.unit)}")
                if (item.store != ShoppingStore.EGAL) add(ShoppingStore.label(item.store))
            }
            Text(meta.joinToString(" · "), style = MaterialTheme.typography.labelSmall, color = FamilioTheme.extendedColors.textMuted)
        }
        IconButton(onClick = onEdit) { Icon(Icons.Filled.Edit, contentDescription = "Bearbeiten") }
        IconButton(onClick = onDelete) { Icon(Icons.Filled.Delete, contentDescription = "Löschen") }
    }
}
