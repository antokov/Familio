package com.kovacevic.familio.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.model.Task
import com.kovacevic.familio.data.model.TaskWriteRequest
import com.kovacevic.familio.data.repository.FamilyMemberRepository
import com.kovacevic.familio.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class TasksUiState(
    val tasks: List<Task> = emptyList(),
    val familyMembers: List<FamilyMember> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
) {
    val openTasks: List<Task> get() = tasks.filterNot { it.completed }
    val doneTasks: List<Task> get() = tasks.filter { it.completed }
}

class TasksViewModel(
    private val taskRepository: TaskRepository,
    private val familyMemberRepository: FamilyMemberRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState

    init {
        loadFamilyMembers()
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            taskRepository.getTasks().fold(
                onSuccess = { tasks -> _uiState.value = _uiState.value.copy(tasks = tasks, loading = false) },
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

    suspend fun addTask(input: TaskWriteRequest): String? {
        val result = taskRepository.createTask(input)
        result.onSuccess { loadTasks() }
        return result.exceptionOrNull()?.message
    }

    suspend fun editTask(id: String, input: TaskWriteRequest): String? {
        val result = taskRepository.updateTask(id, input)
        result.onSuccess { loadTasks() }
        return result.exceptionOrNull()?.message
    }

    fun toggleTask(id: String, completed: Boolean) {
        viewModelScope.launch {
            taskRepository.setCompleted(id, completed).onSuccess { loadTasks() }
        }
    }

    fun deleteTask(id: String) {
        viewModelScope.launch {
            taskRepository.deleteTask(id).onSuccess { loadTasks() }
        }
    }
}
