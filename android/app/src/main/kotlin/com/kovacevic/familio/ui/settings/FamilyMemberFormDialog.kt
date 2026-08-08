package com.kovacevic.familio.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.height
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.FAMILY_MEMBER_COLORS
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.model.FamilyMemberWriteRequest
import com.kovacevic.familio.ui.components.AvatarBadge
import com.kovacevic.familio.ui.components.AvatarSize
import com.kovacevic.familio.ui.components.parseHexColor

@Composable
fun FamilyMemberFormDialog(
    editMember: FamilyMember?,
    apiError: String?,
    saving: Boolean,
    onSave: (FamilyMemberWriteRequest) -> Unit,
    onDismiss: () -> Unit,
) {
    var name by remember { mutableStateOf(editMember?.name ?: "") }
    var initials by remember { mutableStateOf(editMember?.initials ?: "") }
    var color by remember { mutableStateOf(editMember?.color ?: FAMILY_MEMBER_COLORS.first()) }

    val isValid = name.isNotBlank() && initials.isNotBlank()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (editMember != null) "Mitglied bearbeiten" else "Neues Mitglied") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(50) },
                    label = { Text("Name") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.Words,
                        imeAction = ImeAction.Next,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = initials,
                    onValueChange = { initials = it.uppercase().take(2) },
                    label = { Text("Initialen (max. 2)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text("Farbe", style = MaterialTheme.typography.labelSmall)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(5),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(88.dp),
                ) {
                    items(FAMILY_MEMBER_COLORS) { swatch ->
                        val selected = swatch == color
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(parseHexColor(swatch))
                                .then(
                                    if (selected) {
                                        Modifier.border(2.dp, MaterialTheme.colorScheme.onSurface, CircleShape)
                                    } else {
                                        Modifier
                                    },
                                )
                                .clickable { color = swatch },
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AvatarBadge(initials = initials.ifBlank { "?" }, color = color, size = AvatarSize.MD)
                    Text(name.ifBlank { "Vorschau" })
                }
                if (apiError != null) {
                    Text(apiError, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(FamilyMemberWriteRequest(name.trim(), initials.trim(), color)) },
                enabled = isValid && !saving,
            ) {
                Text(if (saving) "Speichern…" else if (editMember != null) "Speichern" else "Hinzufügen")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Abbrechen") }
        },
    )
}
