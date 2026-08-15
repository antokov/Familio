package com.kovacevic.familio

import android.app.Application
import androidx.work.Configuration
import androidx.work.WorkManager
import com.kovacevic.familio.di.AppContainer
import com.kovacevic.familio.notifications.CalendarReminderScheduler
import com.kovacevic.familio.notifications.CalendarReminderWorkerFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class FamilioApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this, applicationScope)

        // Manuelle Initialisierung statt der WorkManager-Default-Auto-Init (per
        // App Startup, siehe AndroidManifest.xml) - die liefe VOR diesem onCreate()
        // und würde auf `container` zugreifen, bevor es gesetzt ist.
        WorkManager.initialize(
            this,
            Configuration.Builder()
                .setWorkerFactory(CalendarReminderWorkerFactory(container.eventRepository))
                .build(),
        )
        CalendarReminderScheduler.schedule(this)
    }
}
