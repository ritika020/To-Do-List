from __init__ import create_app, token_required, handle_service_error
from flask import request, jsonify
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = create_app()
app.debug = True  # Enable debug mode

# Auth routes
@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        logger.debug(f"Registration request received with data: {data}")
        
        auth_service_url = app.config['AUTH_SERVICE_URL']
        logger.debug(f"Sending request to auth service at: {auth_service_url}")
        
        response = requests.post(
            f"{auth_service_url}/register", 
            json=data
        )
        
        logger.debug(f"Auth service response: {response.status_code} - {response.text}")
        return handle_service_error(response)
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error to auth service: {e}")
        return jsonify({'error': 'Auth service unavailable'}), 503
    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logger.debug(f"Login request received with data: {data}")
        
        response = requests.post(
            f"{app.config['AUTH_SERVICE_URL']}/login", 
            json=data
        )
        logger.debug(f"Login response: {response.status_code}")
        return handle_service_error(response)
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error during login: {e}")
        return jsonify({'error': 'Auth service unavailable'}), 503
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        return jsonify({'error': str(e)}), 500

# Task routes
@app.route('/tasks', methods=['POST'])
@token_required
def create_task():
    try:
        data = request.get_json()
        logger.debug(f"Create task request received with data: {data}")
        
        # Create task
        response = requests.post(
            f"{app.config['TASK_SERVICE_URL']}/tasks", 
            json=data
        )
        
        if response.status_code == 201:
            logger.debug("Task created successfully, adding to suggestions")
            # Add to suggestions
            suggestion_response = requests.post(
                f"{app.config['SUGGESTION_SERVICE_URL']}/suggestions/add",
                json={'task_text': data.get('task_text')}
            )
            logger.debug(f"Suggestion service response: {suggestion_response.status_code}")
        
        return handle_service_error(response)
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error creating task: {e}")
        return jsonify({'error': 'Task service unavailable'}), 503
    except Exception as e:
        logger.error(f"Unexpected error creating task: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/tasks/<user_id>', methods=['GET'])
@token_required
def get_tasks(user_id):
    try:
        response = requests.get(
            f"{app.config['TASK_SERVICE_URL']}/tasks/{user_id}"
        )
        return handle_service_error(response)
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Task service unavailable'}), 503

@app.route('/tasks/complete/<task_id>', methods=['PUT'])
@token_required
def complete_task(task_id):
    try:
        response = requests.put(
            f"{app.config['TASK_SERVICE_URL']}/tasks/complete/{task_id}"
        )
        return handle_service_error(response)
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Task service unavailable'}), 503

@app.route('/tasks/history/<user_id>', methods=['GET'])
@token_required
def get_task_history(user_id):
    try:
        response = requests.get(
            f"{app.config['TASK_SERVICE_URL']}/tasks/history/{user_id}"
        )
        return handle_service_error(response)
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Task service unavailable'}), 503

@app.route('/tasks/<task_id>', methods=['PUT'])
@token_required
def update_task(task_id):
    try:
        response = requests.put(
            f"{app.config['TASK_SERVICE_URL']}/tasks/{task_id}", 
            json=request.get_json()
        )
        return handle_service_error(response)
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Task service unavailable'}), 503

# Suggestion routes
@app.route('/suggestions', methods=['GET'])
@token_required
def get_suggestions():
    try:
        response = requests.get(
            f"{app.config['SUGGESTION_SERVICE_URL']}/suggestions",
            params={'q': request.args.get('q', '')}
        )
        return handle_service_error(response)
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Suggestion service unavailable'}), 503 

# Add error handlers
@app.errorhandler(404)
def not_found_error(error):
    logger.error(f"404 error: {error}")
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Add before_request handler for logging
@app.before_request
def before_request():
    logger.debug(f"""
    Request:
    - Method: {request.method}
    - URL: {request.url}
    - Headers: {dict(request.headers)}
    - Data: {request.get_json(silent=True)}
    """)

# Add after_request handler for logging
@app.after_request
def after_request(response):
    logger.debug(f"""
    Response:
    - Status: {response.status_code}
    - Headers: {dict(response.headers)}
    - Data: {response.get_data(as_text=True)}
    """)
    return response
  