import './style.css'
import { renderAppShell } from './ui/appShell'
import { bindCallUi } from './ui/call'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Missing #app root')
}

renderAppShell(app)
bindCallUi()
