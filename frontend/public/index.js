const DATA_URL = 'https://mmopaint-data.s3.eu-central-1.amazonaws.com/px8x8';

async function fetchData() {
  const res = await fetch(DATA_URL, {
    method: 'GET',
    mode: 'cors',
  });
  if (res.status !== 200) {
    console.log(res);
    console.log(res.headers);
    throw new Error(`Failed to fetch ${res.status}`);
  }
  return await res.text();
}

const root = document.querySelector('#root');
const status = document.querySelector('#status');
const pixels = {};

async function fetchAndApplyData(preloadedData) {
  const raw = preloadedData || await fetchData();
  const data = raw.replace(/(...)/g, '$1-').split(/-/).filter(Boolean).map(part => `#${part}`)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      pixels[`${x}-${y}`].style.background = data[x + (y * 8)];
    }
  }
}

function refresh(preloadedData) {
  fetchAndApplyData(preloadedData).catch(err => {
    console.warn('Error while refreshing', err);
    status.innerText = 'Status: Error';
  })
}

async function init() {



  console.log('TODO init');


  const socket = new WebSocket("wss://scuv0gmugl.execute-api.eu-central-1.amazonaws.com/Prod");
  socket.onopen = function (event) {
    status.innerText = 'Status: Connected';
    refresh();
  };

  socket.onmessage = (event) => {
    refresh(event.data);
  }

  socket.onerror = err => {
    console.warn('err', err);
  }

  socket.onclose = err => {
    console.warn('close', err);
  }



  const palette = document.querySelector('#palette');
  const allColors = ['f0f', 'ff0', '0ff', 'fff', '000', 'f00', '0f0', '00f'];
  let activePaletteNode;
  let activePaletteColor;
  function setActiveNode(node, color) {
    if (activePaletteNode) {
      activePaletteNode.setAttribute('data-active', 'false');
    }
    activePaletteNode = node;
    activePaletteColor = color;
    activePaletteNode.setAttribute('data-active', 'true');
  }
  allColors.forEach(col => {
    const node = document.createElement('div');
    node.className = 'predefinedColor';
    node.setAttribute('col', col);
    node.style.background = `#${col}`;
    palette.appendChild(node);
    node.onclick = () => {
      setActiveNode(node, col);
    }

    if (!activePaletteNode) {
      node.onclick();
    }
  });

  for (let customs = 0; customs < 6; customs++) {
    const node = document.createElement('div');
    node.className = 'predefinedColor';

    const clearer = document.createElement('div');
    clearer.className = 'clear';
    clearer.innerText = '\u00d7';
    node.appendChild(clearer);

    palette.appendChild(node);

    let pickedColor;
    clearer.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      node.classList.remove('defined');
      pickedColor = null;
      node.setAttribute('data-active', false);
      node.style.background = '';
    }
    node.onclick = () => {
      if (!pickedColor) {
        const col = window.prompt('Enter color. Format: RGB, where each color is a single character matching [0-9a-f]')
        if (/[0-9a-f]{3}/.test(col)) {
          pickedColor = col;
          node.style.background = `#${col}`;
          node.classList.add('defined');
        } else {
          alert('Invalid color! :(');
          return;
        }
      }
      setActiveNode(node, pickedColor);
    }

  }

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const node = document.createElement('div');
      node.className = 'cell';
      pixels[`${x}-${y}`] = node;
      if (x == 4 && y == 1) {
        node.style.background = 'green';
      }
      root.appendChild(node);

      node.onclick = () => {
        // const newBg = [
        //   'f0f', 'ff0', '0ff', 'fff', '000',
        //   'f00', '0f0', '00f'
        // ][Math.floor(8 * Math.random())];
        const newBg = activePaletteColor;
        console.log('newBg:', newBg);
        socket.send(JSON.stringify({
          action: 'sendmessage',
          body: 'foo',
          x,
          y,
          col: newBg,
        }));
        node.style.background = `#${newBg}`;
      };
    }
  }

  console.log('socket, please run');


}

init()
  .catch(err => console.warn('Failed to init', err));
