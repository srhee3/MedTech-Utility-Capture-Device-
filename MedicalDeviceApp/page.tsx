'use client'

import { useState, useRef, useCallback } from 'react'

interface DeviceIdentification {
  deviceName: string
  manufacturer: string
  modelNumber: string
  deviceType: string
  description: string
  confidence: 'High' | 'Medium' | 'Low'
  confidenceReason: string
  commonIssues: string[]
  troubleshootingSteps: string[]
  alarmCodes: string
  ifuNote: string
}

type AppState = 'idle' | 'loading' | 'result' | 'error'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [identification, setIdentification] = useState<DeviceIdentification | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file.')
      setAppState('error')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setAppState('loading')
    setIdentification(null)
    setErrorMsg('')

    // Convert to base64 for API
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Unknown error')
      }

      setIdentification(data.identification)
      setAppState('result')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to identify device.')
      setAppState('error')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const reset = () => {
    setAppState('idle')
    setImagePreview(null)
    setIdentification(null)
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confidenceBadge = (c: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      High: { bg: '#E6F4F1', color: '#0A6E5C' },
      Medium: { bg: '#FEF3C7', color: '#B45309' },
      Low: { bg: '#FEE2E2', color: '#B91C1C' },
    }
    return map[c] || map.Low
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            background: 'var(--accent)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>DeviceIQ</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            padding: '1px 6px',
            marginLeft: 2,
          }}>BETA</span>
        </div>
        {appState === 'result' && (
          <button onClick={reset} style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '5px 12px',
            cursor: 'pointer',
          }}>
            ← New scan
          </button>
        )}
      </header>

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 680, margin: '0 auto', width: '100%' }}>

        {/* IDLE / UPLOAD STATE */}
        {(appState === 'idle' || appState === 'error') && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Identify any medical device
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Take a photo or upload an image. Get instant identification and troubleshooting guidance.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                borderRadius: 8,
                background: dragOver ? 'var(--accent-light)' : 'var(--surface)',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: 16,
              }}
            >
              <div style={{
                width: 48, height: 48,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
                Drop image here or click to upload
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                JPG, PNG, HEIC — on mobile, this opens your camera directly
              </p>
            </div>

            {/* Camera button (mobile-friendly) */}
            <label htmlFor="camera-input" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              fontFamily: 'var(--font-sans)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Take Photo
            </label>
            <input
              id="camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {appState === 'error' && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'var(--danger-light)',
                border: '1px solid #FCA5A5',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--danger)',
              }}>
                {errorMsg}
              </div>
            )}

            {/* How it works */}
            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { n: '01', label: 'Point & shoot', desc: 'Photo of any medical device' },
                { n: '02', label: 'AI identifies', desc: 'Name, manufacturer, model' },
                { n: '03', label: 'Get guidance', desc: 'Issues & troubleshooting steps' },
              ].map(step => (
                <div key={step.n} style={{
                  padding: '16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--accent)',
                    marginBottom: 6,
                  }}>{step.n}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LOADING STATE */}
        {appState === 'loading' && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            {imagePreview && (
              <div style={{ marginBottom: 24, position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="Device"
                  style={{
                    maxWidth: 240,
                    maxHeight: 240,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    display: 'block',
                    filter: 'brightness(0.85)',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 40, height: 40,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
              </div>
            )}
            <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Analyzing device...</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Consulting IFU database</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* RESULT STATE */}
        {appState === 'result' && identification && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Device identity card */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Device"
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 3 }}>
                    {identification.deviceName}
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {identification.manufacturer}
                    {identification.modelNumber !== 'Not visible' && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginLeft: 8, color: 'var(--text-tertiary)' }}>
                        {identification.modelNumber}
                      </span>
                    )}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      padding: '3px 8px',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      borderRadius: 3,
                    }}>
                      {identification.deviceType}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      padding: '3px 8px',
                      background: confidenceBadge(identification.confidence).bg,
                      color: confidenceBadge(identification.confidence).color,
                      borderRadius: 3,
                    }}>
                      {identification.confidence} confidence
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {identification.description}
                </p>
                {identification.confidenceReason && (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, fontStyle: 'italic' }}>
                    {identification.confidenceReason}
                  </p>
                )}
              </div>
            </div>

            {/* Troubleshooting steps */}
            <Section title="Troubleshooting steps" icon="🔧" accent>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {identification.troubleshootingSteps.map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      flexShrink: 0,
                      width: 22, height: 22,
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '50%',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.6, paddingTop: 2 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Common issues */}
            <Section title="Common issues" icon="⚠️">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {identification.commonIssues.map((issue, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--warning)', marginTop: 3, flexShrink: 0 }}>—</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Alarm codes */}
            {identification.alarmCodes && (
              <Section title="Alarm & error codes" icon="🔔">
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                  {identification.alarmCodes}
                </p>
              </Section>
            )}

            {/* IFU note */}
            {identification.ifuNote && (
              <div style={{
                padding: '14px 16px',
                background: 'var(--accent-light)',
                border: '1px solid #A7D7CE',
                borderLeft: '3px solid var(--accent)',
                borderRadius: '0 6px 6px 0',
                fontSize: 13,
                color: '#0A4A3E',
                lineHeight: 1.65,
              }}>
                <strong style={{ fontWeight: 600 }}>IFU note: </strong>
                {identification.ifuNote}
              </div>
            )}

            {/* IFU database placeholder */}
            <div style={{
              padding: '16px',
              border: '1px dashed var(--border-strong)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Full IFU — coming in v2</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Device-specific manual, searchable by symptom or error code
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6, textAlign: 'center', paddingTop: 4 }}>
              AI-generated guidance only. Always consult the official device IFU and qualified clinical engineering before servicing equipment.
            </p>

          </div>
        )}
      </main>
    </div>
  )
}

// Reusable section component
function Section({ title, icon, children, accent }: {
  title: string
  icon: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? '#A7D7CE' : 'var(--border)'}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: accent ? 'var(--accent-light)' : 'var(--surface-2)',
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        {children}
      </div>
    </div>
  )
}
