   const form = document.querySelector('form');
    const wargame_url = document.getElementById('wargame_url');
    const connected_user = document.getElementById('connected_user')
    const connectButton = document.querySelector('button[type="submit"]');
    const disconnectButton = document.getElementById('disconnectButton');
    const para = document.createElement("h2")
    // Add an event listener to the form for "submit" event

      const  isValidFormat = (text) => {
      // Define a regular expression pattern to match the format
      const pattern = /^\?wargame=[a-zA-Z0-9-]+&access=[a-zA-Z0-9-]+$/;

      // Use the test method to check if the text matches the pattern
      return pattern.test(text);
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the form from submitting immediately

        if (connectButton.style.display !== 'none') {
            // If the "Connect" button is visible, it means you want to connect
            const wargameUrlInput = document.getElementById('wargame_url');
            const wargameUrl = wargameUrlInput.value;

            // Send a request to connect to the wargame here (you need to implement this logic)
            // ...

            // Assuming the connection is successful
            connectButton.style.display = 'none';
            disconnectButton.style.display = 'inline';
        } else {
            // If the "Disconnect" button is visible, it means you want to disconnect
            // Handle the disconnection logic here (e.g., close the connection)

            connectButton.style.display = 'inline';
            disconnectButton.style.display = 'none';
        }
    });

    // Add an event listener to the "Disconnect" button
    disconnectButton.addEventListener('click', async function () {
        // e.preventDefault()

        const disconnectURl = '?wargame=&access='
        const response = await fetch(`/connect/${disconnectURl}`, {
          method: "POST"
        });
        const result = await response.json();
        console.log("Success:", result);
        para.remove()
        wargame_url.value = ''
    });
        // Add an event listener to the "Disconnect" button
    connectButton.addEventListener('click',  async function (event) {
        const parts = wargame_url.value.split('/');
        const textAfterLastSlash = parts[parts.length - 1];
        const isConforming = isValidFormat(textAfterLastSlash)
        // event.preventDefault()
        // const validationResult = document.getElementById('validationResult');

      // if (isConforming) {
      //   validationResult.textContent = 'Valid Format';
      //   validationResult.style.color = 'green';
      // } else {
      //   validationResult.textContent = 'Invalid Format';
      //   validationResult.style.color = 'red';
      // }

        if (isConforming) {
            const response = await fetch(`/connect/${textAfterLastSlash}`, {
            method: "POST"
        });
        const result = await response.json();
        para.innerText = `Connected user: ${result.name}`
        connected_user.appendChild(para)
        }
    });

