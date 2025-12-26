'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PaymentLink } from '@better-pay/database'

interface Props {
  link: PaymentLink
}

export function PaymentLinkCheckout({ link }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayNow = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/link/${link.id}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create order')
      }

      const { paymentUrl } = await response.json()
      router.push(paymentUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
      {/* Product Image */}
      {link.imageUrl && (
        <div className="aspect-video bg-gray-100">
          <img
            src={link.imageUrl}
            alt={link.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Product Info */}
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{link.title}</h1>
          {link.description && (
            <p className="mt-2 text-gray-600">{link.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="text-center py-4">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">
              ${link.amount}
            </span>
            <span className="text-lg text-gray-500">{link.currency}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayNow}
          disabled={isLoading}
          className="w-full bg-[#3ECF8E] hover:bg-[#38b87f] text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              Pay Now
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <span className="font-semibold text-gray-600">BetterPay</span>
          </p>
        </div>
      </div>
    </div>
  )
}
