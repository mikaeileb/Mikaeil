package com.mikaeil.startfresh

import androidx.compose.ui.test.assertDoesNotExist
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.onAllNodes
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StartFreshUiTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun clearLocalData() {
        runBlocking {
            StartFreshDatabase.get(composeRule.activity.applicationContext)
                .dao()
                .replaceAll(BackupData())
        }
        composeRule.waitForIdle()
    }

    @Test
    fun libraryAddEditDeleteAndOtherPrimaryActionsAreVisibleAndUsable() {
        // Open the library from the bottom navigation.
        composeRule.onNodeWithText("کتابخانه", substring = false).performClick()

        // The main add action and the empty-state CTA must both be visible.
        composeRule.onNodeWithText("＋  افزودن کتاب جدید", substring = false)
            .assertIsDisplayed()
            .performClick()
        composeRule.onNodeWithText("افزودن کتاب جدید", substring = false).assertIsDisplayed()

        // Complete the four fields and create a book.
        val fields = composeRule.onAllNodes(hasSetTextAction())
        fields.get(0).performTextInput("کتاب آزمایشی")
        fields.get(1).performTextInput("نویسنده آزمایشی")
        fields.get(2).performTextInput("120")
        fields.get(3).performTextInput("آزمایشی")
        composeRule.onNodeWithText("افزودن کتاب", substring = false).performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("کتاب آزمایشی", substring = false).assertIsDisplayed()

        // Edit the title and verify the updated data is shown.
        composeRule.onNodeWithText("✎  ویرایش", substring = false).performClick()
        composeRule.onNodeWithText("ویرایش مشخصات کتاب", substring = false).assertIsDisplayed()
        composeRule.onAllNodes(hasSetTextAction())
            .get(0)
            .performTextReplacement("کتاب ویرایش‌شده")
        composeRule.onNodeWithText("ذخیره تغییرات", substring = false).performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("کتاب ویرایش‌شده", substring = false).assertIsDisplayed()
        composeRule.onNodeWithText("کتاب آزمایشی", substring = false).assertDoesNotExist()

        // Delete requires an explicit confirmation and removes the book from the list.
        composeRule.onNodeWithText("حذف کتاب", substring = false).performClick()
        composeRule.onNodeWithText("حذف کتاب؟", substring = false).assertIsDisplayed()
        composeRule.onNodeWithText("بله، حذف شود", substring = false).performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("کتاب ویرایش‌شده", substring = false).assertDoesNotExist()

        // The habit creation action is also visible and opens its dialog.
        composeRule.onNodeWithText("عادت‌ها", substring = false).performClick()
        composeRule.onNodeWithText("＋  افزودن عادت جدید", substring = false)
            .assertIsDisplayed()
            .performClick()
        composeRule.onNodeWithText("ساخت عادت تازه", substring = false).assertIsDisplayed()
        composeRule.onNodeWithText("لغو", substring = false).performClick()

        // The manual study action must remain visible next to its section title.
        composeRule.onNodeWithText("مطالعه", substring = false).performClick()
        composeRule.onNodeWithText("ثبت دستی", substring = false)
            .assertIsDisplayed()
            .performClick()
        composeRule.onNodeWithText("ثبت جلسه مطالعه", substring = false).assertIsDisplayed()
    }
}
