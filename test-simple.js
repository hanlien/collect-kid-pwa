const fetch = require('node-fetch');

async function testTraditionalPipeline() {
  try {
    console.log('Testing traditional pipeline...');
    
    const response = await fetch('http://localhost:3000/api/recognize-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        enableAIRouter: false, // Disable AI router to test only traditional pipeline
        aiBudget: 0.05,
        aiPriority: 'accuracy'
      })
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTraditionalPipeline();
