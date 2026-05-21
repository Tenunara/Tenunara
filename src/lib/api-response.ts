import { NextResponse } from "next/server";

export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  error: string,
  status: number = 400,
  details?: string,
) {
  return NextResponse.json({ error, details }, { status });
}
