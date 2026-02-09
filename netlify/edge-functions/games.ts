// Netlify Edge Function to proxy games API calls
// This avoids CORS issues and keeps API keys secure
// Edge Functions run on Deno runtime

export default async (request: Request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )
  }

  try {
    // Extract game ID from URL path
    // Path format: /api/games/{gameId}
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // Match /api/games/{gameId} pattern
    const match = pathname.match(/^\/api\/games\/([^\/]+)$/)
    if (!match) {
      return new Response(
        JSON.stringify({ error: 'Invalid path format. Expected /api/games/{gameId}' }),
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    const gameId = match[1]

    if (!gameId || gameId.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Game ID is required' }),
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Fetch from the actual API
    const apiUrl = `https://api.diabolical.studio/rest-api/games/${gameId}`
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch game: ${response.statusText}` 
        }),
        {
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const data = await response.json()

    // Return the data with CORS headers
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    )
  } catch (error) {
    console.error('Error in games edge function:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        stack: errorStack,
        url: request.url
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )
  }
}


