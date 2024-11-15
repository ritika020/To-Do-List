from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import jwt
from functools import wraps

def create_app():
    load_dotenv()
    
    app = Flask(__name__)
    CORS(app)
    
    # Configure app
    app.config.update(
        SECRET_KEY=os.getenv('JWT_SECRET_KEY'),
        AUTH_SERVICE_URL=os.getenv('AUTH_SERVICE_URL', 'http://localhost:5001'),
        TASK_SERVICE_URL=os.getenv('TASK_SERVICE_URL', 'http://localhost:5002'),
        SUGGESTION_SERVICE_URL=os.getenv('SUGGESTION_SERVICE_URL', 'http://localhost:5003')
    )
    
    return app

def token_required(f):
    """Decorator to check valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            jwt.decode(
                token, 
                os.getenv('JWT_SECRET_KEY'), 
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    
    return decorated

def handle_service_error(response):
    """Handle common service error responses."""
    try:
        return jsonify(response.json()), response.status_code
    except Exception:
        return jsonify({'error': 'Service unavailable'}), 503
