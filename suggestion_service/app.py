from __init__ import create_app, clean_suggestion_text, get_matching_score
from flask import request, jsonify
import mysql.connector

app = create_app()

def get_db_connection():
    return mysql.connector.connect(**app.config['MYSQL_CONFIG'])

@app.route('/suggestions', methods=['GET'])
def get_suggestions():
    query = clean_suggestion_text(request.args.get('q', ''))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT task_text, frequency 
            FROM task_suggestions 
            WHERE task_text LIKE %s 
            ORDER BY frequency DESC 
            LIMIT 10
        """, (f"%{query}%",))
        suggestions = cursor.fetchall()
        
        # Sort suggestions based on matching score
        scored_suggestions = [
            {**sugg, 'score': get_matching_score(query, sugg['task_text'])}
            for sugg in suggestions
        ]
        scored_suggestions.sort(key=lambda x: (-x['score'], -x['frequency']))
        
        return jsonify(scored_suggestions[:5]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/suggestions/add', methods=['POST'])
def add_suggestion():
    data = request.get_json()
    task_text = clean_suggestion_text(data.get('task_text'))

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO task_suggestions (task_text, frequency) 
            VALUES (%s, 1) 
            ON DUPLICATE KEY UPDATE frequency = frequency + 1
        """, (task_text,))
        conn.commit()
        return jsonify({'message': 'Suggestion added/updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(port=5003) 