export type ProviderName = 'bedrock' | 'openai' | 'anthropic'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModel = 'gpt-5' | 'gpt-5-mini'

export type AnthropicModel = 'claude-sonnet-4-20250514' | 'claude-3-5-haiku-20241022'

// Reasoning effort levels supported by OpenAI models.
// Source: https://developers.openai.com/api/docs/guides/reasoning + per-model pages
// Community matrix: https://community.openai.com/t/request-for-compatibility-matrix-reasoning-effort-sampling-parameters-across-gpt-5-series/1371738/2
// When adding a new model, check its individual docs page and update ModelReasoningSupport below.
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

// Maps each known OpenAI model to the effort levels it supports.
// Used to enforce valid combinations at compile time via assistantModel().
// Note: newer models (e.g. gpt-5.4-nano, gpt-5.3-codex) support different sets of levels
// (e.g. 'none'/'xhigh' may be available; 'minimal' may not). Add entries here when
// introducing new models — check the per-model docs page and the community compatibility
// matrix: https://community.openai.com/t/request-for-compatibility-matrix-reasoning-effort-sampling-parameters-across-gpt-5-series/1371738/2
type ModelReasoningSupport = {
  'gpt-5': 'minimal' | 'low' | 'medium' | 'high'
  'gpt-5-mini': 'minimal' | 'low' | 'medium' | 'high'
}

// Helper that enforces a valid reasoningEffort for the given model ID at compile time.
function assistantModel<ModelId extends OpenAIModel>(config: {
  id: ModelId
  /** Which user tier this model is available to */
  tier: 'free' | 'pro'
  reasoningEffort?: ModelId extends keyof ModelReasoningSupport
    ? ModelReasoningSupport[ModelId]
    : ReasoningEffort
}) {
  return config
}

// Single source of truth for Assistant chat model variants and their reasoning levels.
// Add entries here when introducing new assistant models.
export const ASSISTANT_MODELS = [
  assistantModel({ id: 'gpt-5-mini', tier: 'free', reasoningEffort: 'minimal' }),
  assistantModel({ id: 'gpt-5', tier: 'pro', reasoningEffort: 'minimal' }),
] as const

export type AssistantModelId = (typeof ASSISTANT_MODELS)[number]['id']

export type Model = BedrockModel | OpenAIModel | AnthropicModel

export type ProviderModelConfig = {
  /** Optional providerOptions to attach to the system message for this model */
  promptProviderOptions?: Record<string, any>
  /** The default model for this provider (used when limited or no preferred specified) */
  default: boolean
}

export type ProviderRegistry = {
  bedrock: {
    models: Record<BedrockModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  openai: {
    models: Record<OpenAIModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  anthropic: {
    models: Record<AnthropicModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
}

export const PROVIDERS: ProviderRegistry = {
  bedrock: {
    models: {
      'anthropic.claude-3-7-sonnet-20250219-v1:0': {
        promptProviderOptions: {
          bedrock: {
            // Always cache the system prompt (must not contain dynamic content)
            cachePoint: { type: 'default' },
          },
        },
        default: false,
      },
      'openai.gpt-oss-120b-1:0': {
        default: true,
      },
    },
  },
  openai: {
    models: {
      'gpt-5': { default: false },
      'gpt-5-mini': { default: true },
    },
    providerOptions: {
      openai: {
        store: false,
      },
    },
  },
  anthropic: {
    models: {
      'claude-sonnet-4-20250514': { default: false },
      'claude-3-5-haiku-20241022': { default: true },
    },
  },
}

export function getDefaultModelForProvider(provider: ProviderName): Model | undefined {
  const models = PROVIDERS[provider]?.models as Record<Model, ProviderModelConfig>
  if (!models) return undefined

  return Object.keys(models).find((id) => models[id as Model]?.default) as Model | undefined
}
