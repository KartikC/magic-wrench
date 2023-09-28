import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
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
