/**
 * Sound Notification Utility
 * Handles audio notifications for queue management system
 */

class SoundNotification {
  constructor() {
    this.audioContext = null
  }



  /**
   * Generate a notification beep sound using Web Audio API
   */
  generateBeep(frequency = 800, duration = 200, volume = 0.1) {
    if (!this.audioContext) return false

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 200)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 200)

      return true
    } catch (error) {
      console.warn('Failed to generate beep with Web Audio API:', error)
      return false
    }
  }

  /**
   * Play a notification sound for calling next customer
   */
  async playCallNotification() {
    // Use global AudioContext if available, otherwise create one
    if (!this.audioContext) {
      this.audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed.');
    }

    try {
      // Play a pleasant two-tone chime
      if (this.audioContext) {
        // First tone (higher pitch)
        this.generateBeep(880, 300, 0.15)
        
        // Second tone (lower pitch) - delayed
        setTimeout(() => {
          this.generateBeep(660, 400, 0.15)
        }, 200)
        
        console.log('Call notification sound played')
        return true
      } else {
        // Fallback: try to play a system beep
        this.playFallbackSound()
        return true
      }
    } catch (error) {
      console.warn('Failed to play call notification:', error)
      this.playFallbackSound()
      return false
    }
  }

  /**
   * Fallback sound method for browsers that don't support Web Audio API
   */
  playFallbackSound() {
    try {
      // Try to use the system beep if available
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Use speech synthesis as a fallback
        const utterance = new SpeechSynthesisUtterance('')
        utterance.volume = 0.1
        utterance.rate = 10
        utterance.pitch = 2
        window.speechSynthesis.speak(utterance)
      }
      console.log('Fallback sound notification attempted')
    } catch (error) {
      console.warn('All sound notification methods failed:', error)
    }
  }

  /**
   * Speak a custom message using Speech Synthesis API
   * @param {string} name - Customer name or number to announce
   * @param {Window} window - Optional window object for speech synthesis
   */
  async speakCustomerNowServing(name, windowId) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const message = `Window ${windowId} is now serving customer ${name}.`
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.volume = 1 // 0 to 1
      utterance.rate = 1   // 0.1 to 10
      utterance.pitch = 1  // 0 to 2
      utterance.lang = 'en-GB' // Set accent here

      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.name.includes('Google UK English Male'))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      window.speechSynthesis.speak(utterance)
      console.log('Speaking:', message)
    } else {
      console.warn('Speech synthesis not supported in this browser.')
    }
  }
}

export default SoundNotification
