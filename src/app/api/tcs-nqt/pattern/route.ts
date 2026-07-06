import { NextResponse } from "next/server";
import { tcsNqtPattern } from "@/lib/data/tcs-nqt";

export async function GET() {
  return NextResponse.json({
    source: "config-json",
    sections: tcsNqtPattern
  });
}
