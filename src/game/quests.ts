import { QUEST_REWARD } from '../content/rules';
import type { GameState, Quest } from './model';
import { addReport } from './state';

export function questName(q: Quest): string {
  return q.kind === 'city' ? 'Claim Stonegate' : 'Secrets of the Ancients';
}

export function checkQuests(s: GameState): void {
  for (const quest of s.quests) {
    if (quest.completed) continue;
    const fulfilled = quest.kind === 'city'
      ? s.cities.some(c => c.id === quest.target && c.owner === quest.owner)
      : s.ruins.some(r => r.exploredBy === quest.owner);
    if (!fulfilled) continue;
    quest.completed = true;
    s.factions[quest.owner].gold += QUEST_REWARD;
    addReport(s, `${s.factions[quest.owner].name} completed ${questName(quest)}: +${QUEST_REWARD} gold.`);
  }
}
