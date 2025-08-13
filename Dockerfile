FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install required system packages (ffmpeg + libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git build-essential libsm6 libxext6 libgl1-mesa-glx \
    libgirepository1.0-dev gir1.2-gtk-3.0 pkg-config libgtk-3-dev \
    libatlas-base-dev gfortran libhdf5-dev libjpeg-dev zlib1g-dev \
    libpng-dev libtiff-dev libwebp-dev libopenjp2-7-dev libavcodec-dev \
    libavformat-dev libswscale-dev libxvidcore-dev libx264-dev libx265-dev \
    libvpx-dev libfdk-aac-dev libmp3lame-dev libopus-dev libvorbis-dev \
    libtheora-dev libspeex-dev libfreetype6-dev libfontconfig1-dev python3-tk \
    python-is-python3 \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt || true

# Copy app source
COPY . /app

# Expose app port
EXPOSE 5000
ENV FLASK_APP=app.py

# Use python3 explicitly
CMD ["python3", "app.py"]
