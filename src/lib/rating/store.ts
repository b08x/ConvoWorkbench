import { ConversationRating } from '../../types/graph';
import { SessionStats } from '../../types/rating';

export function calculateSessionStats(ratings: Map<string, ConversationRating>): SessionStats {
  const stats: SessionStats = {
    total: ratings.size,
    rated: 0,
    correct: 0,
    incorrect: 0,
    issues: 0,
  };

  ratings.forEach((r) => {
    stats.rated++;
    if (r.correctness === 'correct') stats.correct++;
    if (r.correctness === 'incorrect') stats.incorrect++;
    if (r.tone === 'inappropriate' || r.format === 'bad') stats.issues++;
  });

  return stats;
}

export function createInitialRating(existing?: Partial<ConversationRating>): ConversationRating {
  return {
    correctness: existing?.correctness ?? null,
    tone: existing?.tone ?? null,
    format: existing?.format ?? null,
    rated_at: Date.now(),
  };
}
