package com.kovacevic.familio.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kovacevic.familio.data.local.SettingsDataStore
import com.kovacevic.familio.data.local.ThemeMode
import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.model.FamilyMemberWriteRequest
import com.kovacevic.familio.data.repository.FamilyMemberRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

sealed interface ConnectionTestState {
    data object Idle : ConnectionTestState
    data object Testing : ConnectionTestState
    data object Success : ConnectionTestState
    data class Failure(val message: String) : ConnectionTestState
}

data class SettingsUiState(
    val members: List<FamilyMember> = emptyList(),
    val membersLoading: Boolean = true,
    val membersError: String? = null,
    val connectionTestState: ConnectionTestState = ConnectionTestState.Idle,
)

class SettingsViewModel(
    private val familyMemberRepository: FamilyMemberRepository,
    private val settingsDataStore: SettingsDataStore,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    val themeMode: StateFlow<String> = settingsDataStore.themeMode
        .stateIn(viewModelScope, SharingStarted.Eagerly, ThemeMode.SYSTEM)

    val serverUrl: StateFlow<String> = settingsDataStore.serverUrl
        .stateIn(viewModelScope, SharingStarted.Eagerly, SettingsDataStore.DEFAULT_SERVER_URL)

    private val testClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    init {
        loadMembers()
    }

    fun loadMembers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(membersLoading = true, membersError = null)
            familyMemberRepository.getFamilyMembers().fold(
                onSuccess = { members ->
                    _uiState.value = _uiState.value.copy(members = members, membersLoading = false)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(membersError = e.message, membersLoading = false)
                },
            )
        }
    }

    suspend fun addMember(input: FamilyMemberWriteRequest): String? {
        val result = familyMemberRepository.createFamilyMember(input)
        result.onSuccess { loadMembers() }
        return result.exceptionOrNull()?.message
    }

    suspend fun editMember(id: String, input: FamilyMemberWriteRequest): String? {
        val result = familyMemberRepository.updateFamilyMember(id, input)
        result.onSuccess { loadMembers() }
        return result.exceptionOrNull()?.message
    }

    fun deleteMember(id: String) {
        viewModelScope.launch {
            familyMemberRepository.deleteFamilyMember(id).onSuccess { loadMembers() }
        }
    }

    fun setThemeMode(mode: String) {
        viewModelScope.launch { settingsDataStore.setThemeMode(mode) }
    }

    fun saveServerUrl(url: String) {
        viewModelScope.launch { settingsDataStore.setServerUrl(url.trim().trimEnd('/')) }
    }

    fun testConnection(url: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(connectionTestState = ConnectionTestState.Testing)
            val normalized = url.trim().trimEnd('/')
            val state = withContext(Dispatchers.IO) {
                try {
                    val request = Request.Builder().url("$normalized/health").build()
                    testClient.newCall(request).execute().use { response ->
                        if (response.isSuccessful) {
                            ConnectionTestState.Success
                        } else {
                            ConnectionTestState.Failure("Server antwortet mit Fehler ${response.code}")
                        }
                    }
                } catch (e: IOException) {
                    ConnectionTestState.Failure("Server nicht erreichbar")
                } catch (e: IllegalArgumentException) {
                    ConnectionTestState.Failure("Ungültige URL")
                }
            }
            _uiState.value = _uiState.value.copy(connectionTestState = state)
        }
    }
}
