package com.kovacevic.familio.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Attendee(
    val initials: String,
    val color: String,
)

@Serializable
data class Task(
    val id: String,
    val title: String,
    val dueDate: String? = null,
    val assigneeInitials: String? = null,
    val assigneeColor: String? = null,
    val recurrence: String = "none",
    val completed: Boolean = false,
    val completedAt: String? = null,
    val createdAt: String = "",
)

@Serializable
data class CalendarEvent(
    val id: String,
    val title: String,
    val description: String? = null,
    val startDt: String,
    val endDt: String,
    val attendees: List<Attendee> = emptyList(),
    val allDay: Boolean = false,
    val createdAt: String = "",
)

@Serializable
data class FamilyMember(
    val id: String,
    val name: String,
    val initials: String,
    val color: String,
    val online: Boolean = false,
    val createdAt: String = "",
)

@Serializable
data class ShoppingItem(
    val id: String,
    val name: String,
    val quantity: Int,
    val unit: String,
    val store: String,
    val checked: Boolean = false,
    val checkedAt: String? = null,
    val createdAt: String = "",
)

@Serializable
data class Document(
    val id: String,
    val filename: String,
    val contentType: String,
    val sizeBytes: Long,
    val familyMemberId: String? = null,
    val uploadedAt: String = "",
)

object DocumentUpload {
    val ALLOWED_EXTENSIONS = setOf(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "txt", "jpg", "jpeg", "png", "heic", "gif", "zip",
    )
    const val MAX_UPLOAD_SIZE_MB = 20
    const val MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024L
}

@Serializable
data class HealthResponse(
    val status: String,
)

@Serializable
data class ApiErrorResponse(
    val detail: String? = null,
)

object RecurrenceType {
    const val NONE = "none"
    const val DAILY = "daily"
    const val WEEKLY = "weekly"
    const val MONTHLY = "monthly"
    const val YEARLY = "yearly"

    val ALL = listOf(NONE, DAILY, WEEKLY, MONTHLY, YEARLY)

    fun label(value: String): String = when (value) {
        DAILY -> "Täglich"
        WEEKLY -> "Wöchentlich"
        MONTHLY -> "Monatlich"
        YEARLY -> "Jährlich"
        else -> "Einmalig"
    }
}

object ShoppingUnit {
    const val STK = "stk"
    const val G = "g"

    val ALL = listOf(STK, G)

    fun label(value: String): String = when (value) {
        G -> "g"
        else -> "Stk."
    }
}

object ShoppingStore {
    const val EGAL = "egal"
    const val MIGROS = "migros"
    const val LIDL = "lidl"
    const val COOP = "coop"
    const val ALDI = "aldi"
    const val ANDERE = "andere"

    val ALL = listOf(EGAL, MIGROS, LIDL, COOP, ALDI, ANDERE)

    fun label(value: String): String = when (value) {
        MIGROS -> "Migros"
        LIDL -> "Lidl"
        COOP -> "Coop"
        ALDI -> "Aldi"
        ANDERE -> "Andere"
        else -> "Egal"
    }
}

val FAMILY_MEMBER_COLORS = listOf(
    "#5B6AF0", "#F0805B", "#4CAF82", "#F0C75B",
    "#E07A54", "#60B888", "#7A7F9A", "#D4623A",
    "#2E6B4A", "#C8962A",
)
