'use client';

import { useState } from 'react';

interface DebugPanelProps {
  chainData: Record<number, any>;
  error: string | null;
}

export default function DebugPanel({ chainData, error }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-mono text-sm shadow-lg"
      >
        {isOpen ? '✖ Close Debug' : '🐛 Debug Mode'}
      </button>

      {isOpen && (
        <div className="mt-2 bg-black border-2 border-green-500 rounded-lg p-4 max-w-2xl max-h-96 overflow-auto shadow-2xl">
          <h3 className="text-green-400 font-mono font-bold text-lg mb-4">Debug Information</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-500 rounded">
              <p className="text-red-300 font-mono text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(chainData).map(([chainId, data]) => (
              <div key={chainId} className="border border-green-700 rounded p-3">
                <h4 className="text-green-300 font-mono font-bold mb-2">
                  Chain ID: {chainId}
                </h4>
                <div className="text-green-500 font-mono text-xs space-y-1">
                  <p>Transactions: {data?.transactions?.length || 0}</p>
                  <p>Total Count: {data?.totalCount || 0}</p>
                  <p>
                    Last Tx:{' '}
                    {data?.transactions?.length > 0
                      ? data.transactions[data.transactions.length - 1].transactionHash.slice(0, 10) + '...'
                      : 'None'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-green-700">
            <button
              onClick={async () => {
                const results = await Promise.all(
                  Object.keys(chainData).map(async (chainId) => {
                    try {
                      const res = await fetch(`/api/hypersync?chainId=${chainId}&debug=true`);
                      return { chainId, data: await res.json() };
                    } catch (err: any) {
                      return { chainId, error: err.message };
                    }
                  })
                );
                console.log('Debug API Test Results:', results);
                alert('Check browser console for detailed debug info');
              }}
              className="w-full bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded font-mono text-sm"
            >
              Test API Endpoints
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

