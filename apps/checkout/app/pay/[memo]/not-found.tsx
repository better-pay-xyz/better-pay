import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <FileQuestion className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
      <p className="text-gray-500 mb-6">
        Please check if the payment link is correct, or contact the merchant for a new link
      </p>
      <Link href="/">
        <Button variant="secondary">Back to Home</Button>
      </Link>
    </div>
  )
}
