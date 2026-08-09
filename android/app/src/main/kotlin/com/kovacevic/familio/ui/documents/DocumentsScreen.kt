package com.kovacevic.familio.ui.documents

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.core.content.FileProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import coil3.compose.AsyncImage
import com.kovacevic.familio.data.model.Document
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.components.AvatarBadge
import com.kovacevic.familio.ui.components.AvatarSize
import com.kovacevic.familio.ui.theme.FamilioTheme
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DocumentsScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val container = context.familioContainer()
    val viewModel: DocumentsViewModel = viewModel(
        factory = viewModelFactory {
            initializer { DocumentsViewModel(context.applicationContext, container.documentRepository, container.familyMemberRepository) }
        },
    )
    val uiState by viewModel.uiState.collectAsState()
    val scope = rememberCoroutineScope()

    var pickedUri by remember { mutableStateOf<Uri?>(null) }
    var pickedName by remember { mutableStateOf<String?>(null) }
    var showUploadDialog by remember { mutableStateOf(false) }
    var uploading by remember { mutableStateOf(false) }
    var uploadError by remember { mutableStateOf<String?>(null) }
    var confirmDeleteId by remember { mutableStateOf<String?>(null) }
    var previewDoc by remember { mutableStateOf<Document?>(null) }

    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            pickedUri = uri
            pickedName = context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (cursor.moveToFirst() && idx >= 0) cursor.getString(idx) else null
            } ?: uri.lastPathSegment
        }
    }

    Scaffold(
        modifier = modifier,
        floatingActionButton = {
            FloatingActionButton(onClick = {
                pickedUri = null
                pickedName = null
                uploadError = null
                showUploadDialog = true
            }) {
                Icon(Icons.Filled.Add, contentDescription = "Dokument hochladen")
            }
        },
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when {
                uiState.loading -> Text("Lädt…", modifier = Modifier.padding(16.dp))
                uiState.error != null -> Text(
                    uiState.error ?: "",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error,
                )
                uiState.documents.isEmpty() -> EmptyDocumentsHint()
                else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(uiState.documents, key = { it.id }) { doc ->
                        DocumentRow(
                            doc = doc,
                            familyMembers = uiState.familyMembers,
                            confirmingDelete = confirmDeleteId == doc.id,
                            onOpenPreview = { previewDoc = doc },
                            onReassign = { memberId -> viewModel.reassignDocument(doc.id, memberId) },
                            onDownload = { viewModel.downloadDocument(doc) },
                            onRequestDelete = { confirmDeleteId = doc.id },
                            onConfirmDelete = { viewModel.deleteDocument(doc.id); confirmDeleteId = null },
                            onCancelDelete = { confirmDeleteId = null },
                        )
                        HorizontalDivider()
                    }
                }
            }
        }
    }

    if (showUploadDialog) {
        DocumentUploadDialog(
            pickedFileName = pickedName,
            onPickFile = { filePicker.launch("*/*") },
            familyMembers = uiState.familyMembers,
            apiError = uploadError,
            uploading = uploading,
            onDismiss = { showUploadDialog = false },
            onUpload = { familyMemberId ->
                val uri = pickedUri ?: return@DocumentUploadDialog
                scope.launch {
                    uploading = true
                    val error = viewModel.uploadFromUri(uri, familyMemberId)
                    uploading = false
                    if (error == null) {
                        showUploadDialog = false
                    } else {
                        uploadError = error
                    }
                }
            },
        )
    }

    previewDoc?.let { doc ->
        DocumentPreview(
            document = doc,
            container = container,
            onLoadFile = { viewModel.downloadForPreview(doc) },
            onClose = { previewDoc = null },
            onOpenExternally = {
                scope.launch {
                    val file = viewModel.downloadForPreview(doc) ?: return@launch
                    val uri = FileProvider.getUriForFile(context, "com.kovacevic.familio.fileprovider", file)
                    val intent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(uri, doc.contentType)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    context.startActivity(Intent.createChooser(intent, "Öffnen mit"))
                    previewDoc = null
                }
            },
        )
    }
}

@Composable
private fun EmptyDocumentsHint() {
    Column(modifier = Modifier.fillMaxWidth().padding(32.dp)) {
        Text("Keine Dokumente", style = MaterialTheme.typography.titleMedium)
        Text(
            "Lad dein erstes Dokument mit dem Button unten rechts hoch.",
            style = MaterialTheme.typography.bodyMedium,
            color = FamilioTheme.extendedColors.textMuted,
        )
    }
}

private fun iconForContentType(contentType: String): ImageVector = when {
    contentType.startsWith("image/") -> Icons.Filled.Image
    contentType == "application/pdf" -> Icons.Filled.PictureAsPdf
    else -> Icons.Filled.Description
}

private fun formatFileSize(bytes: Long): String = when {
    bytes >= 1024 * 1024 -> "%.1f MB".format(bytes / (1024f * 1024f))
    bytes >= 1024 -> "%.0f KB".format(bytes / 1024f)
    else -> "$bytes B"
}

