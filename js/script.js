const API_KEY = 'yDhqD1iDKvZtpFcDjvXiZ9Ngpnj6BM9vALw7lPtX';

// Grab the controls we need from the DOM
const startInput = document.getElementById('start-date');
const endInput = document.getElementById('end-date');
const dateForm = document.getElementById('date-form');
const gallery = document.getElementById('gallery');
const factBox = document.getElementById('space-fact');

// Modal elements that show the larger APOD view
const modal = document.getElementById('apod-modal');
const modalMedia = document.getElementById('modal-media');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalExplanation = document.getElementById('modal-explanation');
const modalCloseBtn = document.getElementById('modal-close');

const spaceFacts = [
  'A single day on Venus lasts longer than an entire Venusian year.',
  'Neutron stars can spin 600 times per second after being born in a supernova.',
  'The footprints left on the Moon could last for millions of years because there is no wind.',
  'Jupiter is so large that more than 1,300 Earths could fit inside it.',
  'Saturn’s rings are mostly water ice chunks ranging in size from dust grains to boulders.',
  'Mars has the tallest volcano in the solar system: Olympus Mons, nearly three times the height of Everest.'
];

setupDateInputs(startInput, endInput);
displayRandomFact();
renderStatusMessage('Select a date range and click "Get Space Images" to explore APOD images.');

function displayRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factBox.textContent = spaceFacts[randomIndex];
}

// Build the APOD API URL using template literals
function buildApodUrl(startDate, endDate) {
  return `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
}

// Fetch APOD data for the given date range
async function fetchApodImages(startDate, endDate) {
  const response = await fetch(buildApodUrl(startDate, endDate));

  if (!response.ok) {
    throw new Error('NASA API request failed');
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [payload];
}

// Reuse a simple placeholder block for status messages
function renderStatusMessage(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon" aria-hidden="true">*</div>
      <p>${message}</p>
    </div>
  `;
}

// Create gallery cards for each NASA image returned
function renderGalleryItems(items) {
  if (!items.length) {
    renderStatusMessage('No image results for that range. Try a different set of dates.');
    return;
  }

  gallery.innerHTML = '';

  const orderedItems = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

  orderedItems.forEach((item) => {
    const isVideo = item.media_type === 'video';
    const previewSrc = isVideo ? (item.thumbnail_url || '') : item.url;

    const card = document.createElement('article');
    card.className = 'gallery-item';
    card.setAttribute('data-media-type', item.media_type);

    card.innerHTML = `
      ${previewSrc
        ? `<div class="media-wrapper">
            ${isVideo ? '<span class="media-badge">Video</span><span class="play-icon" aria-hidden="true">▶</span>' : ''}
            <img src="${previewSrc}" alt="${item.title}" class="gallery-image" />
          </div>`
        : '<div class="no-preview">Preview not available</div>'}
      <h3>${item.title}</h3>
      <p>${item.date}</p>
    `;

    card.addEventListener('click', () => openModal(item));
    gallery.appendChild(card);
  });

  if (!gallery.children.length) {
    renderStatusMessage('This range returned videos only. Pick new dates for image results.');
  }
}

// Handle the date form submission and load fresh images
async function handleFormSubmit(event) {
  event.preventDefault();

  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderStatusMessage('Please choose both a start date and an end date.');
    return;
  }

  if (startDate > endDate) {
    renderStatusMessage('Start date must be on or before the end date.');
    endInput.focus();
    return;
  }

  renderStatusMessage('Loading imagery from NASA...');

  try {
    const apodItems = await fetchApodImages(startDate, endDate);
    renderGalleryItems(apodItems);
  } catch (error) {
    console.error(error);
    renderStatusMessage('Unable to reach NASA right now. Please try again in a moment.');
  }
}

// Display the clicked APOD item inside the modal window
function openModal(item) {
  modalMedia.innerHTML = '';

  if (item.media_type === 'image') {
    const img = document.createElement('img');
    img.src = item.hdurl || item.url;
    img.alt = item.title;
    modalMedia.appendChild(img);
  } else if (item.media_type === 'video') {
    const videoElement = createVideoElement(item.url, item.title);
    modalMedia.appendChild(videoElement);
  } else {
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View this APOD entry';
    modalMedia.appendChild(link);
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
  modal.classList.remove('hidden');
}

// Hide the modal and reset the image src for better performance
function closeModal() {
  modal.classList.add('hidden');
  modalMedia.innerHTML = '';
}

function createVideoElement(url, title) {
  const embedConfig = resolveVideoEmbed(url);

  if (embedConfig.type === 'iframe') {
    const iframe = document.createElement('iframe');
    iframe.src = embedConfig.src;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    return iframe;
  }

  if (embedConfig.type === 'video') {
    const video = document.createElement('video');
    video.src = embedConfig.src;
    video.controls = true;
    video.title = title;
    return video;
  }

  const link = document.createElement('a');
  link.href = embedConfig.src;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Watch this NASA video in a new tab';
  return link;
}

function resolveVideoEmbed(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      const videoId = parsed.searchParams.get('v');
      return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` };
    }

    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '');
      return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` };
    }

    if (parsed.pathname.endsWith('.mp4')) {
      return { type: 'video', src: url };
    }
  } catch (error) {
    console.warn('Unable to parse video URL', error);
  }

  return { type: 'link', src: url };
}

modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

dateForm.addEventListener('submit', handleFormSubmit);
