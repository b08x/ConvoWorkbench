import { ConvoGraph, MessageNode, ConversationNode, MemoryNode } from '../../types/graph';

export interface ArtifactInput {
  id: string;
  type: string;
  language?: string;
  title?: string;
  content: string;
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: ArtifactInput | any }
  | { type: 'tool_result'; tool_use_id: string; content: string | ContentBlock[] };

export interface ProjectDoc {
  uuid: string;
  filename: string;
  content: string;
  created_at: string;
}

// Claude Format Types
interface ClaudeMessage {
  uuid: string;
  sender: 'human' | 'assistant';
  text: string;
  created_at: string;
  content?: ContentBlock[];
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
  docs?: ProjectDoc[];
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
    artifacts: {},
    project_docs: {},
    meta: {
      imported_at: Date.now(),
      version: '1.0',
      stats: {
        message_count: 0,
        conversation_count: 0,
        rated_count: 0,
        artifact_count: 0,
        project_doc_count: 0,
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
  
  let rawConversations;
  try {
    rawConversations = JSON.parse(conversationsJson);
  } catch (e) {
    throw new Error('Failed to parse conversations.json');
  }
  
  const conversations: ClaudeConversation[] = Array.isArray(rawConversations) ? rawConversations : [];
  
  let rawProjects = [];
  if (projectsJson) {
    try {
      const parsed = JSON.parse(projectsJson);
      rawProjects = Array.isArray(parsed) ? parsed : (parsed?.projects || []);
    } catch (e) {
      console.warn('Failed to parse projects.json');
    }
  }
  const projects: ClaudeProject[] = Array.isArray(rawProjects) ? rawProjects : [];

  let rawMemories = [];
  if (memoriesJson) {
    try {
      const parsed = JSON.parse(memoriesJson);
      rawMemories = Array.isArray(parsed) ? parsed : (parsed?.memories || []);
    } catch (e) {
      console.warn('Failed to parse memories.json');
    }
  }
  const memories: ClaudeMemory[] = Array.isArray(rawMemories) ? rawMemories : [];

  // Map conversations to projects
  const convoToProject = new Map<string, string>();
  projects.forEach((p) => {
    if (!p) return;
    p.conversations?.forEach((cId) => convoToProject.set(cId, p.uuid));

    if (p.docs && Array.isArray(p.docs)) {
      p.docs.forEach((doc) => {
        if (!doc) return;
        graph.project_docs[doc.uuid] = {
          id: doc.uuid,
          project_id: p.uuid,
          filename: doc.filename,
          content: doc.content,
          created_at: doc.created_at,
        };
      });
    }
  });

  conversations.forEach((c) => {
    if (!c) return;
    const messageIds: string[] = [];
    c.chat_messages?.forEach((m, idx) => {
      if (!m) return;
      const mId = `claude-${m.uuid || `${c.uuid}-${idx}`}`;
      let content = m.text || '';
      const artifact_ids: string[] = [];

      if (m.content && Array.isArray(m.content) && m.content.length > 0) {
        const textBlocks = m.content
          .filter((b) => b && b.type === 'text')
          .map((b) => (b as { text: string }).text);
        if (textBlocks.length > 0) {
          content = textBlocks.join('\n\n');
        }

        m.content.forEach((block) => {
          if (block && block.type === 'tool_use' && block.name === 'artifacts') {
            const input = block.input as ArtifactInput;
            if (input && input.id) {
              graph.artifacts[input.id] = {
                id: input.id,
                message_id: mId,
                conversation_id: c.uuid,
                project_id: convoToProject.get(c.uuid) || null,
                type: input.type,
                language: input.language,
                title: input.title,
                content: input.content,
              };
              artifact_ids.push(input.id);
            }
          }
        });
      }

      const node: MessageNode = {
        id: mId,
        source: 'claude',
        role: m.sender === 'human' ? 'user' : 'assistant',
        content,
        timestamp: m.created_at ? new Date(m.created_at).getTime() : null,
        conversation_id: c.uuid,
        project_id: convoToProject.get(c.uuid) || null,
        topic_ids: [],
        skill_ids: [],
        artifact_ids: artifact_ids.length > 0 ? artifact_ids : undefined,
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
      created_at: c.created_at ? new Date(c.created_at).getTime() : null,
    };
  });

  memories.forEach((m) => {
    if (!m) return;
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
      created_at: c.create_time ? c.create_time * 1000 : null,
    };
  });

  updateStats(graph);
  return graph;
}

function updateStats(graph: ConvoGraph) {
  graph.meta.stats.message_count = Object.keys(graph.messages).length;
  graph.meta.stats.conversation_count = Object.keys(graph.conversations).length;
  graph.meta.stats.rated_count = Object.values(graph.conversations).filter(c => c.rating !== null).length;
  graph.meta.stats.artifact_count = Object.keys(graph.artifacts).length;
  graph.meta.stats.project_doc_count = Object.keys(graph.project_docs).length;
}
