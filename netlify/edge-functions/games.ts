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
    const pathParts = url.pathname.split('/').filter(part => part !== '')
    
    // Find the gameId (should be after 'games' in the path)
    const gamesIndex = pathParts.indexOf('games')
    const gameId = gamesIndex !== -1 && gamesIndex < pathParts.length - 1 
      ? pathParts[gamesIndex + 1] 
      : pathParts[pathParts.length - 1]

    if (!gameId || gameId === 'games') {
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
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
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


