import React from 'react'

const Footer = () => {
  return (
    <footer style={{
      borderTop: '2px solid var(--accent)',
      padding: '1rem',
      textAlign: 'center',
      background: 'rgba(245, 158, 11, 0.06)'
    }}>
      <small style={{ color: 'var(--muted)' }}>&copy; {new Date().getFullYear()} Numerology App. All rights reserved.</small>
    </footer>
  )
}

export default Footer