'use client'

import { useState } from 'react'
import { debugCurrentUser, createCurrentUserProfile } from '@/lib/actions/debug-user'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDebug = async () => {
    setIsLoading(true)
    const result = await debugCurrentUser()
    setDebugInfo(result)
    setIsLoading(false)
  }

  const handleCreateProfile = async () => {
    setIsLoading(true)
    const result = await createCurrentUserProfile()
    console.log('Create profile result:', result)
    // Refresh debug info
    const debugResult = await debugCurrentUser()
    setDebugInfo(debugResult)
    setIsLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 User Debug Information</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={handleDebug} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Debug Current User'}
        </Button>
        
        <Button onClick={handleCreateProfile} disabled={isLoading} variant="outline">
          Create Profile Manually
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="font-bold mb-2">Debug Results:</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          {!debugInfo.success && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">Error:</h3>
              <p className="text-red-700 dark:text-red-300">{debugInfo.error}</p>
            </div>
          )}
          
          {debugInfo.success && !debugInfo.profile && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Missing Profile:</h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                The user exists but has no profile. This might be causing the foreign key error.
              </p>
            </div>
          )}
          
          {debugInfo.success && debugInfo.profile && (
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">Profile Found:</h3>
              <p className="text-green-700 dark:text-green-300">
                User has a valid profile. The issue might be elsewhere.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8">
        <a 
          href="/app" 
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
        >
          ← Back to App
        </a>
      </div>
    </div>
  )
}
