import './elements/theme-picker'

window.addEventListener('hashchange', () => {
  ;(document.getElementById('menu-drawer') as HTMLDialogElement)?.close?.()
})
