package com.kovacevic.familio.di

import android.content.Context
import com.kovacevic.familio.FamilioApplication

fun Context.familioContainer(): AppContainer =
    (applicationContext as FamilioApplication).container
