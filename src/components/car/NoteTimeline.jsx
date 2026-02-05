import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Send } from 'lucide-react';
import moment from 'moment';
import { cn } from "@/lib/utils";

export default function NoteTimeline({ notes, onAddNote, isLoading, currentStageName }) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    await onAddNote(newNote.trim());
    setNewNote('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Notes
        </h3>
        {!isAdding && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <Textarea 
            placeholder="Write a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px] resize-none border-slate-200 focus:border-amber-400 focus:ring-amber-400"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Stage: {currentStageName}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsAdding(false);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!newNote.trim() || isLoading}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Send className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {notes.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No notes yet</p>
        ) : (
          notes.map((note, index) => (
            <div 
              key={note.id} 
              className={cn(
                "relative pl-6 pb-4",
                index < notes.length - 1 && "border-l-2 border-slate-100 ml-2"
              )}
            >
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-400 -translate-x-[7px]" />
              <div className="bg-white rounded-lg border border-slate-100 p-4 ml-2">
                <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{note.author_name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{moment(note.created_date).format('MMM D, YYYY h:mm A')}</span>
                  {note.stage_name && (
                    <>
                      <span>•</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{note.stage_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}