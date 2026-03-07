import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Polyfill window.storage pour usage local (remplace le storage de Claude)
window.storage = {
  _data: JSON.parse(localStorage.getItem('__afay__') || '{}'),
  _flush() { localStorage.setItem('__afay__', JSON.stringify(this._data)); },
  async get(key) { return this._data[key] ? { key, value: this._data[key] } : null; },
  async set(key, value) { this._data[key] = value; this._flush(); return { key, value }; },
  async delete(key) { delete this._data[key]; this._flush(); return { key, deleted: true }; },
  async list(prefix) {
    const keys = Object.keys(this._data).filter(k => !prefix || k.startsWith(prefix));
    return { keys };
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />)