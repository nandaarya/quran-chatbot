import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import ngrok from "ngrok";
import cors from "cors";

const app = express();

// Izinkan semua origin (CORS terbuka)
app.use(cors());

app.use(express.json()); // Middleware to parse JSON body

// Define __dirname equivalent in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to load a model
async function loadModel(modelName) {
    const modelPath = path.join(__dirname, "model", modelName);
    const llama = await getLlama();
    const model = await llama.loadModel({
        modelPath: modelPath, // Path to GGUF model
    });
    const context = await model.createContext({
        contextSize: 1024, // Adjust context size as needed
    });
    return new LlamaChatSession({
        contextSequence: context.getSequence(),
    });
}

// Function to load all models one by one
async function loadAllModels() {
    const modelNames = [
        "Phi-3.5.Q4_K_M.gguf",
        "gemma2.Q4_K_M.gguf",
        "mistral.Q4_K_M.gguf",
        "GPT2-QuranTafsir-Model-163M-F16.gguf",
        "llama-3.2.Q4_K_M.gguf"
    ];

    const models = [];
    for (const modelName of modelNames) {
        try {
            console.log(`Loading model: ${modelName}`);
            const modelSession = await loadModel(modelName);
            models.push(modelSession);
            console.log(`Loaded model: ${modelName}`);
        } catch (error) {
            console.error(`Error loading model ${modelName}:`, error);
        }
    }
    return models;
}

// Load models sequentially
const models = await loadAllModels();

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle the chat
app.post("/api/chat", async (req, res) => {
    const instruction = req.body.instruction; // Ensure the body contains the instruction
    const inputText = `
    Di bawah ini adalah instruksi yang menjelaskan suatu tugas. Tulis tanggapan yang melengkapi permintaan dengan tepat.

    ### Instruction:
    ${instruction}

    ### Response:
    `;

    try {
        const responses = [];

        // Inference secara berurutan, satu model per satu
        for (const [index, session] of models.entries()) {
            console.log(`Starting inference for model ${index + 1}`);
            const startTime = Date.now(); // Start time

            const response = await session.prompt(inputText, {
                maxTokens: 128,
            });

            const endTime = Date.now(); // End time
            const inferenceTime = ((endTime - startTime) / 1000).toFixed(3); // Time in seconds with 3 decimals

            console.log(`Response from model ${index + 1}:`, response);
            console.log(`Inference Time for model ${index + 1}: ${inferenceTime} detik`);

            // Tambahkan objek dengan response dan inferenceTime ke array responses
            responses.push({
                response: response.trim(),
                inferenceTime: `${inferenceTime} detik`
            });
        }

        // Return responses dari semua model
        res.json({ responses });
    } catch (error) {
        console.error("Error during chat processing:", error);
        res.status(500).json({ error: "An error occurred while generating the response." });
    }
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
