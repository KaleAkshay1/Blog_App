import { lazy, Suspense } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { EmptyState, Loading } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import Home from '@/pages/home'
import Dashboard, { RequireAuth, Saved } from '@/pages/dashboard'

const Story = lazy(() => import('@/pages/story'))
const Topics = lazy(() => import('@/pages/topics'))
const About = lazy(() => import('@/pages/about'))
const Editor = lazy(() => import('@/pages/editor'))
const Notifications = lazy(() => import('@/pages/notifications'))

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="topics" element={<Topics />} />
          <Route path="about" element={<About />} />
          <Route path="story/:slug" element={<Story />} />
          <Route element={<RequireAuth />}>
            <Route path="notifications" element={<Notifications />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="saved" element={<Saved />} />
            <Route path="write" element={<Editor />} />
            <Route path="write/:slug" element={<Editor />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="page-shell py-20">
                <EmptyState
                  title="This page is still unwritten."
                  description="We couldn’t find the page you’re looking for. There are plenty of good stories back home."
                >
                  <Button asChild>
                    <Link to="/">Back to discover</Link>
                  </Button>
                </EmptyState>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
