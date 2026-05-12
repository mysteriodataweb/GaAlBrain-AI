let memoryMode = process.env.NO_DB === 'true' || process.env.LLM_ONLY === 'true';

export function isMemoryMode() {
  return memoryMode;
}

export function setMemoryMode(value: boolean) {
  memoryMode = value;
}
