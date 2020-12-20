const DATA_URL = 'https://mmopaint-data.s3.eu-central-1.amazonaws.com/px8x8';
const GALLERY_BASE = 'https://mmopaint-data.s3.eu-central-1.amazonaws.com/gallery8x8/';

function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
      s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
  }
  return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
  };
}
function rgb2hsv (r, g, b) {
  let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
  rabs = r / 255;
  gabs = g / 255;
  babs = b / 255;
  v = Math.max(rabs, gabs, babs),
  diff = v - Math.min(rabs, gabs, babs);
  diffc = c => (v - c) / 6 / diff + 1 / 2;
  percentRoundFn = num => Math.round(num * 100) / 100;
  if (diff == 0) {
      h = s = 0;
  } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
          h = bb - gg;
      } else if (gabs === v) {
          h = (1 / 3) + rr - bb;
      } else if (babs === v) {
          h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
          h += 1;
      }else if (h > 1) {
          h -= 1;
      }
  }
  return {
      h: Math.round(h * 360),
      s: percentRoundFn(s * 100),
      v: percentRoundFn(v * 100)
  };
}

function showColorModal(callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalcontent = document.createElement('div');
  modalcontent.className = 'modalcontent';
  modal.append(modalcontent);

  modalcontent.innerHTML = document.getElementById('color-picker-template').innerHTML;


  /** @type {HTMLCanvasElement} */
  const canvas = modalcontent.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  /** @type {HTMLInputElement} */
  const input = modalcontent.querySelector('input');

  const colorAim = modalcontent.querySelector('.coloraim');

  /** @type {HTMLDivElement} */
  const dragger = modalcontent.querySelector('.dragger');

  let hue = 0.5; // "rotation"
  let saturation = 0.5; // x
  let value = 0.5; // y
  const imgData = ctx.createImageData(256, 256); // only do this once per page
  const dataArr = imgData.data;
  function updateCanvas() {
    for (let x = 0; x < 256; x++ ) {
      for (let y = 0; y < 256; y++ ) {
        const { r, g, b } = HSVtoRGB(hue, x / 256, 1.0 - (y / 256));
        const index = (x + (y * 256)) * 4;
        dataArr[index]   = r;
        dataArr[index + 1]   = g;
        dataArr[index + 2]   = b;
        dataArr[index + 3]   = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const newBg = HSVtoRGB(hue, saturation, value);
    modal.style.backgroundColor = `rgb(${newBg.r * 1}, ${newBg.g * 1}, ${newBg.b * 1})`;

    const show = (val) => Math.max(0, Math.min(15, Math.round(val/16))).toString(16);
    input.value = `#${show(newBg.r)}${show(newBg.g)}${show(newBg.b)}`

    colorAim.style.left = `${saturation * 100}%`;
    colorAim.style.top = `${(1 - value) * 100}%`;

    dragger.style.marginLeft = `${hue * 100}%`;
  }

  const readInput = () => {
    const val = input.value;
    if (/^#[0-9a-f]{3}$/.test(val)) {
      const parseNum = num =>parseInt(num, '16') * 16;
      const [r, g, b] = [...val.slice(1)].map(parseNum);
      const { h, s, v } = rgb2hsv(r, g, b);
      hue = h / 360;
      saturation = s / 100;
      value = v / 100;
      updateCanvas();
    }
  }
  input.onchange= () => {
    readInput();
  };
  input.onkeyup = () => {
    readInput();
  }
  updateCanvas();

  {
    let isDragging = false;

    colorAim.style.left = `50%`;
    colorAim.style.top = `50%`;
    const handleCanvasEvent = (x, y) => {
      saturation = x / canvas.clientWidth;
      value = 1 - (y / canvas.clientWidth);
      // hue = relX;
      updateCanvas();
    };
    canvas.onmousedown = (e) => {
      isDragging = true;
      if (e.target === canvas) {
        e.stopPropagation();
        handleCanvasEvent(e.offsetX, e.offsetY);
      }
    }
    canvas.onmousemove = (e) => {
      if (isDragging && e.target === canvas) {
        handleCanvasEvent(e.offsetX, e.offsetY);
      }
    }
    canvas.onmouseup = () => {
      isDragging = false;
    }

    modalcontent.querySelector('.cancel').onclick = () => {
      modal.remove();
      callback(null);
    }
    modalcontent.querySelector('.ok').onclick = () => {
      modal.remove();
      const newBg = HSVtoRGB(hue, saturation, value);
      const show = (val) => Math.max(0, Math.min(15, Math.round(val/16))).toString(16);
      callback(`${show(newBg.r)}${show(newBg.g)}${show(newBg.b)}`);
    };
  }

  /** @type {HTMLDivElement} */
  const hueslider = modalcontent.querySelector('.hueslider');
  let isDragging = false;

  const update = (x) => {
    hue = x / hueslider.clientWidth;

    updateCanvas();
  };
  hueslider.onmousedown = (e) => {
    isDragging = true;
    if (e.target === hueslider) {
      update(e.offsetX);
    }
  }
  hueslider.onmousemove = (e) => {
    if (isDragging && e.target === hueslider) {
      update(e.offsetX);
    }
  }
  hueslider.onmouseup = () => {
    isDragging = false;
  }

  document.body.appendChild(modal);
}

const gallery = document.getElementById('gallery');
async function refreshGallery() {
  const images = await Promise.all([...Array(16).fill(0)].map(
    (_,idx) => fetch(`${GALLERY_BASE}img${idx}`, { method: 'GET', mode: 'cors'})
    .then(res =>  {
      if (res.status === 200) {
        return res.text();
      }
      throw new Error('Failed to fetch image');
    })
    .catch(() => ''))
  );

  gallery.innerHTML = '';
  for (let i = 0; i < images.length; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(32, 32);
    const dataArr = imgData.data;

    if (images[i]) {
      for (let x = 0; x < 32; x++ ) {
        for (let y = 0; y < 32; y++ ) {
          const index = (x + (y * 32)) * 4;

          const downscaledX = Math.floor(x * 8 / 32);
          const downscaledY = Math.floor(y * 8 / 32);
          const pixelSliceStart = (downscaledX + (downscaledY * 8)) * 3;
          const pixelSlice = images[i].slice(pixelSliceStart, pixelSliceStart + 3);
          dataArr[index]   = parseInt(pixelSlice[0], '16') * 16;
          dataArr[index + 1]   = parseInt(pixelSlice[1], '16') * 16;
          dataArr[index + 2]   = parseInt(pixelSlice[2], '16') * 16;
          dataArr[index + 3]   = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    gallery.appendChild(img);
  }
}

async function fetchData() {
  const res = await fetch(DATA_URL, {
    method: 'GET',
    mode: 'cors',
  });
  if (res.status !== 200) {
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

function updateStatus(state) {
  status.innerText = `Status: ${state}`;
}

function refresh(preloadedData) {
  fetchAndApplyData(preloadedData).catch(err => {
    console.warn('Error while refreshing', err);
    updateStatus('Error');
  })
}

async function init() {
  await refreshGallery();

  const socket = new WebSocket("wss://scuv0gmugl.execute-api.eu-central-1.amazonaws.com/Prod");
  socket.onopen = function (event) {
    updateStatus('Connected');
    refresh();
  };

  socket.onmessage = (event) => {
    if (event.data === 'gallery') {
      refreshGallery().catch(console.warn);
    }
    refresh(event.data);
  }

  socket.onerror = err => {
    console.warn('Socket Error:', err);
    updateStatus('Error');
  }

  socket.onclose = err => {
    updateStatus('Disconnected');
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
    const localStorageKey = `mmopaint-custom-${customs}`;

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
    const handlePickedColor = (newVal) => {
      localStorage.setItem
      pickedColor = newVal;
      node.style.background = `#${newVal}`;
      node.classList.add('defined');
      setActiveNode(node, pickedColor);
    }
    const preloadedValue = localStorage.getItem(localStorageKey);
    if (preloadedValue && /[0-9a-f{3}]/.test(preloadedValue)) {
      handlePickedColor(preloadedValue);
    }
    node.onclick = () => {
      if (!pickedColor) {
        showColorModal((newVal) => {
          if (newVal) {
            localStorage.setItem(localStorageKey, newVal);
            handlePickedColor(newVal);
          }
        });
        // const col = window.prompt('Enter color. Format: RGB, where each color is a single character matching [0-9a-f]')
        // if (/[0-9a-f]{3}/.test(col)) {
        //   pickedColor = col;
        //   node.style.background = `#${col}`;
        //   node.classList.add('defined');
        // } else {
        //   alert('Invalid color! :(');
        //   return;
        // }
      }
      setActiveNode(node, pickedColor);
    }

  }

  document.getElementById('addToGallery').onclick = () => {
    (async () => {
      socket.send(JSON.stringify({
        action: 'sendmessage',
        body: 'foo',
        addToGallery: true,
      }));
    })()
      .catch(console.warn);
  };
  document.getElementById('download').onclick = () => {
    const scale = prompt('Enter image scale (1 = 8x8 pixels, 2=16x16 etc)', '1')
    if (!scale) {
      return;
    }
    const scaledSize = parseInt(scale, '10') * 8;
    if (scaledSize <= 0) {
      alert('Oh, you. Please enter a number >= 1');
      return;
    }
    if (scaledSize > 1024) {
      alert('Too large. Please enter a number number <= 128');
      return;
    }

    (async () => {
      const pixels = await fetchData();
      const canvas = document.createElement('canvas');
      canvas.width = scaledSize;
      canvas.height = scaledSize;
      const ctx = canvas.getContext('2d');

      const imgData = ctx.createImageData(scaledSize, scaledSize);
      const dataArr = imgData.data;

      for (let x = 0; x < scaledSize; x++ ) {
        for (let y = 0; y < scaledSize; y++ ) {
          const index = (x + (y * scaledSize)) * 4;

          const downscaledX = Math.floor(x * 8 / scaledSize);
          const downscaledY = Math.floor(y * 8 / scaledSize);
          const pixelSliceStart = (downscaledX + (downscaledY * 8)) * 3;
          const pixelSlice = pixels.slice(pixelSliceStart, pixelSliceStart + 3);
          dataArr[index]   = parseInt(pixelSlice[0], '16') * 16;
          dataArr[index + 1]   = parseInt(pixelSlice[1], '16') * 16;
          dataArr[index + 2]   = parseInt(pixelSlice[2], '16') * 16;
          dataArr[index + 3]   = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((b) => {
        var a = document.createElement('a');
        a.textContent = 'Download';
        a.download = 'painting.png';
        a.href = window.URL.createObjectURL(b);
        a.click();
      });
    })()
      .catch(console.warn);
  };

  document.getElementById('save').onclick = () => {
    (async () => {
      const data = await fetchData();
      await navigator.clipboard.writeText(data);
      alert('Image stored in your clipboard, restore it later with the Load button');
    })()
      .catch(console.warn);
  };

  document.getElementById('load').onclick = () => {
    const data = window.prompt('Please enter the saved string');;
    if (!data) {
      return;
    }
    if (!/^[a-z0-9]{192}$/.test(data)) {
      alert('Invalid color, did it really originate from the save button?');
      return;
    }

    socket.send(JSON.stringify({
      action: 'sendmessage',
      body: 'foo',
      x: 0,
      y: 0,
      col: data,
    }));
  };

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const node = document.createElement('div');
      node.className = 'cell';
      pixels[`${x}-${y}`] = node;
      root.appendChild(node);

      node.onclick = () => {
        const newBg = activePaletteColor;
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
}

init()
  .catch(err => console.warn('Failed to init', err));

