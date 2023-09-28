import Cors from 'cors';
import { sql } from "@vercel/postgres";

// Initialize CORS middleware
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

  const { url, userPrompt, finalPrompt, command, name, isDev } = req.body;

  try {
    await sql`
      INSERT INTO user_commands (url, user_prompt, final_prompt, command, name, is_dev)
      VALUES (${url}, ${userPrompt}, ${finalPrompt}, ${command}, ${name}, ${isDev});
    `;
    res.status(200).json({ message: 'Data successfully inserted' });
  } catch (error) {
    console.error("Database insert failed: ", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
