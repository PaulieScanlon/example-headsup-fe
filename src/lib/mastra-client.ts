import { MastraClient } from "@mastra/client-js";

export const mastraClient = new MastraClient({
  baseUrl: "http://localhost:4111" // Default Mastra development server port
});
