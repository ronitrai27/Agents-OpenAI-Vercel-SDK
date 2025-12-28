import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";

const agent = new Agent({
  name: "Storyteller",
  instructions:
    "You are a storyteller. You will be given a topic and you will tell a story about it.",
});

// 1 WAY=========================
// async function main(q:string) {
//     const result = await run(agent, q, {
//         stream: true,
//     });
//    const stream = result.toTextStream();

//    for await (const chunk of stream) {
//     console.log(chunk);
//    }
// }
// =============================
async function* streamOutput(q: string) {
  const result = await run(agent, q, {
    stream: true,
  });
  const stream = result.toTextStream();

  for await (const chunk of stream) {
    yield chunk;
  }
}
// 2 WAY=========================
// async function main(q: string) {
//   const result = await run(agent, q, {
//     stream: true,
//   });
//   result.toTextStream({ compatibleWithNodeStreams: true }).pipe(process.stdout);
// }


// 3 WAY=========================
async function main(q: string) {
  for await (const chunk of streamOutput(q)) {
    process.stdout.write(chunk);
  }
}

main("tell me a stroy in 100 words.")

// to run -> npx ts-node streaming.ts
