package com.kovacevic.familio.data.repository

import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.data.model.EventWriteRequest
import com.kovacevic.familio.data.remote.ApiService

class EventRepository(private val api: ApiService) {
    suspend fun getEvents(from: String, to: String): Result<List<CalendarEvent>> =
        safeApiCall { api.getEvents(from, to) }

    suspend fun createEvent(input: EventWriteRequest): Result<CalendarEvent> =
        safeApiCall { api.createEvent(input) }

    suspend fun updateEvent(id: String, input: EventWriteRequest): Result<CalendarEvent> =
        safeApiCall { api.updateEvent(id, input) }

    suspend fun deleteEvent(id: String): Result<Unit> =
        safeApiCall { api.deleteEvent(id) }
}
