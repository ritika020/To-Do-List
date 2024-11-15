from __init__ import create_app, calculate_time_remaining, format_task_response
from flask import request, jsonify
import mysql.connector
import uuid
from datetime import datetime

app = create_app()

def get_db_connection():
    return mysql.connector.connect(**app.config['MYSQL_CONFIG'])

@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    user_id = data.get('user_id')
    task_text = data.get('task_text')
    deadline = data.get('deadline')
    reminder = data.get('reminder')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        task_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO tasks (task_id, user_id, task_text, deadline, reminder)
            VALUES (%s, %s, %s, %s, %s)""",
            (task_id, user_id, task_text, deadline, reminder)
        )
        conn.commit()

        # Fetch the created task
        cursor.execute("SELECT * FROM tasks WHERE task_id = %s", (task_id,))
        task = cursor.fetchone()
        return jsonify(format_task_response(task)), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tasks/<user_id>', methods=['GET'])
def get_tasks(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s AND is_completed = FALSE
            ORDER BY created_at DESC
        """, (user_id,))
        tasks = cursor.fetchall()
        return jsonify([format_task_response(task) for task in tasks]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tasks/complete/<task_id>', methods=['PUT'])
def complete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """UPDATE tasks 
            SET is_completed = TRUE, completed_at = NOW() 
            WHERE task_id = %s""",
            (task_id,)
        )
        conn.commit()
        return jsonify({'message': 'Task marked as complete'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tasks/history/<user_id>', methods=['GET'])
def get_task_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s AND is_completed = TRUE 
            ORDER BY completed_at DESC
        """, (user_id,))
        tasks = cursor.fetchall()
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        update_fields = []
        params = []
        for key, value in data.items():
            if key in ['task_text', 'deadline', 'reminder']:
                update_fields.append(f"{key} = %s")
                params.append(value)
        
        params.append(task_id)
        query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE task_id = %s"
        
        cursor.execute(query, params)
        conn.commit()
        return jsonify({'message': 'Task updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(port=5002)
