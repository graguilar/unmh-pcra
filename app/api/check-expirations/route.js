 import { NextResponse } from 'next/server'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    working: true,
    cron: process.env.CRON_SECRET?.slice(0, 5),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20),
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15)
  })
}