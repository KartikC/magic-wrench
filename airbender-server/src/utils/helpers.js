// Function to extract JavaScript code from the result
export function extractJSCodeFromResult(result) {
    const codeRegex = /```javascript([\s\S]*?)```/i;
    const match = result.match(codeRegex);
  
    if (match && match[1]) {
      const wrappedCode = `(function() { ${match[1].trim()} })();`;
      return wrappedCode;
    } else {
      return null;
    }
  }
  
export function truncateJsonByTokens(input, maxTokens) {
  const text = JSON.stringify(input);
  const charLimit = maxTokens * 2;
  
  let truncatedText = text;
  let didTruncate = false;

  console.log("================");
  console.log([text.length, charLimit]);
  console.log("================");


  if (text.length > charLimit) {
    didTruncate = true;
    truncatedText = text.substring(0, charLimit);
    const lastComma = truncatedText.lastIndexOf(',');
    if (lastComma > 0) {
      truncatedText = truncatedText.substring(0, lastComma) + '}';
    }
  }

  return {
    truncatedText,
    didTruncate
  };
}
  