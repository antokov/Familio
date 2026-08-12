package com.kovacevic.familio

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.kovacevic.familio.data.local.ThemeMode
import com.kovacevic.familio.di.familioContainer
import com.kovacevic.familio.ui.MainScreen
import com.kovacevic.familio.ui.navigation.FamilioDestination
import com.kovacevic.familio.ui.theme.FamilioTheme

class MainActivity : ComponentActivity() {

    // ASSUMPTION: the only deep link today is `familio://calendar` (tapped push
    // notification, see arch-decision.md AC3) - a plain host match is enough,
    // no need for a general-purpose deep-link router for a single destination.
    private var pendingDeepLinkRoute by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        pendingDeepLinkRoute = intent.toDeepLinkRoute()
        setContent {
            FamilioApp(
                pendingDeepLinkRoute = pendingDeepLinkRoute,
                onDeepLinkConsumed = { pendingDeepLinkRoute = null },
            )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLinkRoute = intent.toDeepLinkRoute()
    }

    private fun Intent.toDeepLinkRoute(): String? =
        if (action == Intent.ACTION_VIEW && data?.host == "calendar") {
            FamilioDestination.Calendar.route
        } else {
            null
        }
}

@Composable
private fun FamilioApp(pendingDeepLinkRoute: String?, onDeepLinkConsumed: () -> Unit) {
    val container = LocalContext.current.familioContainer()
    val themeMode by container.settingsDataStore.themeMode.collectAsState(initial = ThemeMode.SYSTEM)

    FamilioTheme(themeMode = themeMode) {
        Surface(modifier = Modifier.fillMaxSize()) {
            MainScreen(
                pendingDeepLinkRoute = pendingDeepLinkRoute,
                onDeepLinkConsumed = onDeepLinkConsumed,
            )
        }
    }
}
