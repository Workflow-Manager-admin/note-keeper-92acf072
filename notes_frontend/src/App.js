import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Modern, minimal full-feature UI for Notes CRUD app.
 * Implements a sidebar for note list, responsive main area for note editing/creation,
 * inline edit, delete, and add actions, and uses project color/theme guidelines.
 */
// PUBLIC_INTERFACE
function App() {
  // Theming (still available)
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Notes app state
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For note creation/editing forms
  const [isCreating, setIsCreating] = useState(false);
  const [editModeId, setEditModeId] = useState(null); // null | note id
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

  // PUBLIC_INTERFACE
  const fetchNotes = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/notes`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'API Error');
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const createNote = async (noteData) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      if (!res.ok) throw new Error('Failed to create note');
      const newNote = await res.json();
      setNotes(curr => [...curr, newNote]);
      setSelectedNoteId(newNote.id);
      return newNote;
    } catch (err) {
      setError(err.message || 'API Error');
    }
  };

  // PUBLIC_INTERFACE
  const updateNote = async (noteId, noteData) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updatedNote = await res.json();
      setNotes(curr => curr.map(n => n.id === noteId ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      setError(err.message || 'API Error');
    }
  };

  // PUBLIC_INTERFACE
  const deleteNote = async (noteId) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete note');
      setNotes(curr => curr.filter(n => n.id !== noteId));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
      if (editModeId === noteId) setEditModeId(null);
    } catch (err) {
      setError(err.message || 'API Error');
    }
  };

  // Select & populate edit form OR open blank for create
  const startEdit = (note) => {
    setEditModeId(note.id);
    setIsCreating(false);
    setFormTitle(note.title);
    setFormContent(note.content);
  };
  const startCreate = () => {
    setIsCreating(true);
    setEditModeId(null);
    setFormTitle('');
    setFormContent('');
    setSelectedNoteId(null);
  };
  // Cancel form
  const cancelForm = () => {
    setIsCreating(false);
    setEditModeId(null);
    setFormTitle('');
    setFormContent('');
  };

  // Submit form for create or update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if ((isCreating && (!formTitle.trim() || !formContent.trim())) ||
        (editModeId && (!formTitle.trim() || !formContent.trim()))) {
      setError('Title and content required');
      return;
    }
    setError(null);
    if (isCreating) {
      await createNote({ title: formTitle, content: formContent });
      setIsCreating(false);
      setFormTitle('');
      setFormContent('');
      await fetchNotes();
    } else if (editModeId) {
      await updateNote(editModeId, { title: formTitle, content: formContent });
      setEditModeId(null);
      setFormTitle('');
      setFormContent('');
      await fetchNotes();
    }
  };

  // Set current selection and exit edit/create
  const handleSelectNote = (noteId) => {
    setSelectedNoteId(noteId);
    setIsCreating(false);
    setEditModeId(null);
    setFormTitle('');
    setFormContent('');
  };

  useEffect(() => { fetchNotes(); }, []);

  // Sidebar: Note List
  const NotesSidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="app-title">📝 Notes</span>
        <button className="btn-accent" onClick={startCreate}>+ New</button>
      </div>
      <nav className="note-list">
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>
        ) : (notes.length === 0 ? (
          <div className="no-notes">No notes yet.</div>
        ) : (
          notes
            .slice() // Defensive: avoid mutation
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map(note => (
              <div
                key={note.id}
                className={`note-list-item${note.id === selectedNoteId ? ' selected' : ''}`}
                onClick={() => handleSelectNote(note.id)}
              >
                <div className="note-title">{note.title || <em>(Untitled)</em>}</div>
                <div className="note-meta">
                  <span className="note-date">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    className="btn-minimal"
                    title="Edit"
                    onClick={e => { e.stopPropagation(); startEdit(note); }}>
                    ✏️
                  </button>
                  <button
                    className="btn-minimal"
                    title="Delete"
                    onClick={e => { e.stopPropagation(); deleteNote(note.id); }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))
        ))}
      </nav>
    </aside>
  );

  // Main content: Note details and edit/create forms
  const MainPanel = () => {
    // Create/edit form takes priority
    if (isCreating || editModeId) {
      return (
        <section className="main-panel">
          <h2>{isCreating ? "Create New Note" : "Edit Note"}</h2>
          <form className="note-form" onSubmit={handleFormSubmit}>
            <input
              type="text"
              className="input-title"
              placeholder="Title"
              maxLength={80}
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="input-content"
              placeholder="Content..."
              rows={10}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn-primary" type="submit">
                {isCreating ? "Add Note" : "Save"}
              </button>
              <button className="btn-minimal" type="button" onClick={cancelForm}>Cancel</button>
            </div>
          </form>
        </section>
      );
    }

    // Selected note detail (read-only display)
    if (selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (!note) return <div style={{ padding: 32 }}>Note not found.</div>;
      return (
        <section className="main-panel">
          <h2 style={{ marginBottom: 16 }}>{note.title || <em>(Untitled)</em>}</h2>
          <div className="note-content">{note.content}</div>
          <div className="note-meta-row">
            <span>Created: {new Date(note.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(note.updated_at).toLocaleString()}</span>
          </div>
          <div style={{ marginTop: 24 }}>
            <button className="btn-accent" onClick={() => startEdit(note)}>
              Edit
            </button>
            <button
              className="btn-minimal"
              style={{ marginLeft: 10 }}
              onClick={() => deleteNote(note.id)}
            >
              Delete
            </button>
          </div>
        </section>
      );
    }

    // Prompt to select or create
    return (
      <section className="main-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--text-secondary)", opacity: 0.75 }}>
        <h2>Welcome to Notes</h2>
        <p>Select a note from the left or <button className="inline-link" onClick={startCreate}>add a new note</button>.</p>
      </section>
    );
  };

  // Error banner (top overlay)
  const ErrorBanner = () =>
    error ? (
      <div className="error-banner">{error}</div>
    ) : null;

  // Theme toggle button (fixed)
  const ThemeToggle = () =>
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>;

  // Layout grid
  return (
    <div className="App app-grid">
      <ThemeToggle />
      <ErrorBanner />
      <NotesSidebar />
      <MainPanel />
    </div>
  );
}

export default App;
