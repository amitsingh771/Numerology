import React from 'react'
import Form from '../components/Form'

export default function Home() {
  return (
    <div className="container">
      <div className="card glass" style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>
          Generate Your Numerology Report
        </h1>
        <p style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>
          Enter your details to open a personalized PDF in a new tab.
        </p>
        <Form />
      </div>
    </div>
  )
}
