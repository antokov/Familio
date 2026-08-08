package com.kovacevic.familio.ui.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.model.RecurrenceType
import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.data.model.TaskWriteRequest
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskFormDialog(
    editTask: Task?,
    familyMembers: List<FamilyMember>,
    apiError: String?,
    saving: Boolean,
    onSave: (TaskWriteRequest) -> Unit,
    onDismiss: () -> Unit,
) {
    var title by remember { mutableStateOf(editTask?.title ?: "") }
    var dueDate by remember { mutableStateOf(editTask?.dueDate) }
    var assignee by remember {
        mutableStateOf(familyMembers.find { it.initials == editTask?.assigneeInitials && it.color == editTask.assigneeColor })
    }
    var recurrence by remember { mutableStateOf(editTask?.recurrence ?: RecurrenceType.NONE) }
    var showDatePicker by remember { mutableStateOf(false) }
    var assigneeMenuExpanded by remember { mutableStateOf(false) }
    var recurrenceMenuExpanded by remember { mutableStateOf(false) }

    val isValid = title.isNotBlank()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (editTask != null) "Aufgabe bearbeiten" else "Neue Aufgabe") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it.take(100) },
                    label = { Text("Titel") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                OutlinedTextField(
                    value = dueDate?.let { LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) } ?: "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Fällig am") },
                    placeholder = { Text("Kein Datum") },
                    trailingIcon = {
                        Row {
                            if (dueDate != null) {
                                IconButton(onClick = { dueDate = null }) {
                                    Icon(Icons.Filled.Clear, contentDescription = "Datum entfernen")
                                }
                            }
                            IconButton(onClick = { showDatePicker = true }) {
                                Icon(Icons.Filled.CalendarToday, contentDescription = "Datum wählen")
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                )

                ExposedDropdownMenuBox(expanded = assigneeMenuExpanded, onExpandedChange = { assigneeMenuExpanded = it }) {
                    OutlinedTextField(
                        value = assignee?.name ?: "Niemand",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Zugewiesen an") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = assigneeMenuExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                    )
                    DropdownMenu(expanded = assigneeMenuExpanded, onDismissRequest = { assigneeMenuExpanded = false }) {
                        DropdownMenuItem(text = { Text("Niemand") }, onClick = { assignee = null; assigneeMenuExpanded = false })
                        familyMembers.forEach { member ->
                            DropdownMenuItem(text = { Text(member.name) }, onClick = { assignee = member; assigneeMenuExpanded = false })
                        }
                    }
                }

                ExposedDropdownMenuBox(expanded = recurrenceMenuExpanded, onExpandedChange = { recurrenceMenuExpanded = it }) {
                    OutlinedTextField(
                        value = RecurrenceType.label(recurrence),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Wiederholung") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = recurrenceMenuExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                    )
                    DropdownMenu(expanded = recurrenceMenuExpanded, onDismissRequest = { recurrenceMenuExpanded = false }) {
                        RecurrenceType.ALL.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(RecurrenceType.label(option)) },
                                onClick = { recurrence = option; recurrenceMenuExpanded = false },
                            )
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
                        TaskWriteRequest(
                            title = title.trim(),
                            dueDate = dueDate,
                            assigneeInitials = assignee?.initials,
                            assigneeColor = assignee?.color,
                            recurrence = recurrence,
                        ),
                    )
                },
            ) { Text(if (saving) "Speichern…" else if (editTask != null) "Speichern" else "Hinzufügen") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Abbrechen") }
        },
    )

    if (showDatePicker) {
        val initialMillis = dueDate?.let { LocalDate.parse(it).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() }
        val state = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let { millis ->
                        dueDate = Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate().toString()
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Abbrechen") }
            },
        ) {
            DatePicker(state = state)
        }
    }
}
