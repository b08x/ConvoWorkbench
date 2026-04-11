import React, { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ConversationViewer } from './ConversationViewer';
import { RatingPanel } from './RatingPanel';

export function ReviewView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
      <ConversationViewer conversationId={selectedId} />
      <RatingPanel conversationId={selectedId} />
    </div>
  );
}
