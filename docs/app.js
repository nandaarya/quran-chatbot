document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const instruction = document.getElementById('instruction').value;
    const responseContainers = [
        document.getElementById('model1Response'),
        document.getElementById('model2Response'),
        document.getElementById('model3Response'),
        document.getElementById('model4Response'),
        document.getElementById('model5Response')
    ];

    // Display loading message while waiting for response
    responseContainers.forEach(container => {
        container.querySelector('p').textContent = "Generating response...";
    });

    try {
        // Send the instruction to the backend (server)
        const response = await fetch('https://d9aa-112-215-237-20.ngrok-free.app/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ instruction })
        });

        // Get the AI response and update the UI
        const data = await response.json();

        // Display responses from each model
        data.responses.forEach((modelResponse, index) => {
            if (responseContainers[index]) {
                responseContainers[index].querySelector('p').textContent = modelResponse;
            }
        });
    } catch (error) {
        console.error("Error:", error);
        responseContainers.forEach(container => {
            container.querySelector('p').textContent = "An error occurred, please try again.";
        });
    }
});
