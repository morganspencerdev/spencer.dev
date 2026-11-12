const COLOR_SCHEME_KEY = 'colorScheme'
const CUSTOM_THEME_KEY = 'theme'

class ThemePickerElement extends HTMLElement {
  #switch: HTMLInputElement | null = null

  connectedCallback() {
    this.#switch = this.querySelector('input[type="checkbox"]')
    if (!this.#switch) return

    const url = new URL(window.location.href)

    if (url.searchParams.has(CUSTOM_THEME_KEY)) {
      const theme = url.searchParams.get(CUSTOM_THEME_KEY)

      if (theme) localStorage.setItem(CUSTOM_THEME_KEY, theme)

      url.searchParams.delete(CUSTOM_THEME_KEY)
      history.replaceState(history.state, '', url)
    }

    const customTheme = localStorage.getItem(CUSTOM_THEME_KEY)

    if (customTheme) document.documentElement.dataset.theme = customTheme

    const savedColorScheme = localStorage.getItem(COLOR_SCHEME_KEY)
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches

    this.#switch.checked =
      savedColorScheme === 'dark' || (savedColorScheme === null && prefersDark)

    this.#switch.addEventListener('change', this.#onSwitchChange)
  }

  disconnectedCallback() {
    this.#switch?.removeEventListener('change', this.#onSwitchChange)
  }

  #onSwitchChange = () => {
    localStorage.setItem(
      COLOR_SCHEME_KEY,
      this.#switch?.checked ? 'dark' : 'light',
    )
  }
}

customElements.define('theme-picker', ThemePickerElement)
