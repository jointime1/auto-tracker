declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

interface TelegramWebApp {
  ready(): void
  expand(): void
  close(): void
  isExpanded: boolean
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  BackButton: {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(cb: () => void): void
    offClick(cb: () => void): void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show(): void
    hide(): void
    onClick(cb: () => void): void
    offClick(cb: () => void): void
    setText(text: string): void
    enable(): void
    disable(): void
  }
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  showConfirm(message: string, callback: (confirmed: boolean) => void): void
  showAlert(message: string, callback?: () => void): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
}

function getTg(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null
}

export function useTelegram() {
  const tg = getTg()

  function haptic(type: 'success' | 'error' | 'warning') {
    tg?.HapticFeedback.notificationOccurred(type)
  }

  function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
    tg?.HapticFeedback.impactOccurred(style)
  }

  function hapticSelection() {
    tg?.HapticFeedback.selectionChanged()
  }

  function confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (tg) {
        tg.showConfirm(message, resolve)
      } else {
        resolve(window.confirm(message))
      }
    })
  }

  function alert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (tg) {
        tg.showAlert(message, resolve)
      } else {
        window.alert(message)
        resolve()
      }
    })
  }

  return {
    tg,
    haptic,
    hapticImpact,
    hapticSelection,
    confirm,
    alert,
  }
}

export function initTelegram() {
  const tg = getTg()
  if (!tg) return

  tg.ready()
  tg.expand()

  // Apply TG theme colors to CSS custom properties for Tailwind overrides
  document.documentElement.classList.add('tg-app')
  if (tg.colorScheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
}
