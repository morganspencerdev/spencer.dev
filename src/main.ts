import './elements/theme-picker'

document.getElementById('menu-drawer')?.addEventListener('click', (e) => {
  if (!(e.target instanceof HTMLElement) || !e.target.closest('a')) return
  ;(document.getElementById('menu-drawer') as HTMLDialogElement)?.close?.()
})
