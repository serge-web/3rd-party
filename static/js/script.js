    const form = document.querySelector('form');
    const wargame_url = document.getElementById('wargame_url');
    const connected_user = document.getElementById('connected_user');
    const connectButton = document.querySelector('button[type="submit"]');
    const disconnectButton = document.getElementById('disconnectButton');
    const para = document.createElement("h2");
    const disconnectURL = '?wargame=&access=';
    // Add an event listener to the form for "submit" event

    const  isValidFormat = (text) => {
      // Define a regular expression pattern to match the format
      const pattern = /^\?wargame=[a-zA-Z0-9-]+&access=[a-zA-Z0-9-]+$/;

      // Use the test method to check if the text matches the pattern
      return pattern.test(text);
    }

 form.addEventListener('submit', function (event) {
    const wargameUrl = wargame_url.value.trim();
    const parts = wargameUrl.split('/');
    const textAfterLastSlash = parts[parts.length - 1];
    const isConforming = isValidFormat(textAfterLastSlash);

    if (!isConforming) {
        event.preventDefault(); // Prevent form submission
        // Provide user feedback about the invalid format if needed
        const validationResult = document.getElementById('validationResult');
        validationResult.textContent = 'Invalid URL format';
        validationResult.style.color = 'red';
    }
});

    disconnectButton.addEventListener('click', async () => {
    try {
        const response = await fetch(`/connect/${disconnectURL}`, {
            method: 'POST',
        });
        const result = await response.json();

        if (result.length === 0) {
            para.remove();
            wargame_url.value = '';
            connectButton.style.display = 'inline';
            disconnectButton.style.display = 'none';
        } else {
            console.error('Failed to disconnect.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
  });

    // Add an event listener to the "Disconnect" button
connectButton.addEventListener('click', async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const wargameUrl = wargame_url.value.trim();
    const validationResult = document.getElementById('validationResult');

    if (!wargameUrl) {
        validationResult.textContent = 'Please enter a valid URL';
        validationResult.style.color = 'red';
        return;
    }

    const parts = wargameUrl.split('/');
    const textAfterLastSlash = parts[parts.length - 1];

    if (isValidFormat(textAfterLastSlash)) {
        try {
            const response = await fetch(`/connect/${textAfterLastSlash}`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                if (result !== null) {
                    para.innerText = `Connected user: ${result.name}`;
                    connected_user.appendChild(para);
                    connectButton.style.display = 'none';
                    disconnectButton.style.display = 'inline';
                    validationResult.textContent = 'Connected successfully';
                    validationResult.style.color = 'green';
                } else {
                    validationResult.textContent = 'Invalid response from the server';
                    validationResult.style.color = 'red';
                }
            } else {
                validationResult.textContent = 'Failed to connect';
                validationResult.style.color = 'red';
            }
        } catch (error) {
            validationResult.textContent = 'An error occurred';
            validationResult.style.color = 'red';
            console.error('Error:', error);
        }
    } else {
        validationResult.textContent = 'Invalid URL format';
        validationResult.style.color = 'red';
    }
});




