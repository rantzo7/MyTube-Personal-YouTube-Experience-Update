FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install system packages (ffmpeg, OpenCV libs, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git build-essential libsm6 libxext6 libgl1-mesa-glx \
    libgirepository1.0-dev gir1.2-gtk-3.0 pkg-config libgtk-3-dev \
    libatlas-base-dev gfortran libhdf5-dev libjpeg-dev zlib1g-dev \
    libpng-dev libtiff-dev libwebp-dev libopenjp2-7-dev libavcodec-dev \
    libavformat-dev libswscale-dev libxvidcore-dev libx264-dev libx265-dev \
    libvpx-dev libfdk-aac-dev libmp3lame-dev libopus-dev libvorbis-dev \
    libtheora-dev libspeex-dev libfreetype6-dev libfontconfig1-dev python3-tk \
 && rm -rf /var/lib/apt/lists/*

# Ensure `python` command points to python3
RUN ln -sf /usr/local/bin/python3 /usr/local/bin/python

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . /app

EXPOSE 5000
ENV FLASK_APP=app.py

# Always use python3 explicitly
CMD ["python3", "app.py"]
