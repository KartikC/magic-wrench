import Cors from 'cors';
import OpenAI from 'openai';
import { extractJSCodeFromResult, truncateJsonByTokens } from '../../utils/helpers';

// Initialize the OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initializing CORS middleware
const cors = Cors({
  methods: ['POST'],
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
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method === 'POST') {
    const userInput = req.body.userInput;
    const domInfo = truncateJsonByTokens(req.body.domInfo, 16000);

    const prompt = `Understand what the user wants and translate the following user command into JavaScript code that could be executed on an existing website: ${userInput}. Consider the following DOM info: ${domInfo.truncatedText}. Always apply important tags and use other methods to make sure your code is applied despite code that is already on the website we're modifying. Start the code block with \`\`\`javascript and end it with \`\`\``;

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

      const extractedCode = extractJSCodeFromResult(response.choices[0].message.content.trim());

      res.json({
        command: extractedCode,
      });
    } catch (err) {
      console.error('OpenAI API call failed:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    // Handle any other HTTP method
    res.status(405).end();
  }
}
