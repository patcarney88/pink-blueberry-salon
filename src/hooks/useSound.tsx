'use client'

import { useCallback } from 'react'
import soundManager from '@/lib/sound-manager'

export function useSound() {
  const playClick = useCallback(() => {
    soundManager.playSound('click')
  }, [])

  const playHover = useCallback(() => {
    soundManager.playSound('hover')
  }, [])

  const playSuccess = useCallback(() => {
    soundManager.playSound('success')
  }, [])

  const playCustom = useCallback((soundName: string) => {
    soundManager.playSound(soundName)
  }, [])

  return {
    playClick,
    playHover,
    playSuccess,
    playCustom,
    soundManager
  }
}

// HOC to add sound to any component
export function withSound<P extends object>(
  Component: React.ComponentType<P>,
  soundType: 'click' | 'hover' | 'success' = 'click'
) {
  return function WithSoundComponent(props: P) {
    const { playClick, playHover, playSuccess } = useSound()

    const handleInteraction = () => {
      switch (soundType) {
        case 'click':
          playClick()
          break
        case 'hover':
          playHover()
          break
        case 'success':
          playSuccess()
          break
      }
    }

    const enhancedProps = {
      ...props,
      onMouseEnter: soundType === 'hover' ? handleInteraction : undefined,
      onClick: soundType === 'click' ? handleInteraction : undefined,
    }

    return <Component {...enhancedProps} />
  }
}