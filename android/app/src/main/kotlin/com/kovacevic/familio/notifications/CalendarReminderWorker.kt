package com.kovacevic.familio.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.kovacevic.familio.data.repository.EventRepository
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

private const val CHANNEL_ID = "familio_calendar_reminders"
private const val NOTIFICATION_ID = 2
private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
private val dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy")

// Läuft täglich (siehe CalendarReminderScheduler) und ersetzt den früheren
// Backend->ntfy-Versand: fragt morgige Termine direkt vom konfigurierten
// Familio-Server ab und zeigt bei Treffern eine lokale Notification -
// kein separater ntfy-Server nötig. Gleiche Overlap-Query wie
// GET /api/events (from == to == morgen), siehe events.py.
class CalendarReminderWorker(
    context: Context,
    params: WorkerParameters,
    private val eventRepository: EventRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val tomorrow = LocalDate.now().plusDays(1)
        val dateParam = tomorrow.toString()

        val events = eventRepository.getEvents(dateParam, dateParam).getOrElse {
            return Result.retry()
        }
        if (events.isEmpty()) return Result.success()

        val lines = events.sortedBy { it.startDt }.map { event ->
            if (event.allDay) {
                "${event.title} - Ganztägig"
            } else {
                "${event.title} - ${LocalDateTime.parse(event.startDt).format(timeFormatter)}"
            }
        }
        showNotification(tomorrow.format(dateFormatter), lines)
        return Result.success()
    }

    private fun showNotification(dateLabel: String, lines: List<String>) {
        val context = applicationContext
        val hasPermission = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        if (!hasPermission) return

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Kalender-Erinnerungen", NotificationManager.IMPORTANCE_HIGH),
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

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Termine morgen ($dateLabel)")
            .setContentText(lines.first())
            .setStyle(NotificationCompat.BigTextStyle().bigText(lines.joinToString("\n")))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }
}
