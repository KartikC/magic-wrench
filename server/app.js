import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

// Enable CORS for your Chrome Extension's ID
app.use(cors({
  origin: 'chrome-extension://bkjjfddbgghljdmlhplohmdndhflmmno'
}));

app.use(express.json());

app.post('/process-input', async (req, res) => {
  const MODEL = "gpt-3.5-turbo";
  //const MODEL = "gpt-4";

  const userInput = req.body.userInput;
  const domInfo = req.body.domInfo; // Capture the DOM info
  const prompt = `Translate the following user command into JavaScript code, considering the DOM info: ${userInput}. DOM info: ${JSON.stringify(domInfo)}`;
  console.log(prompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      command: response.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("OpenAI API call failed: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
