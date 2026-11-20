const url = new URL(window.location.href)

// DARK MODE

const darkModeToggle = document.querySelector<HTMLInputElement>('#dark-mode')

if (darkModeToggle) {
  const savedPreference = localStorage.getItem('dark')

  darkModeToggle.checked =
    savedPreference === null
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : savedPreference === 'true'

  darkModeToggle.addEventListener('change', () => {
    localStorage.setItem('dark', String(darkModeToggle.checked))
  })
}

// LAYOUT

const main = document.querySelector('main')
const layoutOptions =
  document.querySelector<HTMLFieldSetElement>('#layout-options')

function loadLayout(name: string): boolean {
  const template = document.querySelector<HTMLTemplateElement>(
    `template[data-layout="${CSS.escape(name)}"]`,
  )

  if (!main || !template) return false

  main.replaceChildren(template.content.cloneNode(true))
  main.dataset.layout = name

  return true
}

const requestedLayout =
  url.searchParams.get('layout') ??
  localStorage.getItem('layout') ??
  'editorial'

const layout = loadLayout(requestedLayout) ? requestedLayout : 'editorial'

if (layout !== requestedLayout) loadLayout(layout)

const selectedRadio = layoutOptions?.querySelector<HTMLInputElement>(
  `input[type="radio"][value="${CSS.escape(layout)}"]`,
)

if (selectedRadio) selectedRadio.checked = true

layoutOptions?.addEventListener('change', (event) => {
  const target = event.target

  if (!(target instanceof HTMLInputElement) || target.type !== 'radio') {
    return
  }

  if (!loadLayout(target.value)) return

  main?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  localStorage.setItem('layout', target.value)
})

// CUSTOM THEME

const themeParam = url.searchParams.get('theme')

if (themeParam !== null) {
  if (themeParam) localStorage.setItem('theme', themeParam)

  url.searchParams.delete('theme')
  history.replaceState(history.state, '', url)
}

const theme = localStorage.getItem('theme')

if (theme) document.documentElement.dataset.theme = theme

// HEADER / FOOTER FOCUS

document
  .querySelector('header:not(main header)')
  ?.addEventListener('focusin', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

document
  .querySelector('footer:not(main footer)')
  ?.addEventListener('focusin', () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })
  })
