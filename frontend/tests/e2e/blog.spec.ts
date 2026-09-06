import { test, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { config } from '../../../backend/src/config/env.js'
import { User } from '../../../backend/src/models/user.model.js'
import { Post } from '../../../backend/src/models/post.model.js'

const email = `story-e2e-${randomBytes(8).toString('hex')}@example.com`
test.afterAll(async () => {
  await User.db.openUri(config.mongoUri, { serverSelectionTimeoutMS: 8000 })
  try {
    const user = await User.findOne({ email })
    if (user) {
      await Post.deleteMany({ author: user._id })
      await User.deleteOne({ _id: user._id })
    }
  } finally {
    await User.db.close()
  }
})

test('discover, filter, search, read, and navigate on mobile', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'A little curiosity. A whole new perspective.' }),
  ).toBeVisible()
  await expect(page.locator('.story-card')).toHaveCount(6)
  await expect(page.locator('.featured-image img')).toHaveJSProperty('complete', true)
  await expect(page.locator('.featured-image img')).not.toHaveJSProperty('naturalWidth', 0)
  await page.locator('img').evaluateAll((images) =>
    images.forEach((img) => {
      img.loading = 'eager'
    }),
  )
  await expect
    .poll(() =>
      page
        .locator('img')
        .evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0)),
    )
    .toBe(true)
  await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true })
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await expect(page.locator('.story-card')).toHaveCount(2)
  await page.getByRole('button', { name: 'Search stories', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Search by title or topic' }).fill('notebook')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('.story-card')).toHaveCount(1)
  await page
    .getByRole('link', { name: 'Why the best ideas start in a notebook', exact: true })
    .click()
  await expect(page.locator('.prose-story').first()).toContainText('A place to think out loud')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.story-card')).toHaveCount(6)
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Topics', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'There’s a world to explore.' })).toBeVisible()
  await expect(page.locator('.topic-card')).toHaveCount(6)
  expect(errors).toEqual([])
})

test('register, save a draft, publish, bookmark, edit, and delete', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start writing', exact: true }).click()
  await page.getByLabel('Your name', { exact: true }).fill('Browser Test Writer')
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('browser-test-password-123')
  await page.getByRole('button', { name: 'Create your account' }).click()
  await expect(page).toHaveURL(/\/write$/)
  await page.getByLabel('Story title', { exact: true }).fill('A small browser-tested adventure')
  await page
    .getByLabel('A little introduction', { exact: true })
    .fill('A story created while checking the complete writing experience.')
  await page
    .getByLabel('Your story', { exact: true })
    .fill(
      '## A small beginning\n\nEvery useful story begins with a little curiosity and something worth noticing.',
    )
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'A small beginning', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole('link', { name: 'A small browser-tested adventure', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'Edit A small browser-tested adventure', exact: true })
    .click()
  await page.getByRole('button', { name: 'Publish story', exact: true }).click()
  await expect(page).toHaveURL(/\/story\//)
  await page
    .getByRole('button', { name: 'Save A small browser-tested adventure', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Unsave A small browser-tested adventure', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Unsave A small browser-tested adventure', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open account menu' }).click()
  await page.getByRole('link', { name: 'Reading list', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'A small browser-tested adventure', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open account menu' }).click()
  await page.getByRole('link', { name: 'My stories', exact: true }).click()
  await page
    .getByRole('link', { name: 'Edit A small browser-tested adventure', exact: true })
    .click()
  await page.getByLabel('Story title', { exact: true }).fill('An updated browser-tested adventure')
  await page.getByRole('button', { name: 'Update story', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'An updated browser-tested adventure', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open account menu' }).click()
  await page.getByRole('link', { name: 'My stories', exact: true }).click()
  await page
    .getByRole('button', { name: 'Delete An updated browser-tested adventure', exact: true })
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete story', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your next chapter starts here.' })).toBeVisible()
  await page.getByRole('button', { name: 'Open account menu' }).click()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible()
})
