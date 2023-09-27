import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ...rest of your code


const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

// Enable CORS for your Chrome Extension's ID
// app.use(cors({
//   origin: 'chrome-extension://bkjjfddbgghljdmlhplohmdndhflmmno'
// }));

// Enable CORS for all domains
app.use(cors());

app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));

app.post('/process-input', async (req, res) => {
  const MODEL = "gpt-3.5-turbo-16k";
  //const MODEL = "gpt-4";

  const userInput = req.body.userInput;
  const domInfo = req.body.domInfo; // Capture the DOM info
  // const prompt = `Translate the following user command into JavaScript code, considering the DOM info: ${userInput}. DOM info: ${JSON.stringify(domInfo)} start the code block with \`\`\`javascript and end it with \`\`\``;
  const prompt = `Understand what the user wants and translate the following user command into JavaScript code that could be executed on an existing website: ${userInput}. Consider the following DOM info: ${JSON.stringify(domInfo)}. Start the code block with \`\`\`javascript and end it with \`\`\``;
  console.log(prompt);

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const extractedCode = extractJSCodeFromResult(response.choices[0].message.content.trim()); //null if no code

    if (extractedCode) {
      // Save the extracted code to a file
      const filePath = path.join(__dirname, 'public', 'wrenchCode.js');
      fs.writeFile(filePath, extractedCode, (err) => {
        if (err) {
          console.error("File write failed:", err);
          return res.status(500).json({error: 'Internal Server Error'});
        }
      });
    }

    res.json({
      command: extractedCode,
    });
  } catch (err) {
    console.error("OpenAI API call failed: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/name-wrench', async (req, res) => {
  const MODEL = "gpt-3.5-turbo";
  //const MODEL = "gpt-4";

  const code = req.body.code;
  const prompt = `Please create a three word or less name to describe the what the following code will do to this page visually: ${code}. Only respond with the three word or less name word, nothing else.`;
  console.log(prompt);

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
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
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Function to extract JavaScript code from the result
function extractJSCodeFromResult(result) {
  // Regular expression to extract JavaScript code enclosed in triple backticks ```javascript ... ```
  const codeRegex = /```javascript([\s\S]*?)```/i;
  const match = result.match(codeRegex);

  if (match && match[1]) {
    // Wrapping the extracted code in an IIFE
    const wrappedCode = `(function() { ${match[1].trim()} })();`;
    return wrappedCode;
  } else {
    return null;
  }
}
