const form = document.querySelector('form');
const wargame_url = document.getElementById('wargame_url');
const connected_user = document.getElementById('connected_user');
const connectButton = document.querySelector('button[type="submit"]');
const disconnectButton = document.getElementById('disconnectButton');
const para = document.createElement("h2");
const disconnectURL = '?wargame=&access=';
const CONNECT_ROUTE = 'connect'

const  isValidFormat = (text) => {
  // Define a regular expression pattern to match the format
  const pattern = /^\?wargame=[a-zA-Z0-9-]+&access=[a-zA-Z0-9-]+$/;

  // Use the test method to check if the text matches the pattern
  return pattern.test(text);
}

const extractLastSegmentFromUrl  = (url) => {
  const lastSlashIndex = url.lastIndexOf('/');
  if (lastSlashIndex !== -1) {
    return url.slice(lastSlashIndex + 1);
  } else {
    // Handle the case when there is no slash in the URL
    return url;
  }
};

const getURLParameters = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const params = {};
      
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

wargame_url.value = extractLastSegmentFromUrl(window.location.href)
// form.action = wargame_url.value

// wargame_url.addEventListener('change', function (e) {
//     // Your code to execute when the input value changes
//     // const inputValue = myInput.value;
//     form.action = e.target.value
//     console.log('Input value changed to:', inputValue);
// });
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

disconnectButton.addEventListener('click', async (event) => {
    event.preventDefault();
  try {
    const response = await fetch(`/${CONNECT_ROUTE}/${disconnectURL}`, {
      method: 'GET',
    });
    const result = await response.json();
      clearInterval(useInterval)

    if (result.length === 0) {
      para.remove();
      window.history.pushState({}, '', `/`)
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

const connectWargame =  async (event) => {
  event.preventDefault(); // Prevent the default form submission behavior
  const wargameUrl = wargame_url.value.trim();
  const validationResult = document.getElementById('validationResult');

  if (!wargameUrl) {
    validationResult.textContent = 'Please enter a valid URL';
    validationResult.style.color = 'red';
    return;
  }

  const textAfterLastSlash = await extractLastSegmentFromUrl(wargameUrl)
  // window.history.pushState({}, '', `${textAfterLastSlash}`)

  if (isValidFormat(textAfterLastSlash)) {
    try {
      const response = await fetch(`/connect/${textAfterLastSlash}`, {
        method: 'GET'
      });
      if (response.ok) {
        window.history.pushState({}, '', `${textAfterLastSlash}`)
        const result = await response.json();
          if (result !== null) {
            para.innerText = `Connected user: ${result.name}`;
            connected_user.appendChild(para);
            connectButton.style.display = 'none';
            disconnectButton.style.display = 'inline';
            validationResult.textContent = 'Connected successfully';
            validationResult.style.color = 'green';
            // useInterval()
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
}

connectButton.addEventListener('click', connectWargame);


//
// const useInterval = async () => {
// //   setInterval(async () => {
//     const response = await fetch(`/logs-latest/'wargame-l6nngxlk'`, {
//         method: 'GET'
//       });
//     console.log('response', response)
// // }, 20000)
// }



