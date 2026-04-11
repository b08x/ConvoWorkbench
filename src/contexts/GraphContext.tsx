import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ConvoGraph, ConversationRating } from '../types/graph';
import { createEmptyGraph } from '../lib/graph/builder';

type Action =
  | { type: 'SET_GRAPH'; payload: ConvoGraph }
  | { type: 'UPDATE_CONVERSATION_RATING'; payload: { id: string; rating: ConversationRating | null; notes: string } }
  | { type: 'ADD_TRAJECTORIES'; payload: any[] }
  | { type: 'ADD_SKILLS'; payload: any[] };

const GraphContext = createContext<{
  state: ConvoGraph;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function graphReducer(state: ConvoGraph, action: Action): ConvoGraph {
  switch (action.type) {
    case 'SET_GRAPH':
      return action.payload;
    case 'UPDATE_CONVERSATION_RATING':
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.payload.id]: {
            ...state.conversations[action.payload.id],
            rating: action.payload.rating,
            notes: action.payload.notes,
          },
        },
        meta: {
          ...state.meta,
          stats: {
            ...state.meta.stats,
            rated_count: Object.values({
              ...state.conversations,
              [action.payload.id]: {
                ...state.conversations[action.payload.id],
                rating: action.payload.rating,
              }
            }).filter(c => c.rating !== null).length
          }
        }
      };
    case 'ADD_TRAJECTORIES':
      const newTrajs = { ...state.trajectories };
      action.payload.forEach(t => newTrajs[t.id] = t);
      return { ...state, trajectories: newTrajs };
    case 'ADD_SKILLS':
      const newSkills = { ...state.skills };
      action.payload.forEach(s => newSkills[s.id] = s);
      return { ...state, skills: newSkills };
    default:
      return state;
  }
}

export function GraphProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(graphReducer, createEmptyGraph());

  return (
    <GraphContext.Provider value={{ state, dispatch }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) throw new Error('useGraph must be used within a GraphProvider');
  return context;
}
