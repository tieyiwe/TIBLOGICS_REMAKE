export interface ModelSpec {
  id: string;
  name: string;
  inputCost: number;
  outputCost: number;
  unit: string;
  contextK?: number;
  badge?: string;
}

export interface ProviderSpec {
  name: string;
  models: ModelSpec[];
}

export const AI_MODELS: Record<string, ProviderSpec> = {
  anthropic: {
    name: "Anthropic",
    models: [
      { id: "claude-opus-4",    name: "Claude Opus 4",      inputCost: 15.00, outputCost: 75.00, unit: "1M tokens", contextK: 200,  badge: "Most Capable" },
      { id: "claude-sonnet-4",  name: "Claude Sonnet 4",    inputCost: 3.00,  outputCost: 15.00, unit: "1M tokens", contextK: 200,  badge: "Best Value"    },
      { id: "claude-haiku-3-5", name: "Claude Haiku 3.5",   inputCost: 0.80,  outputCost: 4.00,  unit: "1M tokens", contextK: 200,  badge: "Fast"          },
      { id: "claude-sonnet-3-5",name: "Claude Sonnet 3.5",  inputCost: 3.00,  outputCost: 15.00, unit: "1M tokens", contextK: 200                           },
    ],
  },
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-4-turbo",   name: "GPT-4 Turbo",   inputCost: 10.00, outputCost: 30.00, unit: "1M tokens", contextK: 128                           },
      { id: "gpt-4o",        name: "GPT-4o",         inputCost: 2.50,  outputCost: 10.00, unit: "1M tokens", contextK: 128, badge: "Popular"         },
      { id: "gpt-4o-mini",   name: "GPT-4o Mini",    inputCost: 0.15,  outputCost: 0.60,  unit: "1M tokens", contextK: 128, badge: "Cheapest"        },
      { id: "o1",            name: "o1",              inputCost: 15.00, outputCost: 60.00, unit: "1M tokens", contextK: 200, badge: "Reasoning"       },
      { id: "o1-mini",       name: "o1-mini",         inputCost: 3.00,  outputCost: 12.00, unit: "1M tokens", contextK: 128, badge: "Fast Reasoning"  },
      { id: "gpt-3-5-turbo", name: "GPT-3.5 Turbo",  inputCost: 0.50,  outputCost: 1.50,  unit: "1M tokens", contextK: 16                            },
    ],
  },
  google: {
    name: "Google",
    models: [
      { id: "gemini-2-flash",     name: "Gemini 2.0 Flash",    inputCost: 0.10,  outputCost: 0.40,  unit: "1M tokens", contextK: 1000, badge: "Fast"  },
      { id: "gemini-1-5-pro",     name: "Gemini 1.5 Pro",      inputCost: 1.25,  outputCost: 5.00,  unit: "1M tokens", contextK: 2000                  },
      { id: "gemini-1-5-flash",   name: "Gemini 1.5 Flash",    inputCost: 0.075, outputCost: 0.30,  unit: "1M tokens", contextK: 1000                  },
      { id: "gemini-1-0-pro",     name: "Gemini 1.0 Pro",      inputCost: 0.50,  outputCost: 1.50,  unit: "1M tokens", contextK: 32                    },
    ],
  },
  mistral: {
    name: "Mistral",
    models: [
      { id: "mistral-large",  name: "Mistral Large",    inputCost: 8.00,  outputCost: 24.00, unit: "1M tokens", contextK: 128, badge: "Best"  },
      { id: "mistral-small",  name: "Mistral Small",    inputCost: 1.00,  outputCost: 3.00,  unit: "1M tokens", contextK: 32                   },
      { id: "mixtral-8x7b",   name: "Mixtral 8x7B",    inputCost: 0.60,  outputCost: 0.60,  unit: "1M tokens", contextK: 32                   },
      { id: "mistral-7b",     name: "Mistral 7B",       inputCost: 0.25,  outputCost: 0.25,  unit: "1M tokens", contextK: 32                   },
    ],
  },
  cohere: {
    name: "Cohere",
    models: [
      { id: "command-r-plus",  name: "Command R+",      inputCost: 3.00,  outputCost: 15.00, unit: "1M tokens", contextK: 128, badge: "Best"  },
      { id: "command-r",       name: "Command R",        inputCost: 0.50,  outputCost: 1.50,  unit: "1M tokens", contextK: 128                  },
      { id: "command",         name: "Command",          inputCost: 1.00,  outputCost: 2.00,  unit: "1M tokens", contextK: 4                    },
      { id: "command-light",   name: "Command Light",    inputCost: 0.30,  outputCost: 0.60,  unit: "1M tokens", contextK: 4                    },
    ],
  },
  meta: {
    name: "Meta / Llama",
    models: [
      { id: "llama-3-1-405b", name: "Llama 3.1 405B", inputCost: 5.00,  outputCost: 15.00, unit: "1M tokens", contextK: 128, badge: "Most Capable" },
      { id: "llama-3-1-70b",  name: "Llama 3.1 70B",  inputCost: 0.90,  outputCost: 0.90,  unit: "1M tokens", contextK: 128                         },
      { id: "llama-3-1-8b",   name: "Llama 3.1 8B",   inputCost: 0.20,  outputCost: 0.20,  unit: "1M tokens", contextK: 128, badge: "Cheapest"      },
      { id: "llama-3-70b",    name: "Llama 3 70B",     inputCost: 0.90,  outputCost: 0.90,  unit: "1M tokens", contextK: 8                           },
    ],
  },
  perplexity: {
    name: "Perplexity",
    models: [
      { id: "pplx-70b-online",  name: "Llama 3.1 70B Online",  inputCost: 1.00,  outputCost: 1.00,  unit: "1M tokens", contextK: 128, badge: "Web Search"  },
      { id: "pplx-7b-online",   name: "Llama 3.1 7B Online",   inputCost: 0.20,  outputCost: 0.20,  unit: "1M tokens", contextK: 16                         },
      { id: "sonar-large",      name: "Sonar Large",            inputCost: 1.00,  outputCost: 1.00,  unit: "1M tokens", contextK: 128                         },
    ],
  },
  together: {
    name: "Together AI",
    models: [
      { id: "together-llama-405b",  name: "Llama 3.1 405B Instruct",  inputCost: 5.00,  outputCost: 5.00,  unit: "1M tokens", contextK: 128 },
      { id: "together-llama-70b",   name: "Llama 3.1 70B Instruct",   inputCost: 0.88,  outputCost: 0.88,  unit: "1M tokens", contextK: 128 },
      { id: "together-mixtral",     name: "Mixtral 8x7B Instruct",    inputCost: 0.60,  outputCost: 0.60,  unit: "1M tokens", contextK: 32  },
      { id: "together-gemma-27b",   name: "Gemma 2 27B",              inputCost: 0.80,  outputCost: 0.80,  unit: "1M tokens", contextK: 8   },
    ],
  },
  groq: {
    name: "Groq",
    models: [
      { id: "groq-llama-70b",   name: "Llama 3.1 70B (Groq)",    inputCost: 0.59,  outputCost: 0.79,  unit: "1M tokens", contextK: 128, badge: "Ultra Fast"     },
      { id: "groq-llama-8b",    name: "Llama 3.1 8B (Groq)",     inputCost: 0.05,  outputCost: 0.08,  unit: "1M tokens", contextK: 128, badge: "Cheapest Fast"  },
      { id: "groq-mixtral",     name: "Mixtral 8x7B (Groq)",     inputCost: 0.24,  outputCost: 0.24,  unit: "1M tokens", contextK: 32                           },
      { id: "groq-gemma2-9b",   name: "Gemma 2 9B (Groq)",       inputCost: 0.20,  outputCost: 0.20,  unit: "1M tokens", contextK: 8                            },
    ],
  },
  fireworks: {
    name: "Fireworks AI",
    models: [
      { id: "fw-llama-405b",    name: "Llama 3.1 405B",    inputCost: 3.00,  outputCost: 3.00,  unit: "1M tokens", contextK: 128 },
      { id: "fw-llama-70b",     name: "Llama 3.1 70B",     inputCost: 0.90,  outputCost: 0.90,  unit: "1M tokens", contextK: 128 },
      { id: "fw-mixtral-8x22b", name: "Mixtral 8x22B",     inputCost: 1.20,  outputCost: 1.20,  unit: "1M tokens", contextK: 64  },
    ],
  },
  replicate: {
    name: "Replicate",
    models: [
      { id: "rep-llama-70b",  name: "Llama 2 70B",    inputCost: 0.65,  outputCost: 2.75,  unit: "1M tokens", contextK: 4 },
      { id: "rep-llama-13b",  name: "Llama 2 13B",    inputCost: 0.10,  outputCost: 0.50,  unit: "1M tokens", contextK: 4 },
      { id: "rep-mistral-7b", name: "Mistral 7B",      inputCost: 0.05,  outputCost: 0.25,  unit: "1M tokens", contextK: 8 },
    ],
  },
};
