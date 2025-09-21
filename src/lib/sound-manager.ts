'use client'

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true
  private volume: number = 0.3

  constructor() {
    // Check localStorage for sound preferences
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('soundEnabled')
      this.enabled = stored === null ? true : stored === 'true'
      
      const storedVolume = localStorage.getItem('soundVolume')
      this.volume = storedVolume ? parseFloat(storedVolume) : 0.3
    }
  }

  preloadSound(name: string, url: string): void {
    if (typeof window === 'undefined') return
    
    const audio = new Audio(url)
    audio.volume = this.volume
    audio.preload = 'auto'
    this.sounds.set(name, audio)
  }

  playSound(name: string): void {
    if (!this.enabled || typeof window === 'undefined') return
    
    const sound = this.sounds.get(name)
    if (sound) {
      // Clone the audio to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement
      clone.volume = this.volume
      clone.play().catch(() => {
        // Ignore errors (e.g., autoplay policy)
      })
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', enabled.toString())
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', this.volume.toString())
    }
    
    // Update volume for all preloaded sounds
    this.sounds.forEach(sound => {
      sound.volume = this.volume
    })
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getVolume(): number {
    return this.volume
  }
}

// Singleton instance
const soundManager = new SoundManager()

// Preload common UI sounds
if (typeof window !== 'undefined') {
  // Using data URLs for built-in sounds (no external files needed)
  // These are simple sine wave beeps
  const clickSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijQIG2m98OScTgwOUaro7blmFAU7k9n1unEiBC13yO/eizEIHWq+8+OWT' +
    'AsPU6zr67RiHwUui9bb9qVfFgUvgM/z2Y4yBxpnvPDlnEwKC1Kq6Oy9WxMETKfh8btpKAUmeNDy3oU1Bxtpve7mnEsND1Sr6+y6YRwFNpLb9L9qJAUqf8/012wzBh1svu3mmU0LD1Sr6ey6YRsGN5PY88JwKwUme8zu1os2CBpovu3jmEsMD1Oo6e69XxwFMIjX8tKANwchbLzv5ZJBBA5bqejsvV8fBzGH1/DQgjMGH2u+7eSWRgsLUqzq7bllHgg2'
  const hoverSound = 'data:audio/wav;base64,UklGRiQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQACAADt7Pn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5'
  const successSound = 'data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YToGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeS'
  
  soundManager.preloadSound('click', clickSound)
  soundManager.preloadSound('hover', hoverSound)
  soundManager.preloadSound('success', successSound)
}

export default soundManager