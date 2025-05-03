const { Configuration, OpenAIApi } = require("openai");

exports.handler = async function(event) {
  const body = JSON.parse(event.body);
  const userMessage = body.message;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });
  const openai = new OpenAIApi(configuration);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // or gpt-4 if available
      messages: [
        { role: "system", content: "You are a helpful restaurant assistant. Suggest meals based on taste, calories, or categories like spicy or healthy." },
        { role: "user", content: userMessage }
      ]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: completion.data.choices[0].message.content })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." })
    };
  }
};
