import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import ngrok from "ngrok";

const app = express();

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
        "Quran-Tafsir-Gpt2-163M-F16.gguf",
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
            console.time(`Model ${index + 1} Inference Time`);

            const startTime = Date.now(); // Start time
            const response = await session.prompt(inputText, {
                maxTokens: 128,
            });
            const endTime = Date.now(); // End time
            const inferenceTime = (endTime - startTime) / 1000; // Convert to seconds

            console.timeEnd(`Model ${index + 1} Inference Time`); // Log time taken for this model
            console.log(`Response from model ${index + 1}:`, response);

            // Tambahkan waktu inferensi ke response
            responses.push(`${response.trim()} (Inference Time: ${inferenceTime}s)`);
        }

        // Return responses dari semua model
        res.json({ responses });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while generating the response." });
    }
});

// Start the server
const port = 3000;
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    
    // Start Ngrok and expose port 3000
    const ngrokUrl = await ngrok.connect(port);
    console.log(`Ngrok tunnel is running at ${ngrokUrl}`);
});
