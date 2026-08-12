package com.kovacevic.familio.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.kovacevic.familio.data.local.ThemeMode
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.components.AvatarBadge
import com.kovacevic.familio.ui.components.AvatarSize
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(modifier: Modifier = Modifier) {
    val container = LocalContext.current.familioContainer()
    val viewModel: SettingsViewModel = viewModel(
        factory = viewModelFactory {
            initializer { SettingsViewModel(container.familyMemberRepository, container.settingsDataStore) }
        },
    )
    val uiState by viewModel.uiState.collectAsState()
    val themeMode by viewModel.themeMode.collectAsState()
    val savedServerUrl by viewModel.serverUrl.collectAsState()
    val scope = rememberCoroutineScope()

    var serverUrlField by remember(savedServerUrl) { mutableStateOf(savedServerUrl) }
    var showAddDialog by remember { mutableStateOf(false) }
    var editingMember by remember { mutableStateOf<FamilyMember?>(null) }
    var confirmDeleteId by remember { mutableStateOf<String?>(null) }
    var formSaving by remember { mutableStateOf(false) }
    var formError by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        item {
            SettingsSection(title = "Darstellung") {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    val options = listOf(ThemeMode.LIGHT to "Hell", ThemeMode.DARK to "Dunkel", ThemeMode.SYSTEM to "System")
                    options.forEachIndexed { index, (mode, label) ->
                        SegmentedButton(
                            selected = themeMode == mode,
                            onClick = { viewModel.setThemeMode(mode) },
                            shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size),
                        ) { Text(label) }
                    }
                }
            }
        }

        item {
            SettingsSection(title = "Server") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = serverUrlField,
                        onValueChange = { serverUrlField = it },
                        label = { Text("Server-URL") },
                        placeholder = { Text("http://10.0.2.2:8000") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { viewModel.saveServerUrl(serverUrlField) }) {
                            Text("Speichern")
                        }
                        OutlinedButton(onClick = { viewModel.testConnection(serverUrlField) }) {
                            Text("Verbindung testen")
                        }
                    }
                    when (val state = uiState.connectionTestState) {
                        is ConnectionTestState.Testing -> Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(modifier = Modifier.width(16.dp), strokeWidth = 2.dp)
                            Spacer(Modifier.width(8.dp))
                            Text("Teste Verbindung…", style = MaterialTheme.typography.bodyMedium)
                        }
                        is ConnectionTestState.Success -> Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(8.dp))
                            Text("Verbindung erfolgreich", color = MaterialTheme.colorScheme.primary)
                        }
                        is ConnectionTestState.Failure -> Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.Error, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                            Spacer(Modifier.width(8.dp))
                            Text(state.message, color = MaterialTheme.colorScheme.error)
                        }
                        ConnectionTestState.Idle -> {}
                    }
                }
            }
        }

        item {
            SettingsSection(title = "Benachrichtigungen") {
                Text(
                    "Täglich um 21:00 Uhr eine Erinnerung an morgige Termine erhalten: " +
                        "die ntfy-App installieren (F-Droid/Play Store) und dort ein Thema " +
                        "auf dem oben eingestellten Familio-Server abonnieren.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }

        item {
            SettingsSection(
                title = "Familie",
                trailing = {
                    IconButton(onClick = { editingMember = null; formError = null; showAddDialog = true }) {
                        Icon(Icons.Filled.Add, contentDescription = "Mitglied hinzufügen")
                    }
                },
            ) {
                when {
                    uiState.membersLoading -> Text("Lädt…", style = MaterialTheme.typography.bodyMedium)
                    uiState.membersError != null -> Text(
                        uiState.membersError ?: "",
                        color = MaterialTheme.colorScheme.error,
                    )
                    uiState.members.isEmpty() -> Text("Noch keine Familienmitglieder", style = MaterialTheme.typography.bodyMedium)
                    else -> Column {
                        uiState.members.forEachIndexed { index, member ->
                            if (index > 0) HorizontalDivider()
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                AvatarBadge(initials = member.initials, color = member.color, size = AvatarSize.MD)
                                Text(member.name, modifier = Modifier.weight(1f))
                                if (confirmDeleteId == member.id) {
                                    Text("Entfernen?", style = MaterialTheme.typography.bodyMedium)
                                    TextButton(onClick = {
                                        viewModel.deleteMember(member.id)
                                        confirmDeleteId = null
                                    }) { Text("Ja") }
                                    TextButton(onClick = { confirmDeleteId = null }) { Text("Nein") }
                                } else {
                                    IconButton(onClick = {
                                        editingMember = member
                                        formError = null
                                        showAddDialog = true
                                    }) {
                                        Icon(Icons.Filled.Edit, contentDescription = "Bearbeiten")
                                    }
                                    IconButton(onClick = { confirmDeleteId = member.id }) {
                                        Icon(Icons.Filled.Delete, contentDescription = "Entfernen")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        FamilyMemberFormDialog(
            editMember = editingMember,
            apiError = formError,
            saving = formSaving,
            onDismiss = { showAddDialog = false },
            onSave = { input ->
                scope.launch {
                    formSaving = true
                    val error = if (editingMember != null) {
                        viewModel.editMember(editingMember!!.id, input)
                    } else {
                        viewModel.addMember(input)
                    }
                    formSaving = false
                    if (error == null) {
                        showAddDialog = false
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
private fun SettingsSection(
    title: String,
    trailing: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(title, style = MaterialTheme.typography.titleLarge)
            trailing?.invoke()
        }
        content()
    }
}
