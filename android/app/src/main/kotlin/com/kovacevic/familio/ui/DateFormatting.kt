package com.kovacevic.familio.ui

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

val GERMAN: Locale = Locale.GERMAN
val isoDateFormatter: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE

fun todayIso(): String = LocalDate.now().format(isoDateFormatter)

fun isoDatePlusDays(days: Long): String = LocalDate.now().plusDays(days).format(isoDateFormatter)

/** Parses backend datetimes, which may or may not carry a timezone offset. */
fun parseApiDateTime(value: String): LocalDateTime =
    try {
        LocalDateTime.parse(value)
    } catch (_: Exception) {
        try {
            java.time.OffsetDateTime.parse(value).toLocalDateTime()
        } catch (_: Exception) {
            java.time.Instant.parse(value).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()
        }
    }

fun germanGreeting(hour: Int = LocalTime.now().hour): String = when {
    hour < 5 -> "Gute Nacht"
    hour < 12 -> "Guten Morgen"
    hour < 18 -> "Guten Tag"
    else -> "Guten Abend"
}

fun germanFullDate(date: LocalDate = LocalDate.now()): String {
    val weekday = date.dayOfWeek.getDisplayName(TextStyle.FULL, GERMAN)
    val month = date.month.getDisplayName(TextStyle.FULL, GERMAN)
    return "$weekday, ${date.dayOfMonth}. $month"
}

fun formatEventDate(startDt: String): String {
    val date = parseApiDateTime(startDt).toLocalDate()
    val today = LocalDate.now()
    return when (date) {
        today -> "Heute"
        today.plusDays(1) -> "Morgen"
        else -> {
            val weekday = date.dayOfWeek.getDisplayName(TextStyle.SHORT, GERMAN)
            val month = date.month.getDisplayName(TextStyle.SHORT, GERMAN)
            "$weekday, ${date.dayOfMonth}. $month"
        }
    }
}

fun formatEventTime(startDt: String): String {
    val time = parseApiDateTime(startDt).toLocalTime()
    return "%02d:%02d".format(time.hour, time.minute)
}

fun isOverdue(dueDate: String?, today: String = todayIso()): Boolean =
    !dueDate.isNullOrBlank() && dueDate < today
