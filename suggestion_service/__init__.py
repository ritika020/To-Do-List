from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

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

# Utility functions for suggestion service
def clean_suggestion_text(text):
    """Clean and standardize suggestion text."""
    return text.strip().lower()

def get_matching_score(query, suggestion):
    """Calculate matching score between query and suggestion."""
    query = query.lower()
    suggestion = suggestion.lower()
    
    if query == suggestion:
        return 1.0
    elif suggestion.startswith(query):
        return 0.8
    elif query in suggestion:
        return 0.6
    return 0.0
