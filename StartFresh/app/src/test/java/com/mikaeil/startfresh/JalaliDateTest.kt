package com.mikaeil.startfresh

import com.mikaeil.startfresh.util.JalaliDate
import org.junit.Assert.assertEquals
import org.junit.Test

class JalaliDateTest {
    @Test
    fun convertsKnownNowruzDate() {
        assertEquals("۱۴۰۳/۰۱/۰۱", JalaliDate.short("2024-03-20"))
    }

    @Test
    fun convertsCurrentProjectDate() {
        assertEquals("۱۴۰۵/۰۸/۱۴", JalaliDate.short("2026-11-05"))
    }

    @Test
    fun shiftsDatesAcrossMonthBoundaries() {
        assertEquals("2026-11-01", JalaliDate.shift("2026-10-31", 1))
    }
}
