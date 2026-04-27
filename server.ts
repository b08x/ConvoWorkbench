import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GeminiAdapter } from "./src/lib/providers/google";
import { OpenRouterAdapter } from "./src/lib/providers/openrouter";
import { MistralAdapter } from "./src/lib/providers/mistral";
import { GroqAdapter } from "./src/lib/providers/groq";
import { OllamaAdapter } from "./src/lib/providers/ollama";
import { ModelProvider } from "./src/types/provider";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const providers = {
    google: new GeminiAdapter(),
    openrouter: new OpenRouterAdapter(),
    mistral: new MistralAdapter(),
    groq: new GroqAdapter(),
    ollama: new OllamaAdapter(),
  };

  const getApiKey = (providerId: string) => {
    switch (providerId) {
      case 'google':
      case 'gemini': return process.env.GEMINI_API_KEY;
      case 'openrouter': return process.env.OPENROUTER_API_KEY;
      case 'mistral': return process.env.MISTRAL_API_KEY;
      case 'groq': return process.env.GROQ_API_KEY;
      case 'ollama': return ''; // Ollama usually doesn't need a key
      default: return '';
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/llm/models/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const provider = providers[providerId as keyof typeof providers] as ModelProvider;
      if (!provider) return res.status(404).json({ error: "Provider not found" });

      const apiKey = getApiKey(providerId);
      const models = await provider.fetchModels(apiKey);
      res.json(models);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/llm/generate", async (req, res) => {
    try {
      const { providerId, modelId, prompt } = req.body;
      const provider = providers[providerId as keyof typeof providers] as ModelProvider;
      if (!provider) return res.status(404).json({ error: "Provider not found" });

      const apiKey = getApiKey(providerId);
      const result = await provider.generate(prompt, apiKey, modelId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // For streaming, we might need a more specialized approach depending on the adapter
  // But for now, let's implement basic streaming if possible
  app.post("/api/llm/stream", async (req, res) => {
    try {
      const { providerId, modelId, prompt } = req.body;
      const provider = providers[providerId as keyof typeof providers] as ModelProvider;
      if (!provider) return res.status(404).json({ error: "Provider not found" });

      const apiKey = getApiKey(providerId);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of provider.stream(prompt, apiKey, modelId)) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error("Stream error:", error);
      if (!res.headersSent) {
          res.status(500).json({ error: error.message });
      } else {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
      }
    }
  });

  app.post("/api/llm/speak", async (req, res) => {
    try {
      const { providerId, text } = req.body;
      const provider = providers[providerId as keyof typeof providers] as ModelProvider;
      if (!provider || !provider.speak) return res.status(404).json({ error: "Provider or speak method not found" });

      const apiKey = getApiKey(providerId);
      const base64Audio = await provider.speak(text, apiKey);
      res.json({ audio: base64Audio });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
