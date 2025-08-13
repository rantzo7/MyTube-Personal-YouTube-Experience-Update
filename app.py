from flask import Flask, request, jsonify, send_from_directory
from werkzeug.exceptions import HTTPException
import json
import os
import uuid
from dotenv import load_dotenv
from mytube_queue import q
from downloader import download_single_video, download_batch_videos
from database import get_all_videos, get_video_metadata
from analysis import fetch_transcript, summarize_text_with_gemini
from flask import Flask, request, jsonify, send_from_directory

load_dotenv()

app = Flask(__name__, static_folder='dist', static_url_path='')

app.config["REDIS_URL"] = os.environ.get("REDIS_URL", "redis://redis:6379/0")


# Load video download path from config.json
with open('config.json', 'r') as f:
    config = json.load(f)
VIDEO_DOWNLOAD_PATH = config.get("video_download_path", "./videos")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/download/single', methods=['POST'])
def download_single():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Enqueue the download task
    job_id = str(uuid.uuid4())
    job = q.enqueue(download_single_video, args=(url, VIDEO_DOWNLOAD_PATH, job_id), job_id=job_id)
    return jsonify({"message": "Download initiated", "job_id": job.id}), 202

@app.route('/api/download/batch', methods=['POST'])
def download_batch():
    data = request.json
    urls = data.get('urls')
    if not urls or not isinstance(urls, list):
        return jsonify({"error": "List of URLs is required"}), 400

    # Enqueue the batch download task
    job_id = str(uuid.uuid4())
    job = q.enqueue(download_batch_videos, args=(urls, VIDEO_DOWNLOAD_PATH, job_id), job_id=job_id)
    return jsonify({"message": "Batch download initiated", "job_id": job.id}), 202

@app.route('/api/download/status/<job_id>', methods=['GET'])
def get_download_status(job_id):
    try:
        job = q.fetch_job(job_id)
        if job:
            return jsonify({"job_id": job.id, "status": job.get_status(), "result": job.result, "job_meta": job.meta}), 200
        return jsonify({"error": "Job not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/videos', methods=['GET'])
def get_videos():
    videos = get_all_videos()
    return jsonify(videos), 200

@app.route('/api/videos/<video_id>', methods=['GET'])
def get_single_video(video_id):
    video_metadata = get_video_metadata(video_id)
    if video_metadata:
        return jsonify(video_metadata), 200
    return jsonify({"error": "Video not found"}), 404

@app.route('/api/videos/<video_id>/transcript', methods=['GET'])
def get_video_transcript(video_id):
    transcript = fetch_transcript(video_id)
    if transcript:
        return jsonify({"video_id": video_id, "transcript": transcript}), 200
    return jsonify({"error": "Transcript not found or error fetching"}), 404

@app.route('/api/videos/<video_id>/summarize', methods=['POST'])
def summarize_video_transcript(video_id):
    data = request.json
    transcript_text = data.get('transcript')
    if not transcript_text:
        return jsonify({"error": "Transcript text is required in the request body"}), 400

    summary = summarize_text_with_gemini(transcript_text)
    return jsonify({"video_id": video_id, "summary": summary}), 200

@app.route('/videos/<path:filename>')
def serve_video(filename):
    return send_from_directory(VIDEO_DOWNLOAD_PATH, filename)

@app.errorhandler(Exception)
def handle_exception(e):
    # pass through HTTP errors
    if isinstance(e, HTTPException):
        return e
    return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ensure the videos directory exists
    os.makedirs(VIDEO_DOWNLOAD_PATH, exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000)
