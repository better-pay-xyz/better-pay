import { createId } from '@paralleldrive/cuid2'

export function generateOrderId(): string {
  return `ord_${createId()}`
}

export function generateSubscriptionId(): string {
  return `sub_${createId()}`
}

export function generatePlanId(): string {
  return `plan_${createId()}`
}

export function generateCustomerId(): string {
  return `cus_${createId()}`
}

export function generatePaymentId(): string {
  return `pay_${createId()}`
}

export function generateMemo(): string {
  return createId()
}
