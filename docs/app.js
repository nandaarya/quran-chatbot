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

    try {
        // Kirim instruksi ke backend untuk setiap model
        const responses = await Promise.all(Object.keys(modelPaths).map(async (modelKey) => {
            const response = await fetch(`https://c7fe-112-215-173-243.ngrok-free.app/api/chat/${modelKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instruction })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            return await response.json();
        }));

        // Pastikan data.responses adalah array dan memiliki panjang yang sesuai
        if (responses.length === responseContainers.length) {
            // Tampilkan respons dan inference time di setiap response box
            responses.forEach((modelResponse, index) => {
                const container = responseContainers[index];
                if (container) {
                    container.querySelector('p').textContent = modelResponse.response;
                    container.querySelector('.inference-time').textContent = `${modelResponse.inferenceTime}`;
                }
            });
        } else {
            throw new Error("Invalid response structure from server.");
        }
    } catch (error) {
        console.error("Error:", error);
        responseContainers.forEach(container => {
            container.querySelector('p').textContent = "An error occurred, please try again.";
            container.querySelector('.inference-time').textContent = "waiting inference result...";
        });
    }
});
