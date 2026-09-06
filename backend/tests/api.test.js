import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import request from 'supertest'
import app from '../src/app.js'
import { config } from '../src/config/env.js'
import { Post } from '../src/models/post.model.js'
import { Subscriber } from '../src/models/subscriber.model.js'
import { seedDatabase } from '../src/seeders/seed-data.js'

// Always use an isolated, uniquely named database, never the application database.
const testDbName = `story_test_${randomBytes(8).toString('hex')}`
before(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI || config.mongoUri, {
    dbName: testDbName,
    serverSelectionTimeoutMS: 8000,
  })
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
})
after(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === testDbName)
    await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('MongoDB-backed blog API', async (t) => {
  const author = request.agent(app)
  const other = request.agent(app)
  const login = {
    name: 'Test Author',
    email: 'author@example.com',
    password: 'a-test-password-123',
  }
  let draft
  const input = {
    title: 'A story worth sharing',
    excerpt: 'A thoughtful introduction to a fresh perspective.',
    content:
      '## A new beginning\n\nHere is a thoughtful story about the things we notice every day.',
    category: 'Design',
    coverImage: '',
    status: 'draft',
  }

  await t.test('health and idempotent sample data', async () => {
    await request(app).get('/api/health').expect(200)
    assert.equal(await seedDatabase(), 9)
    assert.equal(await seedDatabase(), 0)
    assert.equal(await Post.countDocuments(), 9)
  })
  await t.test('validates registration and limits password byte length', async () => {
    await author
      .post('/api/auth/register')
      .send({ ...login, password: 'short' })
      .expect(400)
    await author
      .post('/api/auth/register')
      .send({ ...login, password: '😊'.repeat(20) })
      .expect(400)
    const result = await author.post('/api/auth/register').send(login).expect(201)
    assert.equal(result.body.user.name, login.name)
    assert.equal(result.body.user.password, undefined)
    assert.match(result.headers['set-cookie'][0], /HttpOnly/)
    assert.match(result.headers['set-cookie'][0], /SameSite=Lax/)
    await request(app).post('/api/auth/register').send(login).expect(409)
    await other
      .post('/api/auth/register')
      .send({ ...login, name: 'Other Author', email: 'other@example.com' })
      .expect(201)
  })
  await t.test('cookie sessions, login, and logout work', async () => {
    assert.equal((await author.get('/api/auth/me')).body.user.email, login.email)
    await author.post('/api/auth/logout').expect(200)
    assert.equal((await author.get('/api/auth/me')).body.user, null)
    await author
      .post('/api/auth/login')
      .send({ ...login, password: 'wrong-password' })
      .expect(401)
    await author.post('/api/auth/login').send(login).expect(200)
  })
  await t.test('rejects untrusted origins and unauthenticated writes', async () => {
    await author
      .post('/api/posts')
      .set('Origin', 'https://untrusted.example')
      .send(input)
      .expect(403)
    await request(app).post('/api/posts').send(input).expect(401)
    await request(app).get('/api/me/posts').expect(401)
    await request(app).get('/api/bookmarks').expect(401)
  })
  await t.test('validates stories and ignores injected ownership or featured fields', async () => {
    await author
      .post('/api/posts')
      .send({ ...input, category: 'Invalid' })
      .expect(400)
    await author
      .post('/api/posts')
      .send({ ...input, coverImage: 'javascript:alert(1)' })
      .expect(400)
    const result = await author
      .post('/api/posts')
      .send({ ...input, featured: true, author: 'invalid' })
      .expect(201)
    draft = result.body.post
    assert.equal(draft.status, 'draft')
    assert.equal(draft.featured, false)
    assert.equal(draft.author.name, login.name)
  })
  await t.test('drafts stay private and cannot be bookmarked', async () => {
    await request(app).get(`/api/posts/${draft.slug}`).expect(404)
    await other.get(`/api/posts/${draft.slug}`).expect(404)
    await author.get(`/api/posts/${draft.slug}`).expect(200)
    assert.equal((await request(app).get('/api/posts')).body.total, 9)
    assert.equal((await author.get('/api/me/posts')).body.posts.length, 1)
    await author.put(`/api/bookmarks/${draft.id}`).send({ saved: true }).expect(404)
  })
  await t.test('only the owner can update or delete a story', async () => {
    await other.put(`/api/posts/${draft.id}`).send(input).expect(403)
    await other.delete(`/api/posts/${draft.id}`).expect(403)
    await author.put('/api/posts/not-an-id').send(input).expect(400)
  })
  await t.test('publishing preserves the URL and makes the article discoverable', async () => {
    const result = await author
      .put(`/api/posts/${draft.id}`)
      .send({ ...input, status: 'published', title: 'An updated story worth sharing' })
      .expect(200)
    assert.equal(result.body.post.slug, draft.slug)
    assert.ok(result.body.post.publishedAt)
    await request(app).get(`/api/posts/${draft.slug}`).expect(200)
    assert.equal((await request(app).get('/api/posts?search=updated')).body.total, 1)
  })
  await t.test('search, category filters, pagination, and sorting are validated', async () => {
    const list = await request(app)
      .get('/api/posts?category=Design&limit=1&page=1&sort=oldest')
      .expect(200)
    assert.equal(list.body.posts.length, 1)
    assert.equal(list.body.total, 3)
    assert.equal(list.body.pages, 3)
    assert.equal(list.body.posts[0].content, undefined)
    const topics = await request(app).get('/api/topics').expect(200)
    assert.equal(topics.body.topics.find((topic) => topic.name === 'Design').count, 3)
    await request(app).get('/api/posts?limit=-1').expect(400)
    await request(app).get('/api/posts?category=Other').expect(400)
    const literal = await request(app).get('/api/posts').query({ search: '.*' }).expect(200)
    assert.equal(literal.body.total, 0)
  })
  await t.test('bookmark writes are idempotent and saved stories persist', async () => {
    await author.put(`/api/bookmarks/${draft.id}`).send({ saved: true }).expect(200)
    const second = await author.put(`/api/bookmarks/${draft.id}`).send({ saved: true }).expect(200)
    assert.equal(second.body.bookmarks.length, 1)
    assert.equal((await author.get('/api/bookmarks')).body.posts[0].id, draft.id)
    await author.put(`/api/bookmarks/${draft.id}`).send({ saved: false }).expect(200)
    assert.equal((await author.get('/api/bookmarks')).body.posts.length, 0)
    await author.put(`/api/bookmarks/${draft.id}`).send({ saved: true }).expect(200)
  })
  await t.test('unpublishing removes stories from public and saved lists', async () => {
    await author.put(`/api/posts/${draft.id}`).send(input).expect(200)
    await request(app).get(`/api/posts/${draft.slug}`).expect(404)
    assert.equal((await author.get('/api/bookmarks')).body.posts.length, 0)
  })
  await t.test('deleting cleans up the article and bookmarks', async () => {
    await author.delete(`/api/posts/${draft.id}`).expect(200)
    await author.get(`/api/posts/${draft.slug}`).expect(404)
    assert.equal((await author.get('/api/auth/me')).body.user.bookmarks.length, 0)
  })
  await t.test('newsletter validates and deduplicates subscriptions', async () => {
    await request(app).post('/api/newsletter').send({ email: 'invalid' }).expect(400)
    await request(app).post('/api/newsletter').send({ email: 'reader@example.com' }).expect(201)
    await request(app).post('/api/newsletter').send({ email: 'READER@example.com' }).expect(201)
    assert.equal(await Subscriber.countDocuments(), 1)
  })
  await t.test('unknown routes and malformed payloads return useful JSON errors', async () => {
    const result = await request(app).get('/api/missing').expect(404)
    assert.equal(result.body.message, 'API route not found.')
    for (const path of [
      '/api/auth/missing',
      '/api/me/missing',
      '/api/bookmarks/missing',
      '/api/topics/missing',
      '/api/newsletter/missing',
      '/api/health/missing',
    ]) {
      const missing = await request(app).get(path).expect(404)
      assert.equal(missing.body.message, 'API route not found.')
    }
    await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400)
  })
})
