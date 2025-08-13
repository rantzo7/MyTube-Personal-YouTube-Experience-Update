import yt_dlp
import os
import json
import yt_dlp
from database import add_video_metadata

def download_single_video(url: str, download_path: str, job_id=None):
    """Downloads a single video and saves its metadata."""
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': os.path.join(download_path, '%(id)s.%(ext)s'),
        'noplaylist': True,
        'quiet': False,
        'no_warnings': False,
        'simulate': False,
        'progress_hooks': [lambda d: progress_hook(d, job_id)],
        'postprocessors': [{
            'key': 'FFmpegMetadata',
            'add_metadata': True,
        }],
        'ffmpeg_location': 'C:\\ffmpeg-2025-08-11-git-3542260376-full_build\\bin\\ffmpeg.exe',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            video_id = info_dict.get('id')
            title = info_dict.get('title')
            thumbnail_url = info_dict.get('thumbnail')
            ext = info_dict.get('ext')
            local_path = os.path.join(download_path, f"{video_id}.{ext}")

            metadata = {
                "id": video_id,
                "title": title,
                "original_url": url,
                "file_path": f"{video_id}.{ext}",
                "thumbnail_url": thumbnail_url
            }
            add_video_metadata(metadata)
            print(f"Downloaded: {title} ({url}) to {local_path}")
            return metadata
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def progress_hook(d, job_id):
    if job_id:
        try:
            from mytube_queue import q
            job = q.fetch_job(job_id)
            if job:
                if d['status'] == 'downloading':
                    p = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                    downloaded = d.get('downloaded_bytes', 0)
                    if p > 0:
                        progress = (downloaded / p) * 100
                        job.meta['progress'] = progress
                        job.save_meta()
                elif d['status'] == 'finished':
                    job.meta['progress'] = 100
                    job.save_meta()
                elif d['status'] == 'error':
                    job.meta['progress'] = -1
                    job.save_meta()
        except Exception as e:
            print(f"Error in progress_hook for job {job_id}: {e}")

def download_batch_videos(urls: list[str], download_path: str, job_id=None):
    """Downloads a batch of videos."""
    results = []
    for url in urls:
        metadata = download_single_video(url, download_path, job_id)
        if metadata:
            results.append(metadata)
    return results
