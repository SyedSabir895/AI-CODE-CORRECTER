import { useEffect, useState } from 'react'
import { api, errorMessage } from './api'

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function History({ refreshKey, activeId, onOpen, onDeleted, onClose }) {
  const [ items, setItems ] = useState([])
  const [ page, setPage ] = useState(1)
  const [ hasMore, setHasMore ] = useState(false)
  const [ loading, setLoading ] = useState(true)
  const [ error, setError ] = useState('')

  async function load(pageToLoad) {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/reviews', { params: { page: pageToLoad } })
      setItems(prev => pageToLoad === 1 ? data.reviews : [ ...prev, ...data.reviews ])
      setPage(pageToLoad)
      setHasMore(data.hasMore)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [ refreshKey ])

  async function remove(event, id) {
    event.stopPropagation()
    if (!window.confirm('Delete this review from your history?')) return
    try {
      await api.delete(`/reviews/${id}`)
      setItems(prev => prev.filter(item => item.id !== id))
      onDeleted(id)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <aside className="history">
      <div className="history-header">
        <h2>Past reviews</h2>
        <button className="icon" onClick={onClose} aria-label="Close history">×</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="history-empty">No saved reviews yet. Run a review and it will show up here.</p>
      )}

      <ul>
        {items.map(item => (
          <li
            key={item.id}
            className={item.id === activeId ? 'active' : ''}
            onClick={() => onOpen(item.id)}>
            <div className="history-text">
              <span className="history-title">{item.title}</span>
              <span className="history-date">{formatDate(item.createdAt)}</span>
            </div>
            <button className="icon" onClick={e => remove(e, item.id)} aria-label="Delete review">🗑</button>
          </li>
        ))}
      </ul>

      {loading && <p className="history-empty">Loading...</p>}
      {hasMore && !loading && (
        <button className="link" onClick={() => load(page + 1)}>Load more</button>
      )}
    </aside>
  )
}

export default History
