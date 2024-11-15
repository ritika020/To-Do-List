from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
import jwt
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# MySQL Configuration
db_config = {
    'host': 'localhost',
    'port': 3306,
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': 'todo_db'
}

@app.route('/register', methods=['POST'])
def register():
    try:
        # Get data from either JSON body or form data
        data = request.get_json() if request.is_json else request.form
        
        # Remove quotes if they exist in the data
        email = data.get('email', '').strip('"')
        password = data.get('password', '').strip('"')
        name = data.get('name', '').strip('"')
        gender = data.get('gender', '').strip('"')

        # Validate required fields
        if not all([email, password, name, gender]):
            return jsonify({
                'error': 'All fields are required',
                'received': {
                    'email': bool(email),
                    'password': bool(password),
                    'name': bool(name),
                    'gender': bool(gender)
                }
            }), 400

        # Connect to database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        try:
            # Check if user exists
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'error': 'Email already registered'}), 409

            # Hash password
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
            
            # Generate UUID for user_id
            user_id = str(uuid.uuid4())

            # Map gender string to enum value
            gender_map = {
                'Male': 'M',
                'Female': 'F',
                'Other': 'OTHER'
            }
            db_gender = gender_map.get(gender, 'OTHER')

            # Insert new user
            cursor.execute("""
                INSERT INTO users (user_id, email, password, name, gender, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, email, hashed_password, name, db_gender, datetime.now()))
            
            conn.commit()
            
            return jsonify({
                'message': 'Registration successful',
                'user_id': user_id
            }), 201

        except mysql.connector.Error as err:
            print(f"Database Error: {err}")
            return jsonify({'error': f'Database error occurred: {str(err)}'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
