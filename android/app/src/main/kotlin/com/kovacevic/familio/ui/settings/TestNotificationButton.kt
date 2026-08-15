package com.kovacevic.familio.ui.settings

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

// TEST-ONLY (siehe FS-36 / Benachrichtigungen-Feature): simuliert lokal eine
// Push-Notification mit demselben Deep-Link (familio://calendar), den die echte
// ntfy-Benachrichtigung beim Tap auslöst - so lässt sich der Tap-Handler testen,
// ohne dass ein ntfy-Server läuft. Entfernen: diese Datei löschen + den Aufruf
// TestNotificationButton() in SettingsScreen.kt.
private const val TEST_CHANNEL_ID = "familio_test"
private const val TEST_NOTIFICATION_ID = 1

@Composable
fun TestNotificationButton() {
    val context = LocalContext.current

    fun showTestNotification() {
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(TEST_CHANNEL_ID, "Test", NotificationManager.IMPORTANCE_HIGH),
        )
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("familio://calendar")).apply {
            setPackage(context.packageName)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, TEST_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Test-Termin morgen")
            .setContentText("Familio – Ganztägig")
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(TEST_NOTIFICATION_ID, notification)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted -> if (granted) showTestNotification() }

    OutlinedButton(onClick = {
        val needsPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        if (needsPermission) {
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            showTestNotification()
        }
    }) {
        Text("Test-Benachrichtigung senden")
    }
}
