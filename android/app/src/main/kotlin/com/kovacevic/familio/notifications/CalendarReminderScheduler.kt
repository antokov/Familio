package com.kovacevic.familio.notifications

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.time.Duration
import java.time.LocalDateTime
import java.util.concurrent.TimeUnit

private const val WORK_NAME = "calendar_reminder_daily"
private const val TARGET_HOUR = 21

// WorkManager statt AlarmManager: kein "Exact Alarms"-Sonderrecht nötig, überlebt
// Reboots automatisch, dafür kein exaktes 21:00 Uhr (Batterie-Optimierung kann den
// Lauf um ~15-30 Min. verschieben) - für eine tägliche Erinnerung akzeptabel.
object CalendarReminderScheduler {

    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<CalendarReminderWorker>(24, TimeUnit.HOURS)
            .setInitialDelay(minutesUntilNext21Uhr(), TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request,
        )
    }

    private fun minutesUntilNext21Uhr(): Long {
        val now = LocalDateTime.now()
        var target = now.withHour(TARGET_HOUR).withMinute(0).withSecond(0).withNano(0)
        if (!target.isAfter(now)) target = target.plusDays(1)
        return Duration.between(now, target).toMinutes()
    }
}
