import 'video.js/dist/video-js.css';
import videojs from 'video.js';

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const tabContents = document.querySelectorAll('.tab-content');
  const videoModal = document.getElementById('video-modal');
  const closeModalButton = document.querySelector('.close-button');
  const videoPlayerElement = document.getElementById('video-player');
  let player; // To hold the Video.js player instance

  // Initialize Video.js player when the modal is opened
  function initializeVideoPlayer() {
    if (!player) {
      player = videojs(videoPlayerElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true // Makes the player responsive
      });
    }
  }

  // Tab switching logic
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Remove active class from all nav links and hide all tab contents
      navLinks.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to the clicked nav link and show its corresponding tab content
      link.classList.add('active');
      const targetTab = document.getElementById(`${link.dataset.tab}-tab`);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });

  // Placeholder for download functionality
  document.getElementById('download-single-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('single-url-input');
    const url = urlInput.value.trim();
    if (url) {
      try {
        const response = await fetch('/api/download/single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: url }),
        });
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          addVideoToQueue(`Video from ${url.substring(0, 30)}...`, 'Queued', 0, data.job_id);
          urlInput.value = '';
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error('Error initiating download:', error);
        alert('Error initiating download. Please try again.');
      }
    } else {
      alert('Please enter a YouTube URL.');
    }
  });

  document.getElementById('download-batch-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('batch-url-input');
    const urls = urlInput.value.split('\n').map(url => url.trim()).filter(url => url !== '');
    if (urls.length > 0) {
      try {
        const response = await fetch('/api/download/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ urls: urls }),
        });
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          urls.forEach((url, index) => {
            addVideoToQueue(`Batch Video ${index + 1} from ${url.substring(0, 30)}...`, 'Queued', 0, data.job_id);
          });
          urlInput.value = '';
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error('Error initiating batch download:', error);
        alert('Error initiating batch download. Please try again.');
      }
    } else {
      alert('Please enter at least one YouTube URL for batch download.');
    }
  });

  const activeDownloads = {}; // Store active download jobs

  function addVideoToQueue(title, status, progress, jobId = null) {
    const queueList = document.getElementById('queue-list');
    const emptyState = queueList.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const queueItem = document.createElement('div');
    queueItem.classList.add('queue-item');
    if (jobId) {
      queueItem.dataset.jobId = jobId;
      activeDownloads[jobId] = queueItem; // Store reference to the item
    }
    queueItem.innerHTML = `
      <div class="queue-item-info">
        <div class="queue-item-title">${title}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progress}%;"></div>
        </div>
      </div>
      <div class="queue-item-status">${status}</div>
    `;
    queueList.prepend(queueItem); // Add to top of the list

    if (jobId) {
      pollDownloadStatus(jobId);
    }
  }

  async function pollDownloadStatus(jobId) {
    const queueItem = activeDownloads[jobId];
    if (!queueItem) return;

    const statusElement = queueItem.querySelector('.queue-item-status');
    const progressBar = queueItem.querySelector('.progress-bar');

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/download/status/${jobId}`);
        const data = await response.json();

        if (response.ok) {
          statusElement.textContent = data.status;
          if (data.status === 'started' || data.status === 'queued' || data.status === 'deferred') {
            statusElement.textContent = data.status;
          } else if (data.status === 'finished') {
            statusElement.textContent = 'Completed';
            progressBar.style.width = '100%';
            clearInterval(interval);
            delete activeDownloads[jobId];
          } else if (data.status === 'failed') {
            statusElement.textContent = 'Failed';
            progressBar.style.width = '0%';
            clearInterval(interval);
            delete activeDownloads[jobId];
          } else if (data.status === 'stopped') {
            statusElement.textContent = 'Stopped';
            progressBar.style.width = '0%';
            clearInterval(interval);
            delete activeDownloads[jobId];
          }

          // Update progress bar if available in job meta
          if (data.result && data.result.progress !== undefined) {
            progressBar.style.width = `${data.result.progress}%`;
          } else if (data.job_meta && data.job_meta.progress !== undefined) {
            progressBar.style.width = `${data.job_meta.progress}%`;
          }

          if (data.status === 'finished' || data.status === 'failed') {
            clearInterval(interval);
            delete activeDownloads[jobId];
            if (data.status === 'finished') {
              // Optionally, refresh the video library or add the new video to the grid
              // For now, just update status
              statusElement.textContent = 'Completed';
            } else {
              statusElement.textContent = 'Failed';
            }
          }
        } else {
          console.error(`Error fetching status for job ${jobId}:`, data.error);
          clearInterval(interval);
          statusElement.textContent = 'Error';
          delete activeDownloads[jobId];
        }
      } catch (error) {
        console.error(`Network error fetching status for job ${jobId}:`, error);
        clearInterval(interval);
        statusElement.textContent = 'Network Error';
        delete activeDownloads[jobId];
      }
    }, 3000); // Poll every 3 seconds
  }

  // Placeholder for library functionality
  const videoGrid = document.getElementById('video-grid');
  const searchInput = document.getElementById('search-input');

  let currentVideoId = null; // To store the ID of the currently playing video

  // Function to fetch and display videos in the library
  async function fetchAndDisplayVideos() {
    try {
      const response = await fetch('/api/videos');
      const videos = await response.json();
      videoGrid.innerHTML = ''; // Clear existing videos

      if (videos.length === 0) {
        videoGrid.innerHTML = '<p class="empty-state">Your library is empty. Download some videos to get started!</p>';
        return;
      }

      videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.classList.add('video-card');
        videoCard.dataset.videoId = video.id;
        videoCard.innerHTML = `
          <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
          <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.description ? video.description.substring(0, 100) + '...' : 'No description available.'}</p>
            <button class="play-button" data-video-id="${video.id}">Play</button>
          </div>
        `;
        videoGrid.appendChild(videoCard);
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      videoGrid.innerHTML = '<p class="empty-state">Error loading videos. Please try again later.</p>';
    }
  }

  // Event listener for the Library tab to fetch videos when activated
  document.querySelector('.nav-link[data-tab="library"]').addEventListener('click', fetchAndDisplayVideos);

  // Initial fetch when the page loads if Library tab is active by default (though Download is active)
  // fetchAndDisplayVideos(); // Uncomment if Library is default tab

  // Handle play button click
  videoGrid.addEventListener('click', (event) => {
    if (event.target.classList.contains('play-button')) {
      const videoId = event.target.dataset.videoId;
      currentVideoId = videoId;
      const videoSource = `/videos/${videoId}.mp4`; // Assuming .mp4 format

      initializeVideoPlayer();
      player.src({ type: 'video/mp4', src: videoSource });
      player.load();
      player.play();

      videoModal.style.display = 'block';

      // Clear previous transcript and summary
      document.getElementById('transcript-display').value = '';
      document.getElementById('summary-display').value = '';
      document.getElementById('summarize-transcript-btn').disabled = true;
    }
  });

  // Close modal
  closeModalButton.addEventListener('click', () => {
    videoModal.style.display = 'none';
    if (player) {
      player.pause();
    }
  });

  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === videoModal) {
      videoModal.style.display = 'none';
      if (player) {
        player.pause();
      }
    }
  });

  // Fetch Transcript button handler
  document.getElementById('fetch-transcript-btn').addEventListener('click', async () => {
    if (!currentVideoId) return;

    const transcriptDisplay = document.getElementById('transcript-display');
    transcriptDisplay.value = 'Fetching transcript...';
    document.getElementById('summarize-transcript-btn').disabled = true;

    try {
      const response = await fetch(`/api/videos/${currentVideoId}/transcript`);
      const data = await response.json();

      if (response.ok && data.transcript) {
        transcriptDisplay.value = data.transcript;
        document.getElementById('summarize-transcript-btn').disabled = false;
      } else {
        transcriptDisplay.value = data.error || 'Error fetching transcript.';
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      transcriptDisplay.value = 'Network error fetching transcript.';
    }
  });

  // Summarize Transcript button handler
  document.getElementById('summarize-transcript-btn').addEventListener('click', async () => {
    if (!currentVideoId) return;

    const transcriptText = document.getElementById('transcript-display').value;
    if (!transcriptText || transcriptText === 'Fetching transcript...' || transcriptText === 'Error fetching transcript.' || transcriptText === 'Network error fetching transcript.') {
      alert('Please fetch the transcript first.');
      return;
    }

    const summaryDisplay = document.getElementById('summary-display');
    summaryDisplay.value = 'Generating summary...';

    try {
      const response = await fetch(`/api/videos/${currentVideoId}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      });
      const data = await response.json();

      if (response.ok && data.summary) {
        summaryDisplay.value = data.summary;
      } else {
        summaryDisplay.value = data.error || 'Error generating summary.';
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      summaryDisplay.value = 'Network error generating summary.';
    }
  });

  // Search functionality (to be implemented or refined)
  searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      if (title.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });





  // Video player and analysis view logic
  videoGrid.addEventListener('click', (event) => {
    const videoItem = event.target.closest('.video-grid-item');
    if (videoItem) {
      const videoId = videoItem.dataset.videoId;
      // In a real app, fetch actual video URL from backend based on videoId
      // Fetch actual video URL from backend based on videoId
      fetch(`/api/videos/${videoId}`)
        .then(response => response.json())
        .then(videoData => {
          if (videoData && videoData.file_path) {
            const videoUrl = `/videos/${videoData.file_path.split('/').pop()}`;
            initializeVideoPlayer(); // Ensure player is initialized
            player.src({ src: videoUrl, type: 'video/mp4' });
            player.load();
            player.play();
          } else {
            console.error('Video data or file path not found:', videoData);
            alert('Could not find video source.');
          }
        })
        .catch(error => {
          console.error('Error fetching video data:', error);
          alert('Error fetching video data.');
         });

      // Reset analysis tools
      document.getElementById('transcript-display').value = '';
      document.getElementById('summary-display').value = '';
      document.getElementById('summarize-transcript-btn').disabled = true;

      videoModal.style.display = 'block';
    }
  });

  closeModalButton.addEventListener('click', () => {
    videoModal.style.display = 'none';
    if (player) {
      player.pause();
      player.currentTime(0); // Reset video to start
    }
  });

  window.addEventListener('click', (event) => {
    if (event.target === videoModal) {
      videoModal.style.display = 'none';
      if (player) {
        player.pause();
        player.currentTime(0);
      }
    }
  });

  // Placeholder for transcript and summary functionality
  document.getElementById('fetch-transcript-btn').addEventListener('click', () => {
    const transcriptDisplay = document.getElementById('transcript-display');
    const summarizeButton = document.getElementById('summarize-transcript-btn');
    transcriptDisplay.value = 'Fetching transcript... Please wait.';
    summarizeButton.disabled = true;

    // Simulate API call
    setTimeout(() => {
      const dummyTranscript = `This is a comprehensive dummy transcript for demonstration purposes, showcasing how detailed video content can be displayed. 
      In a real application, this data would be dynamically fetched from the backend using the 'youtube-transcript-api' based on the currently playing video.
      The transcript provides a full textual representation of the spoken content, enabling users to easily read along, search for specific keywords, or quickly grasp the video's narrative without watching it entirely.
      This section is designed to be scrollable, accommodating very long transcripts, and will be a crucial tool for content analysis and accessibility.
      It allows for quick navigation to specific points in the video if integrated with timestamps.`;
      transcriptDisplay.value = dummyTranscript;
      summarizeButton.disabled = false;
    }, 1500);
  });

  document.getElementById('summarize-transcript-btn').addEventListener('click', () => {
    const transcript = document.getElementById('transcript-display').value;
    const summaryDisplay = document.getElementById('summary-display');
    if (!transcript || transcript === 'Fetching transcript...') {
      alert('Please fetch the transcript first before attempting to summarize.');
      return;
    }
    summaryDisplay.value = 'Generating AI-powered summary... This might take a moment.';

    // Simulate API call to Gemini API
    setTimeout(() => {
      const dummySummary = `This is a concise, AI-generated summary of the video transcript, powered by the Gemini API. 
      It distills the core message and key takeaways, providing a quick overview of the video's content.
      The summary aims to save users time by offering the essence of the video without requiring them to read the full transcript or watch the entire duration.
      It focuses on the most important points and conclusions presented in the video.`;
      summaryDisplay.value = dummySummary;
    }, 2000);
  });
});
