const API_KEY = 'yDhqD1iDKvZtpFcDjvXiZ9Ngpnj6BM9vALw7lPtX';

// Grab the controls we need from the DOM
const startInput = document.getElementById('start-date');
const endInput = document.getElementById('end-date');
const dateForm = document.getElementById('date-form');
const gallery = document.getElementById('gallery');

// Modal elements that show the larger APOD view
const modal = document.getElementById('apod-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalExplanation = document.getElementById('modal-explanation');
const modalCloseBtn = document.getElementById('modal-close');

setupDateInputs(startInput, endInput);
renderStatusMessage('Select a date range and click "Get Space Images" to explore APOD images.');

// Build the APOD API URL using template literals
function buildApodUrl(startDate, endDate) {
  return `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;
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
    if (item.media_type !== 'image') {
      return;
    }

    const card = document.createElement('article');
    card.className = 'gallery-item';
    card.innerHTML = `
      <img src="${item.url}" alt="${item.title}" />
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

  if (startDate > endDate) {
    alert('Start date should be before the end date.');
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
  modalImage.src = item.hdurl || item.url;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
  modal.classList.remove('hidden');
}

// Hide the modal and reset the image src for better performance
function closeModal() {
  modal.classList.add('hidden');
  modalImage.removeAttribute('src');
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
