import Cors from 'cors';
import { sql } from "@vercel/postgres";

// Initializing CORS middleware
const cors = Cors({
    methods: ['POST'],
    origin: '*'
});

// Helper method to run middleware
const runMiddleware = async (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { url } = req.body;

  try {
    const results = await sql`
      SELECT name, command
      FROM user_commands
      WHERE url = ${url};
    `;

    if (results.length === 0) {
      res.status(404).json({ message: 'No commands found for the specified URL' });
      return;
    }

    // Map over results to get just the names and code
    const commandNames = results.map(row => ({ name: row.name, code: row.command }));

    res.status(200).json(commandNames);
  } catch (error) {
    console.error("Database fetch failed: ", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
