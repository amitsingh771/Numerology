"use client"
import React from 'react'
import Link from 'next/link'

const Header = () => {
  return (
    <header style={{
      borderBottom: '2px solid var(--primary)',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: 'var(--background)'
    }}>
      <Link href="/" style={{ fontWeight: 800, color: 'var(--primary)' }}>Numerology App</Link>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/" style={{ color: 'var(--foreground)' }}>Home</Link>
        <Link href="/about" style={{ color: 'var(--foreground)' }}>About</Link>
      </nav>
    </header>
  )
}

export default Header