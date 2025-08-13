# Use an official Python runtime as a parent image
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# useful small set + ffmpeg + git
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates apt-transport-https gnupg curl software-properties-common \
    ffmpeg git python3-pip python3-dev build-essential libsm6 libxext6 python3 python3-venv python3-setuptools python3-wheel libgl1-mesa-glx libgirepository1.0-dev gir1.2-gtk-3.0 pkg-config libgtk-3-dev libatlas-base-dev gfortran libhdf5-dev libjpeg-dev zlib1g-dev libpng-dev libtiff-dev libwebp-dev libopenjp2-7-dev libavcodec-dev libavformat-dev libswscale-dev libxvidcore-dev libx264-dev libx265-dev libvpx-dev libfdk-aac-dev libmp3lame-dev libopus-dev libvorbis-dev libtheora-dev libspeex-dev libfreetype6-dev libfontconfig1-dev python3-tk \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed Python packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 5000

# Define environment variable
ENV FLASK_APP=app.py

# Run the application
CMD ["python", "app.py"]
# Example fragment to add somewhere after python3 is installed
# create a consistent python -> python3 symlink
RUN ln -sf "$(command -v python3)" /usr/local/bin/python
