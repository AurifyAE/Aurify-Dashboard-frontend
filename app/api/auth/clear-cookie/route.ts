import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('aurify_token');
  response.cookies.delete('aurify_refresh');
  return response;
}

export async function GET() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('aurify_token');
  response.cookies.delete('aurify_refresh');
  return response;
}
