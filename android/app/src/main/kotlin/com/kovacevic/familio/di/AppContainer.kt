package com.kovacevic.familio.di

import android.content.Context
import coil3.ImageLoader
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import com.kovacevic.familio.data.local.SettingsDataStore
import com.kovacevic.familio.data.remote.ApiService
import com.kovacevic.familio.data.remote.ServerUrlHolder
import com.kovacevic.familio.data.remote.buildOkHttpClient
import com.kovacevic.familio.data.remote.buildRetrofit
import com.kovacevic.familio.data.repository.DocumentRepository
import com.kovacevic.familio.data.repository.EventRepository
import com.kovacevic.familio.data.repository.FamilyMemberRepository
import com.kovacevic.familio.data.repository.ShoppingRepository
import com.kovacevic.familio.data.repository.TaskRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

class AppContainer(context: Context, applicationScope: CoroutineScope) {

    val settingsDataStore = SettingsDataStore(context)

    val serverUrlHolder = ServerUrlHolder(SettingsDataStore.DEFAULT_SERVER_URL)

    private val okHttpClient = buildOkHttpClient(serverUrlHolder)
    private val retrofit = buildRetrofit(okHttpClient)
    private val apiService: ApiService = retrofit.create(ApiService::class.java)

    val taskRepository = TaskRepository(apiService)
    val eventRepository = EventRepository(apiService)
    val familyMemberRepository = FamilyMemberRepository(apiService)
    val shoppingRepository = ShoppingRepository(apiService)
    val documentRepository = DocumentRepository(apiService, serverUrlHolder)

    val imageLoader: ImageLoader = ImageLoader.Builder(context)
        .components { add(OkHttpNetworkFetcherFactory(callFactory = { okHttpClient })) }
        .build()

    init {
        settingsDataStore.serverUrl
            .onEach { serverUrlHolder.current = it }
            .launchIn(applicationScope)
    }
}
