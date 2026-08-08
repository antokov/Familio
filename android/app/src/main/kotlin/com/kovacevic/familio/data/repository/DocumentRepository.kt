package com.kovacevic.familio.data.repository

import com.kovacevic.familio.data.model.Document
import com.kovacevic.familio.data.remote.ApiService
import com.kovacevic.familio.data.remote.PLACEHOLDER_BASE_URL
import com.kovacevic.familio.data.remote.ServerUrlHolder
import java.io.File
import java.io.FileOutputStream
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody

class DocumentRepository(
    private val api: ApiService,
    private val serverUrlHolder: ServerUrlHolder,
) {
    suspend fun getDocuments(): Result<List<Document>> =
        safeApiCall { api.getDocuments() }

    suspend fun uploadDocument(
        file: File,
        fileName: String,
        mimeType: String,
        familyMemberId: String?,
    ): Result<Document> = safeApiCall {
        val filePart = MultipartBody.Part.createFormData(
            "file",
            fileName,
            file.asRequestBody(mimeType.toMediaType()),
        )
        val memberPart = familyMemberId?.toRequestBody("text/plain".toMediaType())
        api.uploadDocument(filePart, memberPart)
    }

    suspend fun reassignDocument(id: String, familyMemberId: String?): Result<Document> = safeApiCall {
        val body = buildJsonObject {
            put("family_member_id", familyMemberId?.let { JsonPrimitive(it) } ?: JsonNull)
        }
        api.updateDocument(id, body)
    }

    suspend fun deleteDocument(id: String): Result<Unit> =
        safeApiCall { api.deleteDocument(id) }

    suspend fun downloadToFile(id: String, destination: File): Result<File> = safeApiCall {
        val body = api.downloadDocument(id)
        body.byteStream().use { input ->
            FileOutputStream(destination).use { output ->
                input.copyTo(output)
            }
        }
        destination
    }

    /** Real (non-placeholder) URL for use outside the Retrofit/OkHttp stack, e.g. DownloadManager. */
    fun realUrl(path: String): String = serverUrlHolder.current.trimEnd('/') + path

    fun placeholderViewUrl(id: String): String = PLACEHOLDER_BASE_URL.trimEnd('/') + "/api/documents/$id/view"

    fun downloadUrl(id: String): String = realUrl("/api/documents/$id/download")
}
