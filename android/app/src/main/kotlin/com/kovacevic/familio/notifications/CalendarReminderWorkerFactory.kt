package com.kovacevic.familio.notifications

import android.content.Context
import androidx.work.ListenableWorker
import androidx.work.WorkerFactory
import androidx.work.WorkerParameters
import com.kovacevic.familio.data.repository.EventRepository

class CalendarReminderWorkerFactory(private val eventRepository: EventRepository) : WorkerFactory() {
    override fun createWorker(
        appContext: Context,
        workerClassName: String,
        workerParameters: WorkerParameters,
    ): ListenableWorker? = when (workerClassName) {
        CalendarReminderWorker::class.java.name -> CalendarReminderWorker(appContext, workerParameters, eventRepository)
        else -> null
    }
}
