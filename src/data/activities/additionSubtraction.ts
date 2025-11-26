import type { ActivityQuestion } from '../../types';
import { generateAllQuestions } from './questionGenerator';

/**
 * Addition & Subtraktion questions for age group 1-3
 * Organized by SOLO level and concept area
 *
 * This uses the comprehensive question generator which creates 600+ questions
 * covering all levels and variations of addition and subtraction:
 *
 * - Addition 1-5: 131 questions
 * - Addition 1-10: 35 questions
 * - Addition 11-20: 55 questions
 * - Addition doubles (2+2, 3+3, etc.): 30 questions
 * - Addition tens crossing (7+4, 8+5, etc.): 52 questions
 * - Subtraction 1-5: 40 questions
 * - Subtraction 1-10: 45 questions
 * - Subtraction 11-20: 165 questions
 * - Mixed operations: 48 questions
 *
 * Total: 601 questions with varied contexts, question types, difficulty levels,
 * and pedagogical taxonomies (SOLO and Bloom's)
 */

// Generate the comprehensive question bank (601 questions)
export const ADDITION_SUBTRACTION_QUESTIONS: ActivityQuestion[] = generateAllQuestions();

/**
 * Get questions by filters
 */
export function getQuestionsByFilters(filters: {
  conceptArea?: string;
  soloLevel?: string;
  bloomLevel?: string;
  difficulty?: string;
}) {
  return ADDITION_SUBTRACTION_QUESTIONS.filter((q) => {
    if (filters.conceptArea) {
      if (filters.conceptArea === 'addition-0-20') {
        // Include all addition questions
        if (!q.conceptArea.startsWith('addition')) return false;
      } else if (q.conceptArea !== filters.conceptArea) {
        return false;
      }
    }
    if (filters.soloLevel && q.soloLevel !== filters.soloLevel) return false;
    if (filters.bloomLevel && q.bloomLevel !== filters.bloomLevel) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    return true;
  });
}

/**
 * Get random question matching criteria
 */
export function getRandomQuestion(filters: {
  conceptArea?: string;
  soloLevel?: string;
  bloomLevel?: string;
}) {
  const matching = getQuestionsByFilters(filters);
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}
