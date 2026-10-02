import { NextRequest, NextResponse } from 'next/server';
import { CHAINS } from '@/app/types/chains';

/**
 * Lightweight endpoint to check current block height
 * GET /api/hypersync/height?chainId=1
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get('chainId');

  if (!chainId) {
    return NextResponse.json({ error: 'Chain ID required' }, { status: 400 });
  }

  const chain = Object.values(CHAINS).find((c) => c.chainId === parseInt(chainId));

  if (!chain) {
    return NextResponse.json({ error: 'Invalid chain ID' }, { status: 400 });
  }

  try {
    const response = await fetch(`${chain.hypersyncUrl}/height`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${chain.name}] Height check failed:`, response.status, errorText);
      return NextResponse.json({ 
        error: `Height check failed: ${response.status}`,
        chain: chain.name,
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      chain: chain.name,
      chainId: chain.chainId,
      height: data.height,
    });
  } catch (error: any) {
    console.error(`[${chain.name}] Height error:`, error);
    return NextResponse.json({ 
      error: error.message,
      chain: chain.name,
    }, { status: 500 });
  }
}

