from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime

def create_app():
    load_dotenv()
    
    app = Flask(__name__)
    CORS(app)
    
    # Database configuration
    app.config['MYSQL_CONFIG'] = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME')
    }
    
    return app

# Utility functions for task service
def calculate_time_remaining(deadline):
    """Calculate time remaining for a task."""
    if not deadline:
        return None
    
    now = datetime.utcnow()
    if isinstance(deadline, str):
        deadline = datetime.strptime(deadline, '%Y-%m-%d %H:%M:%S')
    
    time_diff = deadline - now
    return time_diff.total_seconds() if time_diff.total_seconds() > 0 else 0

def format_task_response(task):
    """Format task data for response."""
    if task.get('deadline'):
        task['time_remaining'] = calculate_time_remaining(task['deadline'])
    return task
