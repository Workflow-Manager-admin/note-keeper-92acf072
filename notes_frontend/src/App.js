import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

/**
 * App component for Notes Frontend.
 * Manages notes state, selection, and CRUD API integration.
 */
// PUBLIC_INTERFACE
function App() {
  // Theming
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Notes application state
  const [notes, setNotes] = useState([]); // All notes
  const [selectedNoteId, setSelectedNoteId] = useState(null); // Currently selected note id
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Backend API base (define your backend host as needed, here localhost is used)
  // You might need to proxy this in development or configure .env accordingly.
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

  // API: Fetch all notes
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

  // API: Create a new note (expects {title, content}), returns created note
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

  // API: Update existing note by id (expects {title, content})
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

  // API: Delete note by id
  // PUBLIC_INTERFACE
  const deleteNote = async (noteId) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete note');
      setNotes(curr => curr.filter(n => n.id !== noteId));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
    } catch (err) {
      setError(err.message || 'API Error');
    }
  };

  // Pull notes on first load
  useEffect(() => { fetchNotes(); }, []);

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Notes Application (CRUD Demo)</h2>
        {/* Loading/Error banner */}
        {loading && <div>Loading notes...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        <p>
          Current theme: <strong>{theme}</strong>
        </p>

        {/* Notes List */}
        <div style={{ margin: "24px auto", maxWidth: "600px" }}>
          <h3>Notes List</h3>
          {notes.length === 0 && !loading ? (
            <div>No notes yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {notes.map(note => (
                <li key={note.id}
                    style={{
                      background: note.id === selectedNoteId ? '#e2e8f0' : '#fff',
                      margin: "8px 0", border: "1px solid #eee", borderRadius: 6, padding: 12, cursor: "pointer"
                    }}
                    onClick={() => setSelectedNoteId(note.id)}
                >
                  <b>{note.title}</b>
                  <br />
                  <small>Created: {new Date(note.created_at).toLocaleString()}</small>
                  <br />
                  {note.id === selectedNoteId && (
                    <span>
                      <button
                        style={{ marginRight: 8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}>Delete</button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected Note Details (placeholder) */}
        {selectedNoteId && (
          <div style={{ margin: "16px auto", maxWidth: "600px", textAlign: "left" }}>
            <h3>Selected Note</h3>
            {(() => {
              const note = notes.find(n => n.id === selectedNoteId);
              if (!note) return <div>Note not found.</div>;
              return (
                <div>
                  <b>Title:</b> {note.title}
                  <br />
                  <b>Content:</b> {note.content}
                  <br />
                  <b>Created:</b> {new Date(note.created_at).toLocaleString()}
                  <br />
                  <b>Updated:</b> {new Date(note.updated_at).toLocaleString()}
                  {/* Future: Add form for edit here */}
                </div>
              );
            })()}
          </div>
        )}

        {/* Placeholder for add/edit forms */}
        {/* Implement note creation/update forms in future steps for full CRUD UI */}
      </header>
    </div>
  );
}

export default App;
