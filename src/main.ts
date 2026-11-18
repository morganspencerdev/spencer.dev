const darkModeToggle = document.getElementById(
  'dark-mode',
) as HTMLInputElement | null

if (darkModeToggle) {
  const dark = localStorage.getItem('dark')

  darkModeToggle.checked = dark
    ? dark === 'true'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
}

const siteHeader = document.querySelector('header:not(main header)')
const siteFooter = document.querySelector('footer:not(main footer)')

siteHeader?.addEventListener('focusin', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
siteFooter?.addEventListener('focusin', () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth',
  })
})

const url = new URL(window.location.href)

const CUSTOM_THEME_KEY = 'theme'

if (url.searchParams.has(CUSTOM_THEME_KEY)) {
  const theme = url.searchParams.get(CUSTOM_THEME_KEY)

  if (theme) localStorage.setItem(CUSTOM_THEME_KEY, theme)

  url.searchParams.delete(CUSTOM_THEME_KEY)
  history.replaceState(history.state, '', url)
}

const customTheme = localStorage.getItem(CUSTOM_THEME_KEY)

if (customTheme) document.documentElement.dataset.theme = customTheme
