package com.kovacevic.familio

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
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
    val context = LocalContext.current
    val container = context.familioContainer()
    val themeMode by container.settingsDataStore.themeMode.collectAsState(initial = ThemeMode.SYSTEM)

    // Muss proaktiv angefragt werden: der tägliche Kalender-Erinnerungs-Worker
    // läuft im Hintergrund und kann selbst keine Runtime-Permission anfragen.
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) {}
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    FamilioTheme(themeMode = themeMode) {
        // Ein imePadding() an der Wurzel statt in einzelnen verschachtelten
        // Scaffolds (z.B. QuickAddBar) - sonst reserviert die äußere
        // NavigationBar weiterhin ihren Platz unterhalb der Tastatur und es
        // entsteht eine Lücke zwischen Eingabefeld und Tastatur.
        Surface(modifier = Modifier.fillMaxSize().imePadding()) {
            MainScreen(
                pendingDeepLinkRoute = pendingDeepLinkRoute,
                onDeepLinkConsumed = onDeepLinkConsumed,
            )
        }
    }
}
