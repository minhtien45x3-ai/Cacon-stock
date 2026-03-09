import { loadState, saveState } from './storage.js';
export const state = loadState();
export function updateState(mutator) { mutator(state); saveState(state); }
