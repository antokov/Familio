package com.kovacevic.familio.data.model

import kotlinx.serialization.Serializable

@Serializable
data class TaskWriteRequest(
    val title: String,
    val dueDate: String? = null,
    val assigneeInitials: String? = null,
    val assigneeColor: String? = null,
    val recurrence: String = RecurrenceType.NONE,
)

@Serializable
data class TaskCompletedRequest(
    val completed: Boolean,
)

@Serializable
data class EventWriteRequest(
    val title: String,
    val description: String? = null,
    val startDt: String,
    val endDt: String,
    val attendees: List<Attendee> = emptyList(),
)

@Serializable
data class FamilyMemberWriteRequest(
    val name: String,
    val initials: String,
    val color: String,
)

@Serializable
data class ShoppingItemWriteRequest(
    val name: String,
    val quantity: Int,
    val unit: String,
    val store: String,
)

@Serializable
data class ShoppingCheckedRequest(
    val checked: Boolean,
)
