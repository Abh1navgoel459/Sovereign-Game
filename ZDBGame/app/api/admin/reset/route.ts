import { NextResponse } from 'next/server';
import { clearAllData } from '@/lib/data';

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { confirm?: string };
    const confirm = body.confirm;

    if (confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json(
        { error: 'Confirmation string required: "DELETE_ALL_DATA"' },
        { status: 400 }
      );
    }

    clearAllData();

    return NextResponse.json(
      { success: true, message: 'All data cleared successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to clear data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
