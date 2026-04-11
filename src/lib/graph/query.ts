import { buildSchema, graphql, GraphQLSchema } from 'graphql';
import { ConvoGraph } from '../../types/graph';
import { computeCosineSimilarity } from './embeddings';

const schemaSource = `
  enum Source {
    claude
    chatgpt
  }

  enum QualitySignal {
    positive
    negative
    mixed
  }

  type Message {
    id: ID!
    source: Source!
    role: String!
    content: String!
    timestamp: Float
    conversation_id: ID!
    project_id: ID
  }

  type Conversation {
    id: ID!
    source: Source!
    title: String
    project_id: ID
    messages: [Message!]!
    rating: Rating
    notes: String
  }

  type Rating {
    correctness: String
    tone: String
    format: String
    rated_at: Float
  }

  type Topic {
    id: ID!
    label: String!
    conversations: [Conversation!]!
  }

  type Trajectory {
    id: ID!
    conversations: [Conversation!]!
    lesson: String!
    quality_signal: QualitySignal!
  }

  type Skill {
    id: ID!
    title: String!
    content: String!
    version: Int!
    gitagent_path: String!
  }

  type Query {
    conversations(source: Source, rated: Boolean, topic_id: ID): [Conversation!]!
    conversation(id: ID!): Conversation
    topics(min_size: Int): [Topic!]!
    trajectories(quality: QualitySignal): [Trajectory!]!
    skills: [Skill!]!
    semantic_path(from_topic: ID!, to_topic: ID!, max_hops: Int): [Conversation!]!
  }
`;

export function createExecutor(graph: ConvoGraph) {
  const schema = buildSchema(schemaSource);

  const rootValue = {
    conversations: ({ source, rated, topic_id }: any) => {
      let convos = Object.values(graph.conversations);
      if (source) convos = convos.filter((c) => c.source === source);
      if (rated !== undefined) {
        convos = convos.filter((c) => (rated ? c.rating !== null : c.rating === null));
      }
      if (topic_id) {
        const topic = graph.topics[topic_id];
        if (topic) {
          convos = convos.filter((c) => topic.conversation_ids.includes(c.id));
        }
      }
      return convos.map(c => ({
        ...c,
        messages: c.messages.map(mId => graph.messages[mId])
      }));
    },
    conversation: ({ id }: { id: string }) => {
      const c = graph.conversations[id];
      if (!c) return null;
      return {
        ...c,
        messages: c.messages.map(mId => graph.messages[mId])
      };
    },
    topics: ({ min_size }: { min_size?: number }) => {
      let topics = Object.values(graph.topics);
      if (min_size) topics = topics.filter((t) => t.conversation_ids.length >= min_size);
      return topics.map((t) => ({
        ...t,
        conversations: t.conversation_ids.map((id) => {
          const c = graph.conversations[id];
          return { ...c, messages: c.messages.map(mId => graph.messages[mId]) };
        }),
      }));
    },
    trajectories: ({ quality }: { quality?: string }) => {
      let trajectories = Object.values(graph.trajectories);
      if (quality) trajectories = trajectories.filter((t) => t.quality_signal === quality);
      return trajectories.map((t) => ({
        ...t,
        conversations: t.conversation_ids.map((id) => {
          const c = graph.conversations[id];
          return { ...c, messages: c.messages.map(mId => graph.messages[mId]) };
        }),
      }));
    },
    skills: () => Object.values(graph.skills),
    semantic_path: ({ from_topic, to_topic, max_hops = 3 }: any) => {
      // S-Path-RAG: BFS over topic adjacency, ranked by cosine similarity
      const startTopic = graph.topics[from_topic];
      const endTopic = graph.topics[to_topic];
      if (!startTopic || !endTopic) return [];

      // Simple BFS for v1
      const visited = new Set<string>();
      const queue: { id: string; path: string[]; depth: number }[] = [
        { id: from_topic, path: [], depth: 0 },
      ];

      while (queue.length > 0) {
        const { id, path, depth } = queue.shift()!;
        if (depth > max_hops) continue;
        if (id === to_topic) {
          return path.map((cId) => {
            const c = graph.conversations[cId];
            return { ...c, messages: c.messages.map(mId => graph.messages[mId]) };
          });
        }

        if (visited.has(id)) continue;
        visited.add(id);

        const topic = graph.topics[id];
        if (!topic) continue;

        for (const cId of topic.conversation_ids) {
          const convo = graph.conversations[cId];
          if (!convo) continue;
          
          // Find topics linked to this conversation
          const linkedTopics = Object.values(graph.topics).filter(t => 
            t.conversation_ids.includes(cId) && t.id !== id
          );

          for (const nextTopic of linkedTopics) {
            queue.push({
              id: nextTopic.id,
              path: [...path, cId],
              depth: depth + 1,
            });
          }
        }
      }

      return [];
    },
  };

  return {
    execute: (query: string, variables?: any) =>
      graphql({ schema, source: query, rootValue, variableValues: variables }),
  };
}
