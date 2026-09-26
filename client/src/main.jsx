import React from 'react'
import ReactDOM from 'react-dom/client'
// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/mobile.scss'
import './config/api' // registers the axios auth interceptors
import store from './store/index'
import { installSessionExpiry } from './config/session'

installSessionExpiry(store) // a 401 on a token-carrying request logs the user out cleanly

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)