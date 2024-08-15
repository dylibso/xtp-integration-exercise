import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))
root.render(createElement(App))
