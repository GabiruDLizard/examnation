// Remove hardcoded API key. Use environment variables or a secure secret manager to access the key.
// Shared helper function to load prompt from file
async function getPromptFromFile(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Failed to load file');
    return await response.text();
}

export async function askGPT(prompt) {
    // Load system prompt from public folder
    const txt = await getPromptFromFile('/prompt.txt');
    //'https://examnationwebapi.azurewebsites.net/api/chat'
    
    // Call your backend API instead of OpenAI directly
    const response = await fetch('https://examnationwebapi.azurewebsites.net/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: prompt,
            systemPrompt: txt // System prompt
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Chat API failed');
    }

    const data = await response.json();
    return data.response || data; // Adjust based on your backend response format
}

// In your component or wherever you call askGPT
export async function needAHint(prompt) {
    // Load hint system prompt
    const txt = await getPromptFromFile('/hint-prompt.txt');
    
    // Call your backend API for hints
    const response = await fetch('https://examnationwebapi.azurewebsites.net/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: prompt,
            systemPrompt: txt // Hint system prompt
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Hint API failed');
    }

    const data = await response.json();
    return data.response || data; // Adjust based on your backend response format
}