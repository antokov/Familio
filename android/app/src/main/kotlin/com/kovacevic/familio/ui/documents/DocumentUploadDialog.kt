package com.kovacevic.familio.ui.documents

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.FamilyMember

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentUploadDialog(
    pickedFileName: String?,
    onPickFile: () -> Unit,
    familyMembers: List<FamilyMember>,
    apiError: String?,
    uploading: Boolean,
    onUpload: (familyMemberId: String?) -> Unit,
    onDismiss: () -> Unit,
) {
    var assignee by remember { mutableStateOf<FamilyMember?>(null) }
    var menuExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Dokument hochladen") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = onPickFile, modifier = Modifier.fillMaxWidth()) {
                    Text(pickedFileName ?: "Datei auswählen")
                }
                ExposedDropdownMenuBox(expanded = menuExpanded, onExpandedChange = { menuExpanded = it }) {
                    OutlinedTextField(
                        value = assignee?.name ?: "Nicht zugewiesen",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Zuweisen an") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = menuExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                    )
                    DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                        DropdownMenuItem(text = { Text("Nicht zugewiesen") }, onClick = { assignee = null; menuExpanded = false })
                        familyMembers.forEach { member ->
                            DropdownMenuItem(text = { Text(member.name) }, onClick = { assignee = member; menuExpanded = false })
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
                enabled = pickedFileName != null && !uploading,
                onClick = { onUpload(assignee?.id) },
            ) { Text(if (uploading) "Wird hochgeladen…" else "Hochladen") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Abbrechen") }
        },
    )
}
