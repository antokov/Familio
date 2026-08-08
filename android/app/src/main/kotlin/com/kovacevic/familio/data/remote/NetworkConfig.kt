@file:OptIn(ExperimentalSerializationApi::class)

package com.kovacevic.familio.data.remote

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNamingStrategy
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Retrofit is built once against this fixed placeholder host. [ServerUrlHolder] carries the
 * user-configured real server URL, and [BaseUrlInterceptor] rewrites every outgoing request's
 * scheme/host/port to it at call time — this is what lets the server URL change at runtime
 * (Settings screen) without rebuilding the whole Retrofit/OkHttp stack.
 */
const val PLACEHOLDER_BASE_URL = "http://familio.internal/"

class ServerUrlHolder(initial: String) {
    @Volatile
    var current: String = initial
}

class BaseUrlInterceptor(private val serverUrlHolder: ServerUrlHolder) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val configured = serverUrlHolder.current.toHttpUrlOrNull()
            ?: return chain.proceed(request)
        val rewrittenUrl = request.url.newBuilder()
            .scheme(configured.scheme)
            .host(configured.host)
            .port(configured.port)
            .build()
        return chain.proceed(request.newBuilder().url(rewrittenUrl).build())
    }
}

val familioJson: Json = Json {
    ignoreUnknownKeys = true
    namingStrategy = JsonNamingStrategy.SnakeCase
    encodeDefaults = true
    explicitNulls = false
}

fun buildOkHttpClient(serverUrlHolder: ServerUrlHolder): OkHttpClient =
    OkHttpClient.Builder()
        .addInterceptor(BaseUrlInterceptor(serverUrlHolder))
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()

fun buildRetrofit(okHttpClient: OkHttpClient): Retrofit =
    Retrofit.Builder()
        .baseUrl(PLACEHOLDER_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(familioJson.asConverterFactory("application/json".toMediaType()))
        .build()
