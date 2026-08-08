package com.kovacevic.familio.ui.tasks

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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.kovacevic.familio.data.model.RecurrenceType
import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.components.AvatarBadge
import com.kovacevic.familio.ui.components.AvatarSize
import com.kovacevic.familio.ui.components.CollapsibleSection
import com.kovacevic.familio.ui.isOverdue
import com.kovacevic.familio.ui.theme.FamilioTheme
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch

@Composable
fun TasksScreen(modifier: Modifier = Modifier) {
    val container = LocalContext.current.familioContainer()
    val viewModel: TasksViewModel = viewModel(
        factory = viewModelFactory {
            initializer { TasksViewModel(container.taskRepository, container.familyMemberRepository) }
        },
    )
    val uiState by viewModel.uiState.collectAsState()
    val scope = rememberCoroutineScope()

    var showDialog by remember { mutableStateOf(false) }
    var editingTask by remember { mutableStateOf<Task?>(null) }
    var formSaving by remember { mutableStateOf(false) }
    var formError by remember { mutableStateOf<String?>(null) }

    Scaffold(
        modifier = modifier,
        floatingActionButton = {
            FloatingActionButton(onClick = { editingTask = null; formError = null; showDialog = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Neue Aufgabe")
            }
        },
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when {
                uiState.loading -> Text(
                    "Lädt…",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                )
                uiState.error != null -> Text(
                    uiState.error ?: "",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error,
                )
                uiState.tasks.isEmpty() -> EmptyTasksHint()
                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    items(uiState.openTasks, key = { it.id }) { task ->
                        TaskRow(
                            task = task,
                            onToggle = { viewModel.toggleTask(task.id, !task.completed) },
                            onEdit = { editingTask = task; formError = null; showDialog = true },
                            onDelete = { viewModel.deleteTask(task.id) },
                        )
                        HorizontalDivider()
                    }
                    if (uiState.doneTasks.isNotEmpty()) {
                        item {
                            CollapsibleSection(title = "Erledigt", count = uiState.doneTasks.size) {
                                Column {
                                    uiState.doneTasks.forEach { task ->
                                        TaskRow(
                                            task = task,
                                            onToggle = { viewModel.toggleTask(task.id, !task.completed) },
                                            onEdit = { editingTask = task; formError = null; showDialog = true },
                                            onDelete = { viewModel.deleteTask(task.id) },
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
        TaskFormDialog(
            editTask = editingTask,
            familyMembers = uiState.familyMembers,
            apiError = formError,
            saving = formSaving,
            onDismiss = { showDialog = false },
            onSave = { input ->
                scope.launch {
                    formSaving = true
                    val error = if (editingTask != null) {
                        viewModel.editTask(editingTask!!.id, input)
                    } else {
                        viewModel.addTask(input)
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
private fun EmptyTasksHint() {
    Column(modifier = Modifier.fillMaxWidth().padding(32.dp)) {
        Text("Keine Aufgaben", style = MaterialTheme.typography.titleMedium)
        Text(
            "Erstell deine erste Aufgabe mit dem Button unten rechts.",
            style = MaterialTheme.typography.bodyMedium,
            color = FamilioTheme.extendedColors.textMuted,
        )
    }
}

@Composable
private fun TaskRow(
    task: Task,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    val overdue = !task.completed && isOverdue(task.dueDate)
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Checkbox(checked = task.completed, onCheckedChange = { onToggle() })
        if (task.assigneeInitials != null && task.assigneeColor != null) {
            AvatarBadge(initials = task.assigneeInitials, color = task.assigneeColor, size = AvatarSize.SM)
        }
        Column(modifier = Modifier.weight(1f).padding(start = 4.dp)) {
            Text(
                task.title,
                style = MaterialTheme.typography.bodyLarge,
                textDecoration = if (task.completed) TextDecoration.LineThrough else TextDecoration.None,
                color = when {
                    task.completed -> FamilioTheme.extendedColors.textMuted
                    overdue -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.onSurface
                },
            )
            val meta = buildList {
                task.dueDate?.let { add(LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))) }
                if (task.recurrence != RecurrenceType.NONE) add(RecurrenceType.label(task.recurrence))
                if (overdue) add("Überfällig")
            }
            if (meta.isNotEmpty()) {
                Text(
                    meta.joinToString(" · "),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (overdue) MaterialTheme.colorScheme.error else FamilioTheme.extendedColors.textMuted,
                )
            }
        }
        IconButton(onClick = onEdit) { Icon(Icons.Filled.Edit, contentDescription = "Bearbeiten") }
        IconButton(onClick = onDelete) { Icon(Icons.Filled.Delete, contentDescription = "Löschen") }
    }
}
