


export async function askGPT(prompt) {
    async function getPromptFromFile(filePath) {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Failed to load file');
        return await response.text();
    }

        // Usage
    const txt = await getPromptFromFile('/prompt.txt'); // prompt.txt in your public folder
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o', // or your GPT-4 Mini model name
            messages: [
                { role: 'system', content: txt },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.2
        })
    });

    if (!response.ok) {
        throw new Error('GPT API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// In your component or wherever you call askGPT
