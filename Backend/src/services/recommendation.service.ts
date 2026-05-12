export function buildFallbackRecommendations(concepts: string[]) {
  return concepts.map((concept) => ({
    concept,
    why: 'Concept identifié comme fragile pendant la session.',
    resource_type: 'exercice',
    search_query: `${concept} explication exercices corrigés`
  }));
}
