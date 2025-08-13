import os
from rq import Queue
from redis import Redis

# Connect to Redis
# For simplicity, we'll use a local Redis instance.
# In a production environment, you'd configure this more robustly.
redis_conn = Redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))
q = Queue(connection=redis_conn)
