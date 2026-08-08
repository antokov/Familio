package com.kovacevic.familio.ui.shopping

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.ShoppingItemWriteRequest
import com.kovacevic.familio.data.model.ShoppingStore
import com.kovacevic.familio.data.model.ShoppingUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingFormDialog(
    editItem: ShoppingItem?,
    apiError: String?,
    saving: Boolean,
    onSave: (ShoppingItemWriteRequest) -> Unit,
    onDismiss: () -> Unit,
) {
    var name by remember { mutableStateOf(editItem?.name ?: "") }
    var quantity by remember { mutableStateOf((editItem?.quantity ?: 1).toString()) }
    var unit by remember { mutableStateOf(editItem?.unit ?: ShoppingUnit.STK) }
    var store by remember { mutableStateOf(editItem?.store ?: ShoppingStore.EGAL) }
    var unitMenuExpanded by remember { mutableStateOf(false) }
    var storeMenuExpanded by remember { mutableStateOf(false) }

    val isValid = name.isNotBlank() && (quantity.toIntOrNull() ?: 0) > 0

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (editItem != null) "Artikel bearbeiten" else "Neuer Artikel") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(100) },
                    label = { Text("Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it.filter { c -> c.isDigit() }.take(4) },
                    label = { Text("Menge") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                ExposedDropdownMenuBox(expanded = unitMenuExpanded, onExpandedChange = { unitMenuExpanded = it }) {
                    OutlinedTextField(
                        value = ShoppingUnit.label(unit),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Einheit") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = unitMenuExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                    )
                    DropdownMenu(expanded = unitMenuExpanded, onDismissRequest = { unitMenuExpanded = false }) {
                        ShoppingUnit.ALL.forEach { option ->
                            DropdownMenuItem(text = { Text(ShoppingUnit.label(option)) }, onClick = { unit = option; unitMenuExpanded = false })
                        }
                    }
                }
                ExposedDropdownMenuBox(expanded = storeMenuExpanded, onExpandedChange = { storeMenuExpanded = it }) {
                    OutlinedTextField(
                        value = ShoppingStore.label(store),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Laden") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = storeMenuExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                    )
                    DropdownMenu(expanded = storeMenuExpanded, onDismissRequest = { storeMenuExpanded = false }) {
                        ShoppingStore.ALL.forEach { option ->
                            DropdownMenuItem(text = { Text(ShoppingStore.label(option)) }, onClick = { store = option; storeMenuExpanded = false })
                        }
                    }
                }
                if (apiError != null) {
                    Text(apiError, color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            TextButton(
                enabled = isValid && !saving,
                onClick = {
                    onSave(
                        ShoppingItemWriteRequest(
                            name = name.trim(),
                            quantity = quantity.toIntOrNull() ?: 1,
                            unit = unit,
                            store = store,
                        ),
                    )
                },
            ) { Text(if (saving) "Speichern…" else if (editItem != null) "Speichern" else "Hinzufügen") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Abbrechen") }
        },
    )
}
