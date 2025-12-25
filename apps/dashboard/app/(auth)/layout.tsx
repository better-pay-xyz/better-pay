export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">BetterPay</h1>
          <p className="mt-2 text-gray-600">Crypto Payment Platform</p>
        </div>
        {children}
      </div>
    </div>
  )
}
