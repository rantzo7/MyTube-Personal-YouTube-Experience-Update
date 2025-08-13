import os
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def fetch_transcript(video_id: str):
    """Fetches the transcript for a given YouTube video ID."""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = " ".join([entry['text'] for entry in transcript_list])
        return transcript_text
    except Exception as e:
        print(f"Error fetching transcript for {video_id}: {e}")
        return None

def summarize_text_with_gemini(text: str):
    """Summarizes the given text using the Gemini API."""
    if not text:
        return "No text provided for summarization."

    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"Please summarize the following text concisely:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error summarizing text with Gemini: {e}")
        return "Error generating summary."
