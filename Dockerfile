FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install required system packages (ffmpeg + libs you listed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git build-essential libsm6 libxext6 libgl1-mesa-glx \
    libgirepository1.0-dev gir1.2-gtk-3.0 pkg-config libgtk-3-dev \
    libatlas-base-dev gfortran libhdf5-dev libjpeg-dev zlib1g-dev \
    libpng-dev libtiff-dev libwebp-dev libopenjp2-7-dev libavcodec-dev \
    libavformat-dev libswscale-dev libxvidcore-dev libx264-dev libx265-dev \
    libvpx-dev libfdk-aac-dev libmp3lame-dev libopus-dev libvorbis-dev \
    libtheora-dev libspeex-dev libfreetype6-dev libfontconfig1-dev python3-tk \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies first for better cache efficiency
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt || true

# Copy the rest of the application code
COPY . /app

# Ensure "python" command exists for compatibility
RUN ln -sf $(command -v python3) /usr/local/bin/python

# Expose the application port
EXPOSE 5000
ENV FLASK_APP=app.py

# Default command
CMD ["python", "app.py"]
