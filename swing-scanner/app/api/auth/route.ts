import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = 'zoomboomzoom!23'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('swing_auth', PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('swing_auth')
  return response
}
