# To-Do List Application

A comprehensive task management system built with microservices architecture.

## System Architecture

The application consists of multiple microservices:
- Frontend UI (Port 8080)
- API Gateway (Port 5000)
- Authentication Service (Port 5001)
- Task Service (Port 5002)
- Suggestion Service (Port 5003)

## Prerequisites

- Python 3.x
- MySQL 8.0 or higher
- Bash shell
- Required Python packages (see requirements.txt)

## Initial Setup

### 1. MySQL Installation & Setup

1. Install MySQL:
    ```bash
    brew install mysql-server
    ```
2. Start the MySQL service:
    ```bash
    brew services start mysql
    ```
4. Create the database and user:
    ```bash
    CREATE DATABASE todo_db;
    CREATE USER '<your_mysql_user>'@'localhost' IDENTIFIED BY '<your_mysql_password>';
    GRANT ALL PRIVILEGES ON todo_db.* TO '<your_mysql_user>'@'localhost';
    ```
4. Use schema.sql to create the necessary tables.

5. Update the MySQL credentials in the .env file:
    ```
    DB_USER='your_mysql_user'
    DB_PASSWORD='your_mysql_password'
    ```
### 2. Doing requirements.txt

``` bash
pip install -r requirements.txt
```

### 3. Using the Service Manager

1. Make the script executable:
   ``` bash
   chmod +x manage_services.sh
   ```

2. Available commands:

a. Start all services
``` bash
./manage_services.sh start
```

b. Stop all services
``` bash
./manage_services.sh stop
```

c. Restart all services
``` bash
./manage_services.sh restart
```

d. Check status of all services
``` bash
./manage_services.sh status
```

e. View logs for a specific service
``` bash
./manage_services.sh logs <service_name>
```

### Service URLs
When services are running, they will be available at:
- Frontend UI: http://localhost:8080/templates/login.html
- API Gateway: http://localhost:5000
- Auth Service: http://localhost:5001
- Task Service: http://localhost:5002
- Suggestion Service: http://localhost:5003

### Troubleshooting
- Check service logs in the `logs/` directory
- Each service has its own log file (e.g., `frontend.log`, `auth_service.log`)
- If a service fails to start, the script will display the last few lines of its logs

### Service Components
The script manages the following services:
1. Frontend UI (Port 8080)
2. API Gateway (Port 5000)
3. Authentication Service (Port 5001)
4. Task Service (Port 5002)
5. Suggestion Service (Port 5003)

### Note
Make sure all required environment variables and database configurations are set up before starting the services. The script will create a `logs` directory to store service logs if it doesn't exist.

