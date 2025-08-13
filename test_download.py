import yt_dlp
import os

url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
download_path = './videos'

ydl_opts = {
    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    'outtmpl': os.path.join(download_path, '%(id)s.%(ext)s'),
    'noplaylist': True,
    'quiet': False,
    'no_warnings': False,
    'simulate': False,
    'progress_hooks': [],
    'postprocessors': [{
        'key': 'FFmpegMetadata',
        'add_metadata': True,
    }],
    'ffmpeg_location': 'C:\\ffmpeg-2025-08-11-git-3542260376-full_build\\bin\\ffmpeg.exe', # Explicitly set FFmpeg path
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        print(f"Successfully downloaded: {info_dict.get('title')}")
except Exception as e:
    print(f"Error during programmatic download: {e}")