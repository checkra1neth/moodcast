import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream } from "node:fs";

const client = new ElevenLabsClient();
// Reads ELEVENLABS_API_KEY from environment automatically

const audioStream = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  text: "Hello! This is a test of the ElevenLabs text to speech API, powered by Kiro.",
  modelId: "eleven_flash_v2_5",
});

const outputPath = "output.mp3";
const writeStream = createWriteStream(outputPath);

for await (const chunk of audioStream) {
  writeStream.write(chunk);
}

writeStream.end(() => {
  console.log(`Audio saved to ${outputPath}`);
});
