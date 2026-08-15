package com.kovacevic.familio.ui.shopping

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.ShoppingItemWriteRequest
import com.kovacevic.familio.data.model.ShoppingStore
import com.kovacevic.familio.data.model.ShoppingUnit

@Composable
fun QuickAddBar(onAdd: (ShoppingItemWriteRequest) -> Unit) {
    var name by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var unit by remember { mutableStateOf(ShoppingUnit.STK) }
    var store by remember { mutableStateOf(ShoppingStore.EGAL) }

    fun submit() {
        val trimmed = name.trim()
        if (trimmed.isEmpty()) return
        val qty = quantity.toIntOrNull()?.takeIf { it > 0 } ?: 1
        onAdd(ShoppingItemWriteRequest(name = trimmed, quantity = qty, unit = unit, store = store))
        name = ""
        quantity = ""
        store = ShoppingStore.EGAL
    }

    Surface(
        tonalElevation = 3.dp,
        shadowElevation = 8.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it.take(100) },
                placeholder = { Text("Was wird gebraucht?") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { submit() }),
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = quantity,
                onValueChange = { quantity = it.filter { c -> c.isDigit() }.take(4) },
                placeholder = { Text("1") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { submit() }),
                modifier = Modifier.width(64.dp),
            )
            CompactDropdown(
                selectedLabel = ShoppingUnit.label(unit),
                options = ShoppingUnit.ALL.map { it to ShoppingUnit.label(it) },
                onSelect = { unit = it },
            )
            CompactDropdown(
                selectedLabel = ShoppingStore.label(store),
                options = ShoppingStore.ALL.map { it to ShoppingStore.label(it) },
                onSelect = { store = it },
            )
            IconButton(onClick = { submit() }) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Artikel hinzufügen")
            }
        }
    }
}

@Composable
private fun CompactDropdown(
    selectedLabel: String,
    options: List<Pair<String, String>>,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Text(
            selectedLabel,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier
                .clickable { expanded = true }
                .padding(horizontal = 8.dp, vertical = 12.dp),
        )
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { (value, label) ->
                DropdownMenuItem(text = { Text(label) }, onClick = { onSelect(value); expanded = false })
            }
        }
    }
}
