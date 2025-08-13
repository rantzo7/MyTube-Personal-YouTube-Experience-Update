import json
import os

DATABASE_FILE = 'videos.json'

def _load_videos():
    """Loads video metadata from the JSON file."""
    if not os.path.exists(DATABASE_FILE):
        return {}
    with open(DATABASE_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def _save_videos(videos):
    """Saves video metadata to the JSON file."""
    with open(DATABASE_FILE, 'w') as f:
        json.dump(videos, f, indent=2)

def add_video_metadata(metadata: dict):
    """Adds or updates video metadata."""
    videos = _load_videos()
    videos[metadata['id']] = metadata
    _save_videos(videos)

def get_all_videos():
    """Retrieves a list of all downloaded videos."""
    videos = _load_videos()
    return list(videos.values())

def get_video_metadata(video_id: str):
    """Retrieves metadata for a single video."""
    videos = _load_videos()
    return videos.get(video_id)
