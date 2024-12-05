document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const instruction = document.getElementById('instruction').value.trim();
    const responseContainers = [
        document.getElementById('model1Response'),
        document.getElementById('model2Response'),
        document.getElementById('model3Response'),
        document.getElementById('model4Response'),
        document.getElementById('model5Response'),
        document.getElementById('model6Response'),
        document.getElementById('model7Response'),
        document.getElementById('model8Response'),
        document.getElementById('model9Response'),
        document.getElementById('model10Response')
    ];

    // Cek apakah instruksi tidak kosong
    if (!instruction) {
        alert("Silakan masukkan instruksi.");
        return;
    }

    // Tampilkan pesan loading
    responseContainers.forEach(container => {
        container.querySelector('p').textContent = "Generating response...";
        container.querySelector('.inference-time').textContent = "process...";
    });

    // Define models with their respective names
    const modelPaths = {
        model1: "pretrained-Phi-3.5.Q4_K_M.gguf",
        model2: "pretrained-Gemma2.Q4_K_M.gguf",
        model3: "pretrained-mistral.Q4_K_M.gguf",
        model4: "pretrained-Gpt2-163M-F16.gguf",
        model5: "pretrained-llama-3.2.Q4_K_M.gguf",
        model6: "Phi-3.5.Q4_K_M.gguf",
        model7: "gemma2.Q4_K_M.gguf",
        model8: "mistral.Q4_K_M.gguf",
        model9: "GPT2-QuranTafsir-Model-163M-F16.gguf",
        model10: "llama-3.2.Q4_K_M.gguf",
    };

    try {
        // Proses secara bergantian, satu per satu
        for (let i = 0; i < Object.keys(modelPaths).length; i++) {
            const modelKey = `model${i + 1}`;
            const responseContainer = responseContainers[i];

            // Kirim instruksi ke backend untuk model saat ini
            const response = await fetch(`https://5994-140-213-173-235.ngrok-free.app/api/chat/${modelKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instruction })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const modelResponse = await response.json();

            // Tampilkan respons dan inference time di setiap response box
            if (responseContainer) {
                responseContainer.querySelector('p').textContent = modelResponse.response;
                responseContainer.querySelector('.inference-time').textContent = `${modelResponse.inferenceTime}`;
            }
        }
    } catch (error) {
        console.error("Error:", error);
        responseContainers.forEach(container => {
            container.querySelector('p').textContent = "An error occurred, please try again.";
            container.querySelector('.inference-time').textContent = "waiting inference result...";
        });
    }
});
