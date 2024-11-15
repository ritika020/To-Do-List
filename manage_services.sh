#!/bin/bash

# Get the absolute path to the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define service names, ports, paths and URLs as separate arrays
services=("api_gateway" "auth_service" "task_service" "suggestion_service" "frontend")
ports=("5000" "5001" "5002" "5003" "8080")
paths=(
    "${PROJECT_ROOT}/api_gateway/app.py"
    "${PROJECT_ROOT}/auth_service/app.py"
    "${PROJECT_ROOT}/task_service/app.py"
    "${PROJECT_ROOT}/suggestion_service/app.py"
    "${PROJECT_ROOT}/frontend"
)
urls=(
    "http://localhost:5000"
    "http://localhost:5001"
    "http://localhost:5002"
    "http://localhost:5003"
    "http://localhost:8080/templates/login.html"
)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get port for a service
get_port() {
    local service=$1
    for i in "${!services[@]}"; do
        if [[ "${services[$i]}" = "${service}" ]]; then
            echo "${ports[$i]}"
            return
        fi
    done
}

# Function to get path for a service
get_path() {
    local service=$1
    for i in "${!services[@]}"; do
        if [[ "${services[$i]}" = "${service}" ]]; then
            echo "${paths[$i]}"
            return
        fi
    done
}

# Function to get URL for a service
get_url() {
    local service=$1
    for i in "${!services[@]}"; do
        if [[ "${services[$i]}" = "${service}" ]]; then
            echo "${urls[$i]}"
            return
        fi
    done
}

# Function to start a service
start_service() {
    local service=$1
    local port=$(get_port "$service")
    local path=$(get_path "$service")
    local url=$(get_url "$service")
    
    echo -e "${YELLOW}Starting $service on port $port...${NC}"
    
    # Create a log directory if it doesn't exist
    mkdir -p "${PROJECT_ROOT}/logs"
    
    # Start the service based on type
    if [ "$service" = "frontend" ]; then
        cd "${PROJECT_ROOT}/frontend" && \
        python3 -m http.server $port --directory . > "${PROJECT_ROOT}/logs/${service}.log" 2>&1 &
    else
        cd "$(dirname "$path")" && \
        python3 "$(basename "$path")" > "${PROJECT_ROOT}/logs/${service}.log" 2>&1 &
    fi
    
    echo $! > /tmp/${service}.pid
    sleep 2
    
    if check_service $service; then
        echo -e "${GREEN}$service started successfully${NC}"
        echo -e "${BLUE}URL: $url${NC}"
    else
        echo -e "${RED}Failed to start $service${NC}"
        echo -e "${RED}Check logs at ${PROJECT_ROOT}/logs/${service}.log${NC}"
        tail -n 5 "${PROJECT_ROOT}/logs/${service}.log"
    fi
}

# Function to stop a service
stop_service() {
    local service=$1
    if [ -f /tmp/${service}.pid ]; then
        echo -e "${YELLOW}Stopping $service...${NC}"
        kill $(cat /tmp/${service}.pid) 2>/dev/null
        rm /tmp/${service}.pid
        echo -e "${GREEN}$service stopped${NC}"
    else
        echo -e "${RED}$service is not running${NC}"
    fi
}

# Function to check if service is running
check_service() {
    local service=$1
    local port=$(get_port "$service")
    lsof -i :$port >/dev/null 2>&1
    return $?
}

# Function to show status of a service
show_status() {
    local service=$1
    local url=$(get_url "$service")
    if check_service $service; then
        echo -e "${GREEN}$service is running${NC}"
        echo -e "${BLUE}URL: $url${NC}"
    else
        echo -e "${RED}$service is not running${NC}"
    fi
}

# Main script logic
case "$1" in
    start)
        for service in "${services[@]}"; do
            start_service $service
        done
        echo -e "\n${GREEN}All services started. Access the application at:${NC}"
        echo -e "${BLUE}${urls[4]}${NC}"
        ;;
    stop)
        for service in "${services[@]}"; do
            stop_service $service
        done
        ;;
    restart)
        for service in "${services[@]}"; do
            stop_service $service
            sleep 2
            start_service $service
        done
        echo -e "\n${GREEN}All services restarted. Access the application at:${NC}"
        echo -e "${BLUE}${urls[4]}${NC}"
        ;;
    status)
        for service in "${services[@]}"; do
            show_status $service
        done
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "Usage: $0 logs <service_name>"
            exit 1
        fi
        if [ -f "${PROJECT_ROOT}/logs/$2.log" ]; then
            tail -f "${PROJECT_ROOT}/logs/$2.log"
        else
            echo "No logs found for $2"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac

exit 0 