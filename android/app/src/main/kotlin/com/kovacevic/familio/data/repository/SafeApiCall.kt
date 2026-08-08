package com.kovacevic.familio.data.repository

import com.kovacevic.familio.data.model.ApiErrorResponse
import com.kovacevic.familio.data.remote.familioJson
import java.io.IOException
import kotlinx.serialization.SerializationException
import retrofit2.HttpException

suspend fun <T> safeApiCall(block: suspend () -> T): Result<T> =
    try {
        Result.success(block())
    } catch (e: HttpException) {
        Result.failure(ApiException(e.extractDetail(), e))
    } catch (e: IOException) {
        Result.failure(ApiException("Server nicht erreichbar. Prüfe die Verbindung.", e))
    }

class ApiException(message: String, cause: Throwable? = null) : Exception(message, cause)

private fun HttpException.extractDetail(): String {
    val body = response()?.errorBody()?.string()
    val detail = body?.let {
        try {
            familioJson.decodeFromString(ApiErrorResponse.serializer(), it).detail
        } catch (_: SerializationException) {
            null
        }
    }
    return detail ?: when (code()) {
        404 -> "Nicht gefunden"
        409 -> "Konflikt"
        422 -> "Ungültige Eingabe"
        else -> "Ein Fehler ist aufgetreten (${code()})"
    }
}
