package com.kovacevic.familio.ui.documents

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kovacevic.familio.data.model.Document
import com.kovacevic.familio.data.model.DocumentUpload
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.repository.DocumentRepository
import com.kovacevic.familio.data.repository.FamilyMemberRepository
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class DocumentsUiState(
    val documents: List<Document> = emptyList(),
    val familyMembers: List<FamilyMember> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
)

class DocumentsViewModel(
    private val appContext: Context,
    private val documentRepository: DocumentRepository,
    private val familyMemberRepository: FamilyMemberRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DocumentsUiState())
    val uiState: StateFlow<DocumentsUiState> = _uiState

    init {
        loadFamilyMembers()
        loadDocuments()
    }

    fun loadDocuments() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            documentRepository.getDocuments().fold(
                onSuccess = { docs -> _uiState.value = _uiState.value.copy(documents = docs, loading = false) },
                onFailure = { e -> _uiState.value = _uiState.value.copy(error = e.message, loading = false) },
            )
        }
    }

    private fun loadFamilyMembers() {
        viewModelScope.launch {
            familyMemberRepository.getFamilyMembers().onSuccess { members ->
                _uiState.value = _uiState.value.copy(familyMembers = members)
            }
        }
    }

    suspend fun uploadFromUri(uri: Uri, familyMemberId: String?): String? {
        val (fileName, size) = queryNameAndSize(uri)
        val extension = fileName.substringAfterLast('.', "").lowercase()
        if (extension !in DocumentUpload.ALLOWED_EXTENSIONS) {
            return "Dateityp nicht erlaubt. Erlaubt: ${DocumentUpload.ALLOWED_EXTENSIONS.sorted().joinToString(", ")}"
        }
        if (size != null && size > DocumentUpload.MAX_UPLOAD_SIZE_BYTES) {
            return "Datei zu groß. Maximum: ${DocumentUpload.MAX_UPLOAD_SIZE_MB} MB"
        }
        val mimeType = appContext.contentResolver.getType(uri) ?: "application/octet-stream"
        val tempFile = copyToCache(uri, "upload_$fileName")
        val result = documentRepository.uploadDocument(tempFile, fileName, mimeType, familyMemberId)
        tempFile.delete()
        result.onSuccess { loadDocuments() }
        return result.exceptionOrNull()?.message
    }

    /** Uploads a PDF produced by the ML Kit document scanner (see [DocumentsScreen]) — the scanner's
     * own content URI doesn't reliably expose a queryable display name/extension, so this skips the
     * generic [uploadFromUri] sniffing and always treats the result as a fresh PDF. */
    suspend fun uploadScan(pdfUri: Uri, familyMemberId: String?): String? {
        val fileName = "Scan_${SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())}.pdf"
        val tempFile = copyToCache(pdfUri, "upload_$fileName")
        val result = documentRepository.uploadDocument(tempFile, fileName, "application/pdf", familyMemberId)
        tempFile.delete()
        result.onSuccess { loadDocuments() }
        return result.exceptionOrNull()?.message
    }

    private suspend fun copyToCache(uri: Uri, cacheFileName: String): File = withContext(Dispatchers.IO) {
        val file = File(appContext.cacheDir, cacheFileName)
        appContext.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(file).use { output -> input.copyTo(output) }
        }
        file
    }

    fun reassignDocument(id: String, familyMemberId: String?) {
        viewModelScope.launch {
            documentRepository.reassignDocument(id, familyMemberId).onSuccess { loadDocuments() }
        }
    }

    fun deleteDocument(id: String) {
        viewModelScope.launch {
            documentRepository.deleteDocument(id).onSuccess { loadDocuments() }
        }
    }

    fun downloadDocument(document: Document) {
        val request = DownloadManager.Request(documentRepository.downloadUrl(document.id).toUri())
            .setTitle(document.filename)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, document.filename)
        val manager = appContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        manager.enqueue(request)
    }

    suspend fun downloadForPreview(document: Document): File? {
        val destination = File(appContext.cacheDir, "preview_${document.id}_${document.filename}")
        return documentRepository.downloadToFile(document.id, destination).getOrNull()
    }

    private fun queryNameAndSize(uri: Uri): Pair<String, Long?> {
        var name = "Datei"
        var size: Long? = null
        appContext.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst()) {
                if (nameIndex >= 0) name = cursor.getString(nameIndex) ?: name
                if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) size = cursor.getLong(sizeIndex)
            }
        }
        return name to size
    }
}
