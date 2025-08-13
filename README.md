# MyTube - Personal YouTube Experience

This project allows you to download YouTube videos, manage a video library, and track download progress. It's designed to be easily deployable on a Virtual Private Server (VPS) using Docker Compose.

## Features

- **Single Video Download**: Download individual YouTube videos by URL.
- **Batch Video Download**: Download multiple YouTube videos by providing a list of URLs.
- **Download Progress Tracking**: Monitor the progress of your downloads in real-time.
- **Video Library**: Manage and view your downloaded videos.
- **Dockerized Deployment**: Easy setup and deployment using Docker and Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed on your VPS:

- **Docker**: [Install Docker](https://docs.docker.com/engine/install/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Installation and Setup (for VPS Deployment)

Follow these steps to get MyTube up and running on your VPS:

1.  **Clone the Repository**:
    First, connect to your VPS via SSH and clone this repository:

    ```bash
    git clone <repository_url>
    cd MyTube-Personal-YouTube-Experience-main
    ```

    (Replace `<repository_url>` with the actual URL of your Git repository.)

2.  **Build and Run with Docker Compose**:
    Navigate to the root directory of the cloned project (where `docker-compose.yml` is located) and run the following command:

    ```bash
    docker-compose up --build -d
    ```

    - `--build`: This flag forces Docker Compose to rebuild the images. This is important for the initial setup and whenever you make changes to the `Dockerfile` or `requirements.txt`.
    - `-d`: This flag runs the services in detached mode, meaning they will run in the background.

    This command will:

    - Build the Docker images for the `web` (Flask application) and `worker` (RQ worker) services based on the `Dockerfile`.
    - Pull the `redis` image.
    - Start all three services (`redis`, `web`, `worker`).
    - Automatically handle all Python dependencies (from `requirements.txt`) and system dependencies like `ffmpeg` (specified in `Dockerfile`).

3.  **Access the Application**:
    Once the services are up and running, the Flask application will be accessible via your VPS's IP address on port `5000`.
    Open your web browser and navigate to:
    ```
    http://your_vps_ip_address:5000
    ```
    (Replace `your_vps_ip_address` with the actual IP address of your VPS.)

## Stopping the Application

To stop all running services, navigate to the project's root directory and run:

```bash
docker-compose down
```

This will stop and remove the containers, networks, and volumes created by `docker-compose up`.

## Troubleshooting

- **`net::ERR_CONNECTION_REFUSED`**: Ensure that port `5000` is open on your VPS's firewall and that the Docker containers are running. You can check the status of your Docker containers with `docker-compose ps`.
- **Download Issues**: Check the logs of the `worker` service for any errors:
  ```bash
  docker-compose logs worker
  ```
- **Frontend Issues**: Check the browser's developer console for JavaScript errors.

If you encounter any issues, please refer to the Docker and Docker Compose documentation for further assistance.
