document.getElementById('btn').addEventListener('click', async () => {
        const response = await fetch('/button-clicked');
        const data = await response.json();
        console.log(data.message);
    });