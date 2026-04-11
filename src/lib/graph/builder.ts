import { ConvoGraph, MessageNode, ConversationNode, MemoryNode } from '../../types/graph';

// Claude Format Types
interface ClaudeMessage {
  uuid: string;
  sender: 'human' | 'assistant';
  text: string;
  created_at: string;
}

interface ClaudeConversation {
  uuid: string;
  name: string | null;
  created_at: string;
  chat_messages: ClaudeMessage[];
}

interface ClaudeProject {
  uuid: string;
  name: string;
  description: string;
  conversations: string[]; // uuids
}

interface ClaudeMemory {
  uuid: string;
  content: string;
  created_at: string;
}

// ChatGPT Format Types
interface ChatGPTMessage {
  id: string;
  message?: {
    author: { role: 'user' | 'assistant' | 'system' };
    content: { parts: string[] };
    create_time: number;
  };
  parent: string | null;
  children: string[];
}

interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number;
  mapping: Record<string, ChatGPTMessage>;
}

export function createEmptyGraph(): ConvoGraph {
  return {
    messages: {},
    conversations: {},
    topics: {},
    trajectories: {},
    skills: {},
    memories: {},
    meta: {
      imported_at: Date.now(),
      version: '1.0',
      stats: {
        message_count: 0,
        conversation_count: 0,
        rated_count: 0,
      },
    },
  };
}

export function parseClaudeExport(
  conversationsJson: string,
  projectsJson?: string,
  memoriesJson?: string
): ConvoGraph {
  const graph = createEmptyGraph();
  const conversations: ClaudeConversation[] = JSON.parse(conversationsJson);
  const projects: ClaudeProject[] = projectsJson ? JSON.parse(projectsJson) : [];
  const memories: ClaudeMemory[] = memoriesJson ? JSON.parse(memoriesJson) : [];

  // Map conversations to projects
  const convoToProject = new Map<string, string>();
  projects.forEach((p) => {
    p.conversations.forEach((cId) => convoToProject.set(cId, p.uuid));
  });

  conversations.forEach((c) => {
    const messageIds: string[] = [];
    c.chat_messages.forEach((m, idx) => {
      const mId = `claude-${m.uuid || `${c.uuid}-${idx}`}`;
      const node: MessageNode = {
        id: mId,
        source: 'claude',
        role: m.sender === 'human' ? 'user' : 'assistant',
        content: m.text,
        timestamp: m.created_at ? new Date(m.created_at).getTime() : null,
        conversation_id: c.uuid,
        project_id: convoToProject.get(c.uuid) || null,
        topic_ids: [],
        skill_ids: [],
      };
      graph.messages[mId] = node;
      messageIds.push(mId);
    });

    graph.conversations[c.uuid] = {
      id: c.uuid,
      source: 'claude',
      title: c.name,
      project_id: convoToProject.get(c.uuid) || null,
      messages: messageIds,
      rating: null,
      notes: '',
    };
  });

  memories.forEach((m) => {
    graph.memories[m.uuid] = {
      id: m.uuid,
      source: 'claude_memories',
      content: m.content,
      timestamp: m.created_at ? new Date(m.created_at).getTime() : null,
    };
  });

  updateStats(graph);
  return graph;
}

export function parseChatGPTExport(conversationsJson: string): ConvoGraph {
  const graph = createEmptyGraph();
  const conversations: ChatGPTConversation[] = JSON.parse(conversationsJson);

  conversations.forEach((c) => {
    const messageIds: string[] = [];
    
    // ChatGPT uses a tree structure, we need to flatten it to a linear thread
    // We'll find the leaf node and traverse up, then reverse
    const nodes = Object.values(c.mapping);
    const leafNode = nodes.find(n => n.children.length === 0);
    
    if (!leafNode) return;

    let current: ChatGPTMessage | undefined = leafNode;
    const thread: ChatGPTMessage[] = [];
    while (current) {
      if (current.message && current.message.author.role !== 'system') {
        thread.push(current);
      }
      current = current.parent ? c.mapping[current.parent] : undefined;
    }
    thread.reverse();

    thread.forEach((m, idx) => {
      if (!m.message) return;
      const mId = `chatgpt-${m.id}`;
      const node: MessageNode = {
        id: mId,
        source: 'chatgpt',
        role: m.message.author.role === 'user' ? 'user' : 'assistant',
        content: m.message.content.parts.join('\n'),
        timestamp: m.message.create_time ? m.message.create_time * 1000 : null,
        conversation_id: c.id,
        project_id: null,
        topic_ids: [],
        skill_ids: [],
      };
      graph.messages[mId] = node;
      messageIds.push(mId);
    });

    graph.conversations[c.id] = {
      id: c.id,
      source: 'chatgpt',
      title: c.title,
      project_id: null,
      messages: messageIds,
      rating: null,
      notes: '',
    };
  });

  updateStats(graph);
  return graph;
}

function updateStats(graph: ConvoGraph) {
  graph.meta.stats.message_count = Object.keys(graph.messages).length;
  graph.meta.stats.conversation_count = Object.keys(graph.conversations).length;
  graph.meta.stats.rated_count = Object.values(graph.conversations).filter(c => c.rating !== null).length;
}
