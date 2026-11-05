package com.mikaeil.startfresh.util

import java.time.LocalDate

object JalaliDate {
    private val months = listOf(
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    )
    private val weekdays = listOf(
        "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه"
    )

    fun todayKey(): String = LocalDate.now().toString()

    fun toPersianDigits(value: String): String {
        val latin = "0123456789"
        val persian = "۰۱۲۳۴۵۶۷۸۹"
        return value.map { ch ->
            val index = latin.indexOf(ch)
            if (index >= 0) persian[index] else ch
        }.joinToString("")
    }

    fun number(value: Int): String = toPersianDigits(value.toString())

    fun format(isoDate: String, includeWeekday: Boolean = false): String {
        return try {
            val date = LocalDate.parse(isoDate)
            val (jy, jm, jd) = convert(date.year, date.monthValue, date.dayOfMonth)
            val base = "\${number(jy)}/\${number(jm).padStart(2, '۰')}/\${number(jd).padStart(2, '۰')} · \${months[jm - 1]}"
            if (includeWeekday) "\${weekdays[date.dayOfWeek.value - 1]}، $base" else base
        } catch (_: Exception) {
            isoDate
        }
    }

    fun short(isoDate: String): String {
        return try {
            val date = LocalDate.parse(isoDate)
            val (jy, jm, jd) = convert(date.year, date.monthValue, date.dayOfMonth)
            "\${number(jy)}/\${number(jm).padStart(2, '۰')}/\${number(jd).padStart(2, '۰')}"
        } catch (_: Exception) { isoDate }
    }

    fun shift(isoDate: String, days: Long): String =
        LocalDate.parse(isoDate).plusDays(days).toString()

    private fun convert(gy: Int, gm: Int, gd: Int): Triple<Int, Int, Int> {
        val gdm = intArrayOf(0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334)
        val gy2 = if (gm > 2) gy + 1 else gy
        var days = 355666 + 365 * gy + (gy2 + 3) / 4 - (gy2 + 99) / 100 +
            (gy2 + 399) / 400 + gd + gdm[gm - 1]
        var jy = -1595 + 33 * (days / 12053)
        days %= 12053
        jy += 4 * (days / 1461)
        days %= 1461
        if (days > 365) {
            jy += (days - 1) / 365
            days = (days - 1) % 365
        }
        val jm: Int
        val jd: Int
        if (days < 186) {
            jm = 1 + days / 31
            jd = 1 + days % 31
        } else {
            jm = 7 + (days - 186) / 30
            jd = 1 + (days - 186) % 30
        }
        return Triple(jy, jm, jd)
    }
}
