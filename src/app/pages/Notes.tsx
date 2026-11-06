import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, StickyNote, Search } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

function loadNotes(): Note[] {
  try {
    const saved = localStorage.getItem("notes");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("notes", JSON.stringify(notes));
    } catch {
      toast.error("Couldn't save note", { description: "Storage is full or unavailable." });
    }
  }, [notes]);

  const noteColors = [
    { name: "Lemon yellow", value: "bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-50" },
    { name: "Blush pink", value: "bg-pink-100 dark:bg-pink-900/40 dark:text-pink-50" },
    { name: "Sky blue", value: "bg-blue-100 dark:bg-blue-900/40 dark:text-blue-50" },
    { name: "Mint green", value: "bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-50" },
    { name: "Lavender", value: "bg-purple-100 dark:bg-purple-900/40 dark:text-purple-50" },
    { name: "Tangerine", value: "bg-orange-100 dark:bg-orange-900/40 dark:text-orange-50" },
  ];

  const createNote = () => {
    setEditingNote({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: "",
      content: "",
      color: noteColors[0].value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsCreating(true);
  };

  const saveNote = () => {
    if (!editingNote) return;
    if (!editingNote.title.trim() && !editingNote.content.trim()) {
      toast.error("Write something first", { description: "Add a title or some notes before saving." });
      return;
    }
    if (isCreating) {
      setNotes([editingNote, ...notes]);
      toast.success("Note saved ✏️");
    } else {
      setNotes(notes.map((n) => (n.id === editingNote.id ? { ...editingNote, updatedAt: new Date().toISOString() } : n)));
      toast.success("Note updated ✓");
    }
    setEditingNote(null);
    setIsCreating(false);
  };

  const deleteNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    setNotes(notes.filter((n) => n.id !== id));
    toast.error("Note deleted", {
      description: note ? `"${note.title || "Untitled"}" removed.` : undefined,
      action: { label: "Undo", onClick: () => note && setNotes((prev) => [note, ...prev]) },
    });
  };

  const startEditing = (note: Note) => {
    setEditingNote({ ...note });
    setIsCreating(false);
  };

  const cancelEditing = () => {
    if (!editingNote) return;
    const dirty = isCreating
      ? !!editingNote.title.trim() || !!editingNote.content.trim()
      : (() => {
          const orig = notes.find((n) => n.id === editingNote.id);
          return !!orig && (orig.title !== editingNote.title || orig.content !== editingNote.content);
        })();
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setEditingNote(null);
    setIsCreating(false);
  };

  const filtered = notes.filter((n) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  if (editingNote) {
    return (
      <main className="page-shell max-w-2xl mx-auto" aria-label={isCreating ? "New note" : "Edit note"}>
        <div className="page-head mb-2">
          <div>
            <p className="page-subtitle mb-0.5">{isCreating ? "Fresh page ✨" : "Tidy it up"}</p>
            <h1 className="page-title">{isCreating ? "New note" : "Edit note"}</h1>
          </div>
          <button
            type="button"
            onClick={cancelEditing}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close editor without saving"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          className="settings-card"
          onSubmit={(e) => {
            e.preventDefault();
            saveNote();
          }}
        >
          <label htmlFor="note-title" className="text-sm font-semibold block mb-1">Title</label>
          <input
            id="note-title"
            type="text"
            placeholder="Give it a catchy title (optional)"
            value={editingNote.title}
            onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
            className="w-full text-xl mb-4 px-3 py-2 border-b-2 border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />

          <label htmlFor="note-content" className="text-sm font-semibold block mb-1">Note</label>
          <textarea
            id="note-content"
            placeholder="Start typing… ideas, lists, dreams ✨"
            value={editingNote.content}
            onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
            className="w-full min-h-64 px-3 py-2 border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-ring/50 bg-input-background text-foreground placeholder:text-muted-foreground"
          />

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold mb-2">Note color</legend>
            <div className="flex gap-2 mb-4 flex-wrap" role="radiogroup" aria-label="Note color">
              {noteColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                  aria-label={`Select ${color.name}`}
                  aria-pressed={editingNote.color === color.value}
                  className={`w-11 h-11 rounded-xl border-2 ${color.value} ${
                    editingNote.color === color.value ? "border-primary ring-2 ring-primary/30 scale-105" : "border-border"
                  }`}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full min-h-12 bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors font-semibold"
          >
            <Save className="size-5" aria-hidden />
            Save note
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">Tip: a note with only content works too — no title required.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="page-shell max-w-2xl mx-auto" aria-label="Notes">
      <div className="page-head">
        <div>
          <p className="page-subtitle mb-0.5">Ideas in one place 💡</p>
          <h1 className="page-title">Notes</h1>
        </div>
        <button
          type="button"
          onClick={createNote}
          className="min-h-11 min-w-11 bg-primary text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label="Add new note"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {notes.length > 0 && (
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="notes-search" className="sr-only">Search notes</label>
          <input
            id="notes-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full min-h-11 pl-9 pr-3 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state" role="status">
          <span className="empty-emoji" aria-hidden>🗒️</span>
          <h2 className="text-base font-semibold">No notes yet</h2>
          <p className="text-sm text-muted-foreground">Capture a thought, a list, a brilliant idea.</p>
          <button
            type="button"
            onClick={createNote}
            className="mt-2 min-h-11 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Create your first note
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" role="status">
          <span className="empty-emoji" aria-hidden>🔍</span>
          <p className="text-sm text-muted-foreground">No notes match “{query}”.</p>
          <button type="button" onClick={() => setQuery("")} className="min-h-11 text-sm font-semibold text-primary px-4">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((note) => (
            <article
              key={note.id}
              className={`rounded-2xl p-4 shadow-md min-h-40 flex flex-col border border-border/50 ${note.color}`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="text-base font-semibold flex-1 break-words">{note.title || "Untitled ✨"}</h3>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditing(note)}
                    className="min-w-11 min-h-11 flex items-center justify-center hover:bg-black/10 rounded-xl"
                    aria-label={`Edit note: ${note.title || "Untitled"}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="min-w-11 min-h-11 flex items-center justify-center hover:bg-black/10 rounded-xl text-red-600 dark:text-red-400"
                    aria-label={`Delete note: ${note.title || "Untitled"}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm flex-1 line-clamp-6 whitespace-pre-wrap break-words">{note.content}</p>
              <p className="text-xs opacity-60 mt-2">
                {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </article>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <StickyNote className="size-3.5" aria-hidden /> {notes.length} note{notes.length === 1 ? "" : "s"} — saved on this device.
        </p>
      )}
    </main>
  );
}
