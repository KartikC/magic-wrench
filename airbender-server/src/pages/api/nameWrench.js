import Cors from 'cors';
import OpenAI from 'openai';

// Initialize CORS middleware for all domains
const cors = Cors({
  methods: ['POST'],
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const code = req.body.code;
  const prompt = `Please create a three-word or less name to describe what the following code will do to this page visually: ${code}. Only respond with the three-word or less name, nothing else.`;
  console.log(prompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    res.json({
      name: response.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("OpenAI API call failed: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
