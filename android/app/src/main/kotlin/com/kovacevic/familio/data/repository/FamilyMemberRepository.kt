package com.kovacevic.familio.data.repository

import com.kovacevic.familio.data.model.FamilyMember
import com.kovacevic.familio.data.model.FamilyMemberWriteRequest
import com.kovacevic.familio.data.remote.ApiService

class FamilyMemberRepository(private val api: ApiService) {
    suspend fun getFamilyMembers(): Result<List<FamilyMember>> =
        safeApiCall { api.getFamilyMembers() }

    suspend fun createFamilyMember(input: FamilyMemberWriteRequest): Result<FamilyMember> =
        safeApiCall { api.createFamilyMember(input) }

    suspend fun updateFamilyMember(id: String, input: FamilyMemberWriteRequest): Result<FamilyMember> =
        safeApiCall { api.updateFamilyMember(id, input) }

    suspend fun deleteFamilyMember(id: String): Result<Unit> =
        safeApiCall { api.deleteFamilyMember(id) }
}
