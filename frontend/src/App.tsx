import { useCallback, useMemo, useState } from 'react'
import './App.css'

type PreviewItem = {
  id: string
  file: File
  url?: string
}

function App() {
  const [items, setItems] = useState<PreviewItem[]>([])
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responseJson, setResponseJson] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: PreviewItem[] = []
    Array.from(files).forEach((file) => {
      const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`
      const isImage = file.type.startsWith('image/')
      next.push({ id, file, url: isImage ? URL.createObjectURL(file) : undefined })
    })
    setItems((prev) => [...prev, ...next])
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }, [addFiles])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }, [addFiles])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const toRevoke = prev.find((p) => p.id === id)?.url
      if (toRevoke) URL.revokeObjectURL(toRevoke)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const canSubmit = useMemo(() => question.trim().length > 0, [question])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setResponseJson(null)
    try {
      const form = new FormData()
      form.append('question', question)
      items.forEach((item) => form.append('files', item.file))

      const res = await fetch('/api/ask', { method: 'POST', body: form })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed: ${res.status}`)
      }
      const json = await res.json()
      setResponseJson(json)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }, [items, question])

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Ask a question with context</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 20 }}>
        Upload files or images and provide a question. The app will send them to the backend API.
      </p>

      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
          Upload files or images
        </label>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{
            border: '2px dashed #bbb',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            marginBottom: 12,
            background: '#fafafa',
          }}
        >
          <div style={{ marginBottom: 12 }}>Drag & drop here, or choose files</div>
          <input
            type="file"
            multiple
            onChange={onFileInputChange}
            accept="image/*,.pdf,.txt,.md,.doc,.docx,.csv,.json"
          />
        </div>

        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {items.map((item) => (
              <div key={item.id} style={{ border: '1px solid #e1e1e1', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {item.url ? (
                  <img src={item.url} alt={item.file.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f3f3', borderRadius: 6 }}>
                    <span style={{ color: '#666', fontSize: 12 }}>{item.file.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }} title={item.file.name}>
                    {item.file.name}
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} style={{ fontSize: 12 }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Your question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Send to backend'}
          </button>
          <span style={{ color: '#888', fontSize: 12 }}>
            Max 10 files, 25 MB each
          </span>
        </div>
      </form>

      {errorMessage && (
        <div style={{ marginTop: 16, color: '#b00020' }}>{errorMessage}</div>
      )}

      {responseJson && (
        <div style={{ marginTop: 24 }}>
          <h3>Response</h3>
          <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default App
