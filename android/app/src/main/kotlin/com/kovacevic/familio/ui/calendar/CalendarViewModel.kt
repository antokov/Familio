package com.kovacevic.familio.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.data.model.EventWriteRequest
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.repository.EventRepository
import com.kovacevic.familio.data.repository.FamilyMemberRepository
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

enum class CalendarViewType { MONTH, WEEK }

data class CalendarUiState(
    val view: CalendarViewType = CalendarViewType.MONTH,
    val selectedDate: LocalDate = LocalDate.now(),
    val events: List<CalendarEvent> = emptyList(),
    val familyMembers: List<FamilyMember> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
) {
    val weekStart: LocalDate get() = selectedDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
}

class CalendarViewModel(
    private val eventRepository: EventRepository,
    private val familyMemberRepository: FamilyMemberRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalendarUiState())
    val uiState: StateFlow<CalendarUiState> = _uiState

    init {
        loadFamilyMembers()
        loadEvents()
    }

    private fun loadFamilyMembers() {
        viewModelScope.launch {
            familyMemberRepository.getFamilyMembers().onSuccess { members ->
                _uiState.value = _uiState.value.copy(familyMembers = members)
            }
        }
    }

    fun setView(view: CalendarViewType) {
        _uiState.value = _uiState.value.copy(view = view)
        loadEvents()
    }

    fun navigate(delta: Long) {
        val state = _uiState.value
        val newDate = if (state.view == CalendarViewType.MONTH) {
            state.selectedDate.plusMonths(delta)
        } else {
            state.selectedDate.plusWeeks(delta)
        }
        _uiState.value = state.copy(selectedDate = newDate)
        loadEvents()
    }

    fun loadEvents() {
        val state = _uiState.value
        val (from, to) = if (state.view == CalendarViewType.MONTH) {
            val first = state.selectedDate.withDayOfMonth(1)
            val last = state.selectedDate.withDayOfMonth(state.selectedDate.lengthOfMonth())
            first to last
        } else {
            val start = state.weekStart
            start to start.plusDays(6)
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            eventRepository.getEvents(from.toString(), to.toString()).fold(
                onSuccess = { events -> _uiState.value = _uiState.value.copy(events = events, loading = false) },
                onFailure = { e -> _uiState.value = _uiState.value.copy(error = e.message, loading = false) },
            )
        }
    }

    suspend fun createEvent(input: EventWriteRequest): String? {
        val result = eventRepository.createEvent(input)
        result.onSuccess { loadEvents() }
        return result.exceptionOrNull()?.message
    }

    suspend fun updateEvent(id: String, input: EventWriteRequest): String? {
        val result = eventRepository.updateEvent(id, input)
        result.onSuccess { loadEvents() }
        return result.exceptionOrNull()?.message
    }

    fun deleteEvent(id: String) {
        viewModelScope.launch {
            eventRepository.deleteEvent(id).onSuccess { loadEvents() }
        }
    }
}
