// import { LMStudioClient } from "@lmstudio/sdk";
// const client = new LMStudioClient();
import axios from "axios";
import { config } from "dotenv";
import { url } from "inspector";
export const generateMCQ = async (textChunk: string): Promise<string[]> => {
  //   if (textChunk.trim().split(" ").length < 20) {
  //     console.log("Skipping short chunk...");
  //     return [];
  //   }

  const prompt = `

Generate multiple choice questions based on the following transcript:
---
${textChunk}
---
Each question should include:
1. The question.
2. Four options (a, b, c, d).
3. Indicate the correct answer.

Example format:
1. Question?
a) Option A
b) Option B
c) Option C
d) Option D
Answer: Correct Option - Option A
`;
  //   const model = await client.llm.model("TinyLlama-1.1B-Chat-v1.0");
  //     const result = await model.respond(prompt, {temperature: 0 });
  //     if (result.content.includes("SKIP")) {
  //       console.log("Chunk skipped by model.");
  //       return [];
  //     }
  //   console.info(result.content);
  //   return [result.content];
  // };
  const config = {
    url: "https://openrouter.ai/api/v1/chat/completions",
    method: "post",
    headers: {
      Authorization:
        "Bearer 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",
      "Content-Type": "application/json",
    },
    data: {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
  };
  

  try {
    const response = await axios(config);

    // Extract the generated MCQ text from the response
    const mcqText: string =
      response.data.choices?.[0]?.message?.content || "";

    console.log("Generated MCQ:", mcqText);
    return [mcqText];
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
    return [];
  }
}
