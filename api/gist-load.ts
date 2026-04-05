export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
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

  // Fetch from GitHub Gist API
  const fetchGist = async () => {
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const gist = await response.json();
      const fileContent = gist.files['linktree-data.json']?.content;

      if (!fileContent) {
        return res.status(404).json({ error: 'linktree-data.json not found in gist' });
      }

      const data = JSON.parse(fileContent);
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching gist:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch from gist' });
    }
  };

  return fetchGist();
}
