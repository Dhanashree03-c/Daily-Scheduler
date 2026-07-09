import { useState, useEffect } from 'react';
import { Book, ChevronLeft, ChevronRight, Save, Smile, Meh, Frown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: 'happy' | 'neutral' | 'sad';
  createdAt: string;
  updatedAt: string;
}

export function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('diaryEntries');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingContent, setEditingContent] = useState('');
  const [editingMood, setEditingMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');

  useEffect(() => {
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
  }, [entries]);

  const currentEntry = entries.find(e => isSameDay(new Date(e.date), selectedDate));

  useEffect(() => {
    if (currentEntry) {
      setEditingContent(currentEntry.content);
      setEditingMood(currentEntry.mood || 'neutral');
    } else {
      setEditingContent('');
      setEditingMood('neutral');
    }
  }, [selectedDate, currentEntry]);

  const saveEntry = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    if (currentEntry) {
      setEntries(entries.map(e =>
        e.id === currentEntry.id
          ? { ...e, content: editingContent, mood: editingMood, updatedAt: new Date().toISOString() }
          : e
      ));
    } else {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: dateStr,
        content: editingContent,
        mood: editingMood,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEntries([...entries, newEntry]);
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const hasEntry = (date: Date) => {
    return entries.some(e => isSameDay(new Date(e.date), date));
  };

  const getEntryMood = (date: Date) => {
    const entry = entries.find(e => isSameDay(new Date(e.date), date));
    return entry?.mood;
  };

  const MoodIcon = ({ mood, className = "size-6" }: { mood?: 'happy' | 'neutral' | 'sad', className?: string }) => {
    if (mood === 'happy') return <Smile className={className} />;
    if (mood === 'sad') return <Frown className={className} />;
    return <Meh className={className} />;
  };

  return (
    <div className="pb-20 px-4 pt-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Book className="size-8 text-blue-600" />
        <h1 className="text-2xl">My Diary</h1>
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={previousMonth} 
            className="p-2"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-lg">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button 
            onClick={nextMonth} 
            className="p-2"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-gray-600 py-1">
              {day}
            </div>
          ))}

          {/* Empty cells for alignment */}
          {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {monthDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasDiaryEntry = hasEntry(day);
            const mood = getEntryMood(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                aria-label={`Select ${format(day, 'EEEE, MMMM d, yyyy')}`}
                title={format(day, 'EEEE, MMMM d, yyyy')}
                className={`aspect-square rounded-lg p-1 text-sm relative flex flex-col items-center justify-center
                  ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                  ${isToday && !isSelected ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                <span>{format(day, 'd')}</span>
                {hasDiaryEntry && (
                  <MoodIcon
                    mood={mood}
                    className={`size-3 mt-0.5 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry Editor */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
          {currentEntry && (
            <span className="text-xs text-gray-500">
              Last edited: {format(new Date(currentEntry.updatedAt), 'p')}
            </span>
          )}
        </div>

        {/* Mood Selector */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">How are you feeling?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingMood('happy')}
              aria-label="Set mood to happy"
            >
              <Smile className="size-5" />
              Happy
            </button>
            <button
              onClick={() => setEditingMood('neutral')}
              aria-label="Set mood to neutral"
            >
              <Meh className="size-5" />
              Okay
            </button>
            <button
              onClick={() => setEditingMood('sad')}
              aria-label="Set mood to sad"
            >
              <Frown className="size-5" />
              Sad
            </button>
          </div>
        </div>

        <textarea
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          placeholder="Dear diary..."
          className="w-full h-64 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-600 mb-4"
        />

        <button
          onClick={saveEntry}
          className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Save className="size-5" />
          {currentEntry ? 'Update Entry' : 'Save Entry'}
        </button>

        {/* Entry Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total Entries: {entries.length}</p>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Smile className="size-4 text-green-600" />
              {entries.filter(e => e.mood === 'happy').length}
            </span>
            <span className="flex items-center gap-1">
              <Meh className="size-4 text-yellow-600" />
              {entries.filter(e => e.mood === 'neutral').length}
            </span>
            <span className="flex items-center gap-1">
              <Frown className="size-4 text-blue-600" />
              {entries.filter(e => e.mood === 'sad').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
