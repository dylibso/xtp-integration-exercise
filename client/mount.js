import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import App from './App.jsx'

fetch("/login", {
  method: "POST",
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nick: "me"
  })
}).then(console.log)

const root = createRoot(document.getElementById('root'))
root.render(createElement(App))
