package com.kovacevic.familio.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kovacevic.familio.data.model.CalendarEvent
import com.kovacevic.familio.data.model.ShoppingItem
import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.data.repository.EventRepository
import com.kovacevic.familio.data.repository.ShoppingRepository
import com.kovacevic.familio.data.repository.TaskRepository
import com.kovacevic.familio.ui.isoDatePlusDays
import com.kovacevic.familio.ui.todayIso
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val tasks: List<Task> = emptyList(),
    val tasksLoading: Boolean = true,
    val tasksError: Boolean = false,
    val events: List<CalendarEvent> = emptyList(),
    val eventsLoading: Boolean = true,
    val eventsError: Boolean = false,
    val shoppingItems: List<ShoppingItem> = emptyList(),
    val shoppingLoading: Boolean = true,
    val shoppingError: Boolean = false,
)

class DashboardViewModel(
    private val taskRepository: TaskRepository,
    private val eventRepository: EventRepository,
    private val shoppingRepository: ShoppingRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState

    init {
        refresh()
    }

    fun refresh() {
        loadTasks()
        loadEvents()
        loadShopping()
    }

    private fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(tasksLoading = true, tasksError = false)
            taskRepository.getTasks(completed = false).fold(
                onSuccess = { tasks ->
                    _uiState.value = _uiState.value.copy(tasks = tasks.take(3), tasksLoading = false)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(tasksError = true, tasksLoading = false)
                },
            )
        }
    }

    private fun loadEvents() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(eventsLoading = true, eventsError = false)
            eventRepository.getEvents(todayIso(), isoDatePlusDays(90)).fold(
                onSuccess = { events ->
                    _uiState.value = _uiState.value.copy(events = events.take(3), eventsLoading = false)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(eventsError = true, eventsLoading = false)
                },
            )
        }
    }

    private fun loadShopping() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(shoppingLoading = true, shoppingError = false)
            shoppingRepository.getItems().fold(
                onSuccess = { items ->
                    _uiState.value = _uiState.value.copy(shoppingItems = items, shoppingLoading = false)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(shoppingError = true, shoppingLoading = false)
                },
            )
        }
    }
}
