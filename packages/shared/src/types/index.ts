import { z } from 'zod'

// API Request/Response types
export const createOrderSchema = z.object({
  amount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string(),
  metadata: z.record(z.any()).optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  expires_in: z.number().int().positive().default(3600)
})

export type CreateOrderRequest = z.infer<typeof createOrderSchema>

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  amount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string(),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  trial_days: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional()
})

export type CreateSubscriptionPlanRequest = z.infer<typeof createSubscriptionPlanSchema>

// Webhook event types
export type WebhookEventType =
  | 'order.created'
  | 'order.paid'
  | 'order.expired'
  | 'subscription.created'
  | 'subscription.payment_succeeded'
  | 'subscription.payment_failed'
  | 'subscription.cancelled'

export interface WebhookEvent {
  type: WebhookEventType
  data: Record<string, any>
  created_at: string
}
