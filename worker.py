import os
import sys
from redis import Redis
from rq import Worker, Queue, connections

# Add the current directory to the Python path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Preload modules for the worker
import downloader
import analysis
import database

# Connect to Redis
redis_conn = Redis(host=os.environ.get('REDIS_HOST', 'localhost'), port=int(os.environ.get('REDIS_PORT', 6379)), db=0)

from mytube_queue import q

if __name__ == '__main__':
    worker = Worker([Queue('default', connection=redis_conn)], connection=redis_conn)
    worker.work()
