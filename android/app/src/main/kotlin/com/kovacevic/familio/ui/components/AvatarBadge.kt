package com.kovacevic.familio.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class AvatarSize(val diameter: androidx.compose.ui.unit.Dp, val fontSize: androidx.compose.ui.unit.TextUnit) {
    SM(24.dp, 10.sp),
    MD(36.dp, 14.sp),
    LG(56.dp, 20.sp),
}

@Composable
fun AvatarBadge(
    initials: String,
    color: String,
    online: Boolean = false,
    size: AvatarSize = AvatarSize.MD,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.size(size.diameter)) {
        Box(
            modifier = Modifier
                .size(size.diameter)
                .clip(CircleShape)
                .background(parseHexColor(color)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = initials.take(2).uppercase(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = size.fontSize,
            )
        }
        if (online) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(size.diameter * 0.3f)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.surface, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(size.diameter * 0.24f)
                        .clip(CircleShape)
                        .background(com.kovacevic.familio.ui.theme.FamilioTheme.extendedColors.success),
                )
            }
        }
    }
}
