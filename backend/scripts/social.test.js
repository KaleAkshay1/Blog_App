import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'

process.env.LOG_TO_FILE = 'false'
process.env.LOG_LEVEL = 'error'
const { default: app } = await import('../src/app.js')
const { config } = await import('../src/config/env.js')
const { closeLogger } = await import('../src/config/logger.js')
const { Like } = await import('../src/models/like.model.js')
const { Comment } = await import('../src/models/comment.model.js')
const { Notification } = await import('../src/models/notification.model.js')
const { Report } = await import('../src/models/report.model.js')

const databaseName = 'story_social_test_' + randomBytes(8).toString('hex')
let server
let baseURL
before(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI || config.mongoUri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 8000,
  })
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = 'http://127.0.0.1:' + server.address().port + '/api'
})
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName) {
    await mongoose.connection.dropDatabase()
  }
  await mongoose.disconnect()
  await closeLogger()
})

function client() {
  let cookie = ''
  return async (path, { method = 'GET', body, status = 200 } = {}) => {
    const response = await fetch(baseURL + path, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await response.json()
    assert.equal(response.status, status, method + ' ' + path + ': ' + JSON.stringify(data))
    if (response.headers.get('set-cookie'))
      cookie = response.headers.get('set-cookie').split(';')[0]
    return data
  }
}

test('likes, conversations, notifications, sharing, and reports', async (t) => {
  const owner = client()
  const reader = client()
  const third = client()
  const guest = client()
  const password = 'social-test-password-123'
  const ownerUser = (
    await owner('/auth/register', {
      method: 'POST',
      status: 201,
      body: { name: 'Story Owner', email: 'owner@social.example', password },
    })
  ).user
  const readerUser = (
    await reader('/auth/register', {
      method: 'POST',
      status: 201,
      body: { name: 'Story Reader', email: 'reader@social.example', password },
    })
  ).user
  await third('/auth/register', {
    method: 'POST',
    status: 201,
    body: { name: 'Third Reader', email: 'third@social.example', password },
  })
  const input = {
    title: 'A story for our community',
    excerpt: 'An introduction worth discussing together.',
    content: 'A complete story with plenty of room for thoughtful conversations.',
    category: 'Design',
    coverImage: '',
    status: 'published',
  }
  const post = (await owner('/posts', { method: 'POST', body: input, status: 201 })).post
  const draft = (
    await owner('/posts', { method: 'POST', body: { ...input, status: 'draft' }, status: 201 })
  ).post
  const path = '/posts/' + post.id
  const notifications = async (who, type) =>
    (await who('/notifications')).notifications.filter((item) => !type || item.type === type)
  let root
  let reply
  let nested

  await t.test('public reads, authentication, and validation', async () => {
    assert.deepEqual(await guest(path + '/engagement'), {
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    })
    await guest(path + '/like', { method: 'PUT', body: { liked: true }, status: 401 })
    await guest(path + '/comments', { method: 'POST', body: { content: 'Hello' }, status: 401 })
    await guest('/notifications', { status: 401 })
    await reader(path + '/like', { method: 'PUT', body: { liked: 'yes' }, status: 400 })
    await reader(path + '/comments', { method: 'POST', body: { content: '   ' }, status: 400 })
    await reader(path + '/comments', {
      method: 'POST',
      body: { content: 'x'.repeat(2001) },
      status: 400,
    })
    await reader('/posts/not-an-id/like', { method: 'PUT', body: { liked: true }, status: 400 })
  })

  await t.test('concurrent likes stay unique and notify the author once', async () => {
    await Promise.all(
      Array.from({ length: 3 }, () =>
        reader(path + '/like', { method: 'PUT', body: { liked: true } }),
      ),
    )
    assert.equal(await Like.countDocuments({ post: post.id }), 1)
    assert.equal((await notifications(owner, 'like')).length, 1)
    assert.equal((await notifications(reader)).length, 0)
    assert.equal((await reader(path + '/engagement')).likedByMe, true)
    await owner(path + '/like', { method: 'PUT', body: { liked: true } })
    assert.equal((await notifications(owner, 'like')).length, 1)
    await reader(path + '/like', { method: 'PUT', body: { liked: false } })
    assert.equal((await notifications(owner, 'like')).length, 0)
    await reader(path + '/like', { method: 'PUT', body: { liked: true } })
  })

  await t.test('comments assign ownership on the server and notify only the author', async () => {
    root = (
      await reader(path + '/comments', {
        method: 'POST',
        status: 201,
        body: {
          content: '  A thoughtful question.  ',
          author: ownerUser.id,
          parent: draft.id,
        },
      })
    ).comment
    assert.equal(root.content, 'A thoughtful question.')
    assert.equal(root.author.id, readerUser.id)
    assert.equal(root.parentId, null)
    assert.equal((await notifications(owner, 'comment')).length, 1)
    assert.equal((await notifications(reader)).length, 0)
  })

  await t.test(
    'replies and replies to replies notify the right accounts without duplicates',
    async () => {
      reply = (
        await owner(path + '/comments/' + root.id + '/replies', {
          method: 'POST',
          status: 201,
          body: { content: 'Thank you for asking.' },
        })
      ).comment
      assert.equal((await notifications(reader, 'reply')).length, 1)
      nested = (
        await third(path + '/comments/' + reply.id + '/replies', {
          method: 'POST',
          status: 201,
          body: { content: 'Another perspective.' },
        })
      ).comment
      assert.equal(nested.parentId, root.id)
      assert.equal(nested.replyTo.id, reply.id)
      assert.equal((await notifications(owner, 'reply')).length, 1)
      assert.equal((await notifications(third)).length, 0)
      await reader(path + '/comments/' + nested.id + '/replies', {
        method: 'POST',
        status: 201,
        body: { content: 'That makes sense.' },
      })
      assert.equal((await notifications(third, 'reply')).length, 1)
      assert.equal((await notifications(owner, 'reply')).length, 2)
      assert.equal((await guest(path + '/engagement')).commentCount, 4)
    },
  )

  await t.test('editing is owner-only and does not send another notification', async () => {
    await owner(path + '/comments/' + root.id, {
      method: 'PATCH',
      body: { content: 'Not mine' },
      status: 403,
    })
    await reader(path + '/comments/' + reply.id, { method: 'DELETE', status: 403 })
    const edited = await reader(path + '/comments/' + root.id, {
      method: 'PATCH',
      body: { content: 'An edited question.' },
    })
    assert.ok(edited.comment.editedAt)
    assert.equal(edited.comment.content, 'An edited question.')
    assert.equal((await notifications(owner, 'comment')).length, 1)
  })

  await t.test('notifications are private, paginated, and can be marked read', async () => {
    const note = (await notifications(owner))[0]
    await reader('/notifications/' + note.id + '/read', { method: 'PATCH', status: 404 })
    await owner('/notifications/bad-id/read', { method: 'PATCH', status: 400 })
    const before = (await owner('/notifications')).unreadCount
    await owner('/notifications/' + note.id + '/read', { method: 'PATCH' })
    assert.equal((await owner('/notifications')).unreadCount, before - 1)
    const firstPage = await owner('/notifications?limit=1')
    assert.equal(firstPage.notifications.length, 1)
    assert.ok(firstPage.pages > 1)
    assert.equal(firstPage.notifications[0].actor.email, undefined)
    await owner('/notifications?limit=0', { status: 400 })
    await reader('/notifications/read-all', { method: 'PATCH' })
    assert.equal((await reader('/notifications')).unreadCount, 0)
    assert.ok((await owner('/notifications')).unreadCount > 0)
  })

  await t.test('shares deliver once to the chosen member', async () => {
    await guest(path + '/share', {
      method: 'POST',
      body: { email: 'third@social.example' },
      status: 401,
    })
    await reader(path + '/share', { method: 'POST', body: { email: 'THIRD@social.example' } })
    await reader(path + '/share', { method: 'POST', body: { email: 'third@social.example' } })
    assert.equal((await notifications(third, 'share')).length, 1)
    assert.equal((await notifications(owner, 'share')).length, 0)
    await reader(path + '/share', {
      method: 'POST',
      body: { email: 'reader@social.example' },
      status: 400,
    })
    await reader(path + '/share', {
      method: 'POST',
      body: { email: 'missing@social.example' },
      status: 404,
    })
    await reader(path + '/share', { method: 'POST', body: { email: 'invalid' }, status: 400 })
  })

  await t.test('reports are validated, private, and deduplicated', async () => {
    await guest(path + '/reports', { method: 'POST', body: { reason: 'spam' }, status: 401 })
    await reader(path + '/reports', { method: 'POST', body: { reason: 'invalid' }, status: 400 })
    await reader(path + '/reports', {
      method: 'POST',
      body: { reason: 'spam', details: 'A concern', reporter: ownerUser.id, status: 'reviewed' },
    })
    await reader(path + '/reports', { method: 'POST', body: { reason: 'other' } })
    const reports = await Report.find({ post: post.id })
    assert.equal(reports.length, 1)
    assert.equal(String(reports[0].reporter), readerUser.id)
    assert.equal(reports[0].status, 'pending')
    await owner(path + '/reports', { status: 404 })
  })

  await t.test('bookmarks still persist separately from likes', async () => {
    await reader('/bookmarks/' + post.id, { method: 'PUT', body: { saved: true } })
    await reader('/bookmarks/' + post.id, { method: 'PUT', body: { saved: true } })
    assert.equal((await reader('/bookmarks')).posts.length, 1)
    assert.equal((await reader(path + '/engagement')).likedByMe, true)
  })

  await t.test(
    'deleted comments retain replies and remove the corresponding notification',
    async () => {
      const deleted = await reader(path + '/comments/' + root.id, { method: 'DELETE' })
      assert.equal(deleted.comment.isDeleted, true)
      assert.equal(deleted.comment.content, '')
      assert.equal(deleted.comment.author, null)
      assert.equal((await notifications(owner, 'comment')).length, 0)
      const replies = await guest(path + '/comments/' + root.id + '/replies?limit=1')
      assert.equal(replies.total, 3)
      assert.equal(replies.pages, 3)
      assert.equal((await guest(path + '/engagement')).commentCount, 3)
      await reader(path + '/comments/' + root.id + '/replies', {
        method: 'POST',
        body: { content: 'Unavailable' },
        status: 404,
      })
      await third(path + '/comments/' + nested.id, { method: 'DELETE' })
      assert.equal((await notifications(owner, 'reply')).length, 1)
      assert.equal((await guest(path + '/engagement')).commentCount, 2)
    },
  )

  await t.test(
    'drafts reject interactions and unpublished stories disappear from notifications',
    async () => {
      for (const who of [owner, reader, guest]) {
        await who('/posts/' + draft.id + '/engagement', { status: 404 })
        await who('/posts/' + draft.id + '/comments', { status: 404 })
      }
      await reader('/posts/' + draft.id + '/like', {
        method: 'PUT',
        body: { liked: true },
        status: 404,
      })
      await reader('/posts/' + draft.id + '/share', {
        method: 'POST',
        body: { email: 'third@social.example' },
        status: 404,
      })
      await reader('/posts/' + draft.id + '/reports', {
        method: 'POST',
        body: { reason: 'spam' },
        status: 404,
      })
      await owner(path, { method: 'PUT', body: { ...input, status: 'draft' } })
      assert.equal((await owner('/notifications')).total, 0)
      assert.equal((await third('/notifications')).unreadCount, 0)
      await reader(path + '/comments', { status: 404 })
      await owner(path, { method: 'PUT', body: input })
      assert.ok((await owner('/notifications')).total > 0)
    },
  )

  await t.test('deleting a story cleans up its interactions and bookmarks', async () => {
    await owner(path, { method: 'DELETE' })
    for (const Model of [Like, Comment, Notification, Report]) {
      assert.equal(await Model.countDocuments({ post: post.id }), 0)
    }
    assert.equal((await reader('/bookmarks')).posts.length, 0)
    assert.equal((await third('/notifications')).total, 0)
  })
})
