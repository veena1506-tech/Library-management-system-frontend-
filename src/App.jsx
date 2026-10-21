import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Search, Plus, Pencil, Trash2, LibraryBig, Layers3, Users, BookMarked, X, RefreshCw } from 'lucide-react'

const API = 'http://localhost:8080/api/books'
const blank = { title: '', author: '', isbn: '', category: 'General', quantity: 1 }

export default function App() {
  const [books, setBooks] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadBooks() {
    setLoading(true); setError('')
    try {
      const response = await fetch(API)
      if (!response.ok) throw new Error('Could not load books. Is the Spring Boot backend running?')
      setBooks(await response.json())
    } catch (e) { setError(e.message || 'Unable to connect to backend.') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadBooks() }, [])

  const categories = useMemo(() => ['All categories', ...new Set(books.map(b => b.category).filter(Boolean))], [books])
  const filtered = useMemo(() => books.filter(b => {
    const text = `${b.title} ${b.author} ${b.isbn} ${b.category}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (category === 'All categories' || b.category === category)
  }), [books, query, category])
  const totalCopies = books.reduce((sum, b) => sum + Number(b.quantity || 0), 0)
  const availableTitles = books.filter(b => b.quantity > 0).length

  function openAdd() { setEditing(null); setForm(blank); setModal(true) }
  function openEdit(book) {
    setEditing(book.id)
    setForm({ title: book.title || '', author: book.author || '', isbn: book.isbn || '', category: book.category || 'General', quantity: book.quantity ?? 0 })
    setModal(true)
  }
  async function saveBook(e) {
    e.preventDefault(); setError('')
    const payload = { ...form, quantity: Number(form.quantity) }
    try {
      const response = await fetch(editing ? `${API}/${editing}` : API, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const body = await response.text()
        throw new Error(body.includes('Title and author') ? 'Enter a title and author, and use a non-negative quantity.' : 'Could not save book. Please check the backend.')
      }
      setModal(false); await loadBooks()
    } catch (e) { setError(e.message || 'Unable to save book.') }
  }
  async function removeBook(book) {
    if (!window.confirm(`Delete “${book.title}”?`)) return
    try {
      const response = await fetch(`${API}/${book.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete book.')
      await loadBooks()
    } catch (e) { setError(e.message) }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><LibraryBig size={22}/></div><div><strong>folio<span>.</span></strong><small>LIBRARY DESK</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <div className="nav-item active"><BookOpen size={18}/> <span>Book collection</span><span className="nav-count">{books.length}</span></div>
      <div className="nav-item muted"><Users size={18}/> <span>Members</span><span className="soon">SOON</span></div>
      <div className="nav-item muted"><BookMarked size={18}/> <span>Borrowing</span><span className="soon">SOON</span></div>
      <div className="sidebar-bottom"><div className="help-icon">i</div><div><b>Library Desk</b><p>Simple tools for<br/>a thoughtful library.</p></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Book collection</b></div><div className="status"><span className="status-dot"/> API workspace</div></header>
      <section className="welcome"><div><div className="eyebrow">YOUR LIBRARY, AT A GLANCE</div><h1>Book collection<span>.</span></h1><p>Keep your shelves organised and your next great read within reach.</p></div><button className="primary-btn" onClick={openAdd}><Plus size={17}/> Add a book</button></section>

      <section className="stats">
        <div className="stat-card"><div className="stat-icon lavender"><BookOpen size={19}/></div><div className="stat-caption">Unique titles</div><div className="stat-value">{books.length}</div><div className="stat-note">Books in your catalogue</div></div>
        <div className="stat-card"><div className="stat-icon peach"><Layers3 size={19}/></div><div className="stat-caption">Total copies</div><div className="stat-value">{totalCopies}</div><div className="stat-note">Across all titles</div></div>
        <div className="stat-card"><div className="stat-icon mint"><BookMarked size={19}/></div><div className="stat-caption">In stock</div><div className="stat-value">{availableTitles}</div><div className="stat-note">Titles with available copies</div></div>
      </section>

      <section className="collection-panel">
        <div className="panel-heading"><div><h2>All books</h2><p>Manage and search your catalogue</p></div><button className="icon-btn" title="Refresh books" onClick={loadBooks}><RefreshCw size={16}/></button></div>
        <div className="filters"><div className="search-box"><Search size={17}/><input aria-label="Search books" placeholder="Search title, author, ISBN..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="clear-search" onClick={() => setQuery('')}><X size={14}/></button>}</div><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter category">{categories.map(c => <option key={c}>{c}</option>)}</select><span className="result-count">{filtered.length} results</span></div>
        {error && <div className="error-banner">{error} <button onClick={() => setError('')}><X size={14}/></button></div>}
        <div className="table-wrap"><table><thead><tr><th>BOOK DETAILS</th><th>ISBN</th><th>CATEGORY</th><th>QUANTITY</th><th className="right">ACTIONS</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="5" className="empty"><span className="spinner"/> Loading your collection...</td></tr> :
          filtered.length === 0 ? <tr><td colSpan="5" className="empty"><div className="empty-icon"><BookOpen size={23}/></div><b>{books.length ? 'No matching books' : 'Your shelves are waiting'}</b><span>{books.length ? 'Try another search or category.' : 'Add your first book to get started.'}</span>{!books.length && <button className="primary-btn small" onClick={openAdd}><Plus size={15}/> Add a book</button>}</td></tr> :
          filtered.map(book => <tr key={book.id}><td><div className="book-detail"><div className="book-cover"><BookOpen size={19}/></div><div><b>{book.title}</b><span>{book.author}</span></div></div></td><td className="isbn">{book.isbn || '—'}</td><td><span className="category-pill">{book.category || 'General'}</span></td><td><span className={`quantity ${book.quantity === 0 ? 'out' : ''}`}><span/> {book.quantity} {book.quantity === 1 ? 'copy' : 'copies'}</span></td><td><div className="actions"><button className="action-btn" title="Edit book" onClick={() => openEdit(book)}><Pencil size={15}/></button><button className="action-btn delete" title="Delete book" onClick={() => removeBook(book)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table></div>
        <div className="table-footer"><span>Showing <b>{filtered.length}</b> of <b>{books.length}</b> titles</span><span className="footer-live"><span/> Live API data</span></div>
      </section>
      <footer>Made for curious minds <span>✳</span> <span className="footer-right">FOLIO LIBRARY DESK · DEMO PROJECT</span></footer>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}><section className="modal"><div className="modal-head"><div><div className="eyebrow">{editing ? 'UPDATE YOUR CATALOGUE' : 'GROW YOUR COLLECTION'}</div><h2>{editing ? 'Edit book' : 'Add a new book'}</h2></div><button className="icon-btn" onClick={() => setModal(false)}><X size={18}/></button></div><form onSubmit={saveBook}><label>Book title *<input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Atomic Habits"/></label><label>Author *<input required value={form.author} onChange={e => setForm({...form,author:e.target.value})} placeholder="e.g. James Clear"/></label><div className="form-row"><label>ISBN<input value={form.isbn} onChange={e => setForm({...form,isbn:e.target.value})} placeholder="ISBN number"/></label><label>Category<input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="e.g. Fiction"/></label></div><label>Quantity *<input type="number" min="0" required value={form.quantity} onChange={e => setForm({...form,quantity:e.target.value})}/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(false)}>Cancel</button><button className="primary-btn" type="submit">{editing ? 'Save changes' : <><Plus size={16}/> Add book</>}</button></div></form></section></div>}
  </div>
}
