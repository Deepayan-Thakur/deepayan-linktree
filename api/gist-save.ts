export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_GIST_TOKEN;
  const gistId = process.env.GITHUB_GIST_ID;

  if (!token) {
    return res.status(500).json({ error: 'GitHub token not configured on server' });
  }

  if (!gistId) {
    return res.status(500).json({ error: 'Gist ID not configured on server' });
  }

  const { data } = req.body || {};

  if (!data) {
    return res.status(400).json({ error: 'Data is required' });
  }

  // Save to GitHub Gist API
  const saveGist = async () => {
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Linktree-Storage',
        },
        body: JSON.stringify({
          description: "Deepayan's Creative Linktree - Data Storage",
          files: {
            'linktree-data.json': {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
      });

      // Log response details for debugging
      const responseBody = await response.text();
      console.log(`[Gist Save] Status: ${response.status}`);
      console.log(`[Gist Save] Response:`, responseBody);

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errorData = JSON.parse(responseBody);
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // Response wasn't JSON
        }
        throw new Error(`GitHub API error (${response.status}): ${errorMsg}`);
      }

      return res.status(200).json({ success: true, message: 'Data saved to gist' });
    } catch (error: any) {
      console.error('[Gist Save Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to save to gist' });
    }
  };

  return saveGist();
}
