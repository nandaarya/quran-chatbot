import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import cors from "cors";
import ngrok from "ngrok";

const app = express();

const corsOptions = {
    origin: "https://nandaarya.github.io", // Ganti dengan URL frontend Anda
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Metode yang diizinkan
    allowedHeaders: ["Content-Type", "Authorization"], // Header yang diizinkan
    credentials: true, // Jika Anda menggunakan cookies
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Define __dirname equivalent in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to load a model
async function loadModel(modelName) {
    const modelPath = path.join(__dirname, "model", modelName);
    const llama = await getLlama();
    const model = await llama.loadModel({
        modelPath: modelPath,
    });
    const context = await model.createContext({
        contextSize: 1024,
    });
    return new LlamaChatSession({
        contextSequence: context.getSequence(),
    });
}

// Define models with their respective names
const modelPaths = {
    model1: "pretrained-Phi-3.5.Q4_K_M.gguf",
    model2: "pretrained-Gemma2.Q4_K_M.gguf",
    model3: "pretrained-Mistral.Q4_K_M.gguf",
    model4: "pretrained-Gpt2-163M-F16.gguf",
    model5: "pretrained-llama-3.2.Q4_K_M.gguf",
    model6: "Phi-3.5.Q4_K_M.gguf",
    model7: "gemma2.Q4_K_M.gguf",
    model8: "mistral.Q4_K_M.gguf",
    model9: "GPT2-QuranTafsir-Model-163M-F16.gguf",
    model10: "llama-3.2.Q4_K_M.gguf",
};

// Function to create a chat handler for a specific model
function createChatHandler(modelKey) {
    return async (req, res) => {
        const instruction = req.body.instruction;

        if (!instruction) {
            return res.status(400).json({ error: "Instruction is required." });
        }

        const inputText = `
        Di bawah ini adalah instruksi yang menjelaskan suatu tugas. Tulis tanggapan yang melengkapi permintaan dengan tepat.

        ### Instruction:
        ${instruction}

        ### Response:
        `;

        try {
            console.log(`Loading model: ${modelPaths[modelKey]}`);
            let modelSession = await loadModel(modelPaths[modelKey]);
            console.log(`Model loaded: ${modelPaths[modelKey]}`);

            console.log(`Starting inference for model: ${modelKey}`);
            const startTime = Date.now();

            const response = await modelSession.prompt(inputText, {
                maxTokens: 128,
            });

            const endTime = Date.now();
            const inferenceTime = ((endTime - startTime) / 1000).toFixed(3);

            console.log(`Response from model ${modelKey}:`, response);

            // Kosongkan modelSession setelah selesai
            modelSession = null;

            res.json({
                model: modelPaths[modelKey],
                response: response.trim(),
                inferenceTime: `${inferenceTime} detik`,
            });
        } catch (error) {
            console.error(`Error during inference for model ${modelKey}:`, error);
            res.status(500).json({ error: "An error occurred while generating the response." });
        }
    };
}

// Register endpoints for each model
Object.keys(modelPaths).forEach((modelKey) => {
    const endpoint = `/api/chat/${modelKey}`;
    app.post(endpoint, createChatHandler(modelKey));
    console.log(`Endpoint registered: ${endpoint}`);
});

// Start the server
const port = 3000;

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    // Start Ngrok and expose port 3000
    try {
        const ngrokUrl = await ngrok.connect(port);
        console.log(`Ngrok tunnel is running at ${ngrokUrl}`);
    } catch (error) {
        console.error("Error starting Ngrok:", error);
    }
});