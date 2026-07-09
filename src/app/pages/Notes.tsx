import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save, StickyNote } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const noteColors = [
    { name: 'Yellow', value: 'bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-50' },
    { name: 'Pink', value: 'bg-pink-100 dark:bg-pink-900/40 dark:text-pink-50' },
    { name: 'Blue', value: 'bg-blue-100 dark:bg-blue-900/40 dark:text-blue-50' },
    { name: 'Green', value: 'bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-50' },
    { name: 'Purple', value: 'bg-purple-100 dark:bg-purple-900/40 dark:text-purple-50' },
    { name: 'Orange', value: 'bg-orange-100 dark:bg-orange-900/40 dark:text-orange-50' },
  ];

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      color: noteColors[0].value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingNote(newNote);
    setIsCreating(true);
  };

  const saveNote = () => {
    if (!editingNote) return;

    if (isCreating) {
      setNotes([editingNote, ...notes]);
    } else {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...editingNote, updatedAt: new Date().toISOString() } : n));
    }

    setEditingNote(null);
    setIsCreating(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const startEditing = (note: Note) => {
    setEditingNote({ ...note });
    setIsCreating(false);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setIsCreating(false);
  };

  if (editingNote) {
    return (
      <div className="page-shell max-w-2xl mx-auto">
        <div className="page-header mb-2">
          <h1 className="page-title">{isCreating ? 'New Note' : 'Edit Note'}</h1>
          <button
            onClick={cancelEditing}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close editor"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="settings-card">
          <input
            type="text"
            placeholder="Note Title"
            value={editingNote.title}
            onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
            className="w-full text-xl mb-4 px-3 py-2 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />

          <textarea
            placeholder="Start typing..."
            value={editingNote.content}
            onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
            className="w-full h-80 px-3 py-2 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 bg-input-background text-foreground placeholder:text-muted-foreground"
          />

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Note Color</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {noteColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                  aria-label={`Select ${color.name} color`}
                  className={`w-10 h-10 rounded-lg border-2 ${color.value} ${
                    editingNote.color === color.value
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border'
                  }`}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveNote}
            disabled={!editingNote.title.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors font-medium"
          >
            <Save className="size-5" />
            Save Note
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Notes</h1>
        <button
          onClick={createNote}
          className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Add new note"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="settings-card text-center py-12">
          <StickyNote className="size-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No notes yet</p>
          <button
            onClick={createNote}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Create Your First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`rounded-xl p-4 shadow-md min-h-40 flex flex-col border border-border/50 ${note.color}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg flex-1 break-words">{note.title || 'Untitled'}</h3>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => startEditing(note)}
                    className="p-1.5 hover:bg-black/10 rounded"
                    aria-label="Edit note"
                  >
                    <Edit2 className="size-4" />
                    <span className="sr-only">Edit note</span>
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 hover:bg-black/10 rounded text-red-600"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete note</span>
                  </button>
                </div>
              </div>
              <p className="text-sm flex-1 line-clamp-6 whitespace-pre-wrap break-words">
                {note.content}
              </p>
              <p className="text-xs opacity-60 mt-2">
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
