import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, LoaderCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth'
import { api, type User } from '@/lib/api'
import { toast } from 'sonner'

export function AuthDialog() {
  const { authMode, closeAuth, openAuth, setUser, destination } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const register = authMode === 'register'
  useEffect(() => {
    setError('')
  }, [authMode])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const { user } = await api<{ user: User }>(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form)),
      })
      setUser(user)
      closeAuth()
      toast.success(
        register
          ? 'Welcome to Story. Make yourself at home.'
          : `Welcome back, ${user.name.split(' ')[0]}.`,
      )
      if (destination) navigate(destination)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={!!authMode}
      onOpenChange={(open) => {
        if (!open && !busy) closeAuth()
      }}
    >
      <DialogContent>
        <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="size-6" />
        </div>
        <DialogHeader>
          <DialogTitle>
            {register ? 'Your story starts here.' : 'Good to see you again.'}
          </DialogTitle>
          <DialogDescription>
            {register
              ? 'Join a community of curious minds. Read, write, and find your next favourite story.'
              : 'Sign in to save the stories you love and share a few of your own.'}
          </DialogDescription>
        </DialogHeader>
        <form key={authMode} onSubmit={submit} className="mt-2 space-y-4">
          {register && (
            <div className="field">
              <label htmlFor="auth-name">Your name</label>
              <Input
                id="auth-name"
                name="name"
                placeholder="Alex Morgan"
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Email address</label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              maxLength={254}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <Input
              id="auth-password"
              name="password"
              type="password"
              placeholder={register ? 'At least 8 characters' : 'Your password'}
              required
              minLength={8}
              maxLength={72}
              autoComplete={register ? 'new-password' : 'current-password'}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            {register ? 'Create your account' : 'Sign in'}
            {!busy && <ArrowRight />}
          </Button>
        </form>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {register ? 'Already part of the community?' : 'New around here?'}{' '}
          <button
            disabled={busy}
            className="font-semibold text-primary hover:underline"
            onClick={() => openAuth(register ? 'login' : 'register', destination || undefined)}
          >
            {register ? 'Sign in' : 'Join Story'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
