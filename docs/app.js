document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const instruction = document.getElementById('instruction').value.trim();
    const responseContainers = [
        document.getElementById('model1Response'),
        document.getElementById('model2Response'),
        document.getElementById('model3Response'),
        document.getElementById('model4Response'),
        document.getElementById('model5Response')
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
        // Kirim instruksi ke backend (server)
        const response = await fetch('https://f462-140-213-42-101.ngrok-free.app/api/chat', { // Gunakan relative URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ instruction })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Pastikan data.responses adalah array dan memiliki panjang yang sesuai
        if (Array.isArray(data.responses) && data.responses.length === responseContainers.length) {
            // Tampilkan respons dan inference time di setiap response box
            data.responses.forEach((modelResponse, index) => {
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
