import { Context } from 'hono'
import { ZodError } from 'zod'

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err)

  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation error',
        details: err.errors
      },
      400
    )
  }

  return c.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    },
    500
  )
}
