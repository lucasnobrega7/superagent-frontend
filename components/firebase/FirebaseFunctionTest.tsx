'use client';

import { useState } from 'react';
import FirebaseFunctionsClient from '../../app/lib/firebase-client';

export default function FirebaseFunctionTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const callHelloWorldFunction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await FirebaseFunctionsClient.helloWorld();
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error('Error calling Firebase function:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Firebase Functions Test</h2>
      
      <button 
        onClick={callHelloWorldFunction}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Call Firebase Function'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <p className="font-medium mb-2">Function Result:</p>
          <pre className="p-3 bg-gray-100 rounded overflow-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}