from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

def create_app():
    load_dotenv()
    
    app = Flask(__name__)
    CORS(app)
    
    # Configure app
    app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    
    # Database configuration
    app.config['MYSQL_CONFIG'] = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME')
    }
    
    return app

# Utility functions for auth service
def generate_password_hash(password):
    """Generate password hash."""
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password_hash(password, hashed):
    """Verify password hash."""
    import bcrypt
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
