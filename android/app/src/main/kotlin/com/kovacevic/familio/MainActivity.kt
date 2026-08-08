package com.kovacevic.familio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.kovacevic.familio.data.local.ThemeMode
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.MainScreen
import com.kovacevic.familio.ui.theme.FamilioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FamilioApp()
        }
    }
}

@Composable
private fun FamilioApp() {
    val container = LocalContext.current.familioContainer()
    val themeMode by container.settingsDataStore.themeMode.collectAsState(initial = ThemeMode.SYSTEM)

    FamilioTheme(themeMode = themeMode) {
        Surface(modifier = Modifier.fillMaxSize()) {
            MainScreen()
        }
    }
}
