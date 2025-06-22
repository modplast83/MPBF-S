import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import React from 'react'
import { useToast, _listeners } from '@/hooks/use-toast'

function TestComponent() {
  const { toast } = useToast()
  React.useEffect(() => {
    toast({ title: 'first' })
    toast({ title: 'second' })
  }, [toast])
  return null
}

afterEach(() => {
  // cleanup listeners between tests
  _listeners.length = 0
})

describe('useToast', () => {
  it('keeps listeners length at 1 after multiple state updates', async () => {
    const { unmount } = render(<TestComponent />)
    // Wait for effects to run
    await Promise.resolve()
    expect(_listeners.length).toBe(1)
    unmount()
    expect(_listeners.length).toBe(0)
  })
})
