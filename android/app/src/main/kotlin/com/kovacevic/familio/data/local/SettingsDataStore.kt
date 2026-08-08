package com.kovacevic.familio.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "familio_settings")

object ThemeMode {
    const val LIGHT = "light"
    const val DARK = "dark"
    const val SYSTEM = "system"
}

class SettingsDataStore(private val context: Context) {

    companion object {
        val SERVER_URL_KEY = stringPreferencesKey("server_url")
        val THEME_MODE_KEY = stringPreferencesKey("theme_mode")
        const val DEFAULT_SERVER_URL = "http://10.0.2.2:8000"
    }

    val serverUrl: Flow<String> =
        context.dataStore.data.map { it[SERVER_URL_KEY] ?: DEFAULT_SERVER_URL }

    val themeMode: Flow<String> =
        context.dataStore.data.map { it[THEME_MODE_KEY] ?: ThemeMode.SYSTEM }

    suspend fun setServerUrl(url: String) {
        context.dataStore.edit { it[SERVER_URL_KEY] = url }
    }

    suspend fun setThemeMode(mode: String) {
        context.dataStore.edit { it[THEME_MODE_KEY] = mode }
    }
}