@Composable
private fun DocumentRow(
    doc: Document,
    familyMembers: List<com.kovacevic.familio.data.model.FamilyMember>,
    confirmingDelete: Boolean,
    onOpenPreview: () -> Unit,
    onReassign: (String?) -> Unit,
    onDownload: () -> Unit,
    onRequestDelete: () -> Unit,
    onConfirmDelete: () -> Unit,
    onCancelDelete: () -> Unit,
) {
    var reassignMenuOpen by remember { mutableStateOf(false) }
    val assignedMember = familyMembers.find { it.id == doc.familyMemberId }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(
            iconForContentType(doc.contentType),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(28.dp),
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .clickable { onOpenPreview() },
        ) {
            Text(doc.filename, style = MaterialTheme.typography.bodyLarge, maxLines = 1)
            Text(formatFileSize(doc.sizeBytes), style = MaterialTheme.typography.labelSmall, color = FamilioTheme.extendedColors.textMuted)
        }

        Box {
            if (assignedMember != null) {
                Box(modifier = Modifier.clickable { reassignMenuOpen = true }) {
                    AvatarBadge(initials = assignedMember.initials, color = assignedMember.color, size = AvatarSize.SM)
                }
            } else {
                TextButton(onClick = { reassignMenuOpen = true }) { Text("Zuweisen", style = MaterialTheme.typography.labelSmall) }
            }
            androidx.compose.material3.DropdownMenu(expanded = reassignMenuOpen, onDismissRequest = { reassignMenuOpen = false }) {
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text("Nicht zugewiesen") },
                    onClick = { onReassign(null); reassignMenuOpen = false },
                )
                familyMembers.forEach { member ->
                    androidx.compose.material3.DropdownMenuItem(
                        text = { Text(member.name) },
                        onClick = { onReassign(member.id); reassignMenuOpen = false },
                    )
                }
            }
        }

        if (confirmingDelete) {
            TextButton(onClick = onConfirmDelete) { Text("Ja") }
            TextButton(onClick = onCancelDelete) { Text("Nein") }
        } else {
            IconButton(onClick = onDownload) { Icon(Icons.Filled.Download, contentDescription = "Herunterladen") }
            IconButton(onClick = onRequestDelete) { Icon(Icons.Filled.Delete, contentDescription = "Löschen") }
        }
    }
}

private sealed interface PdfPreviewState {
    data object Loading : PdfPreviewState
    data class Error(val message: String) : PdfPreviewState
    data class Loaded(val pages: List<ImageBitmap>) : PdfPreviewState
}

private suspend fun renderPdfPages(file: File, targetWidthPx: Int): List<Bitmap> = withContext(Dispatchers.IO) {
    ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { pfd ->
        PdfRenderer(pfd).use { renderer ->
            (0 until renderer.pageCount).map { index ->
                renderer.openPage(index).use { page ->
                    val scale = targetWidthPx.toFloat() / page.width
                    val bitmap = Bitmap.createBitmap(targetWidthPx, (page.height * scale).toInt(), Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(android.graphics.Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    bitmap
                }
            }
        }
    }
}

@Composable
private fun DocumentPreview(
    document: Document,
    container: com.kovacevic.familio.di.AppContainer,
    onLoadFile: suspend () -> File?,
    onClose: () -> Unit,
    onOpenExternally: () -> Unit,
) {
    val density = LocalDensity.current
    val pageWidthPx = with(density) { (LocalConfiguration.current.screenWidthDp.dp - 32.dp).roundToPx() }
    var pdfState by remember(document.id) { mutableStateOf<PdfPreviewState>(PdfPreviewState.Loading) }

    LaunchedEffect(document.id) {
        if (document.contentType == "application/pdf") {
            pdfState = PdfPreviewState.Loading
            val file = onLoadFile()
            pdfState = if (file == null) {
                PdfPreviewState.Error("Datei konnte nicht geladen werden.")
            } else {
                try {
                    PdfPreviewState.Loaded(renderPdfPages(file, pageWidthPx).map { it.asImageBitmap() })
                } catch (e: Exception) {
                    PdfPreviewState.Error("Vorschau konnte nicht erstellt werden.")
                }
            }
        }
    }

    Dialog(onDismissRequest = onClose) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(document.filename, style = MaterialTheme.typography.titleMedium, maxLines = 1)
                IconButton(onClick = onClose) { Icon(Icons.Filled.Close, contentDescription = "Schließen") }
            }
            when {
                document.contentType.startsWith("image/") -> AsyncImage(
                    model = container.documentRepository.placeholderViewUrl(document.id),
                    imageLoader = container.imageLoader,
                    contentDescription = document.filename,
                    modifier = Modifier.fillMaxWidth().aspectRatio(1f),
                )
                document.contentType == "application/pdf" -> when (val state = pdfState) {
                    is PdfPreviewState.Loading -> Box(
                        modifier = Modifier.fillMaxWidth().padding(32.dp),
                        contentAlignment = Alignment.Center,
                    ) { CircularProgressIndicator() }
                    is PdfPreviewState.Error -> Column {
                        Text(state.message, modifier = Modifier.padding(vertical = 16.dp), style = MaterialTheme.typography.bodyMedium)
                        TextButton(onClick = onOpenExternally) { Text("Mit anderer App öffnen") }
                    }
                    is PdfPreviewState.Loaded -> LazyColumn(
                        modifier = Modifier.fillMaxWidth().heightIn(max = 480.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(state.pages) { page ->
                            Image(
                                bitmap = page,
                                contentDescription = document.filename,
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                    }
                }
                else -> Column {
                    Text(
                        "Für diesen Dateityp gibt es keine In-App-Vorschau.",
                        modifier = Modifier.padding(vertical = 16.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    TextButton(onClick = onOpenExternally) { Text("Mit anderer App öffnen") }
                }
            }
        }
    }
}
