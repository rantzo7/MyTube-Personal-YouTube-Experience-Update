FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates apt-transport-https gnupg curl software-properties-common \
    ffmpeg git python3-pip python3-dev build-essential libsm6 libxext6 \
    python3-venv python3-setuptools python3-wheel libgl1-mesa-glx \
    libgirepository1.0-dev gir1.2-gtk-3.0 pkg-config libgtk-3-dev \
    libatlas-base-dev gfortran libhdf5-dev libjpeg-dev zlib1g-dev \
    libpng-dev libtiff-dev libwebp-dev libopenjp2-7-dev \
    libavcodec-dev libavformat-dev libswscale-dev libxvidcore-dev \
    libx264-dev libx265-dev libvpx-dev libfdk-aac-dev libmp3lame-dev \
    libopus-dev libvorbis-dev libtheora-dev libspeex-dev \
    libfreetype6-dev libfontconfig1-dev python3-tk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

# install with python3 -m pip to be explicit
RUN python3 -m pip install --no-cache-dir -r requirements.txt || true

# create the python -> python3 symlink BEFORE CMD so runtime can find 'python'
RUN ln -sf "$(command -v python3)" /usr/local/bin/python

EXPOSE 5000
ENV FLASK_APP=app.py

CMD ["python", "app.py"]
