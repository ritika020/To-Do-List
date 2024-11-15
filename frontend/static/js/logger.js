class Logger {
    static logToFile(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${JSON.stringify(message)}\n`;
        
        fetch('http://127.0.0.1:5000/api/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp,
                level,
                message
            })
        }).catch(err => console.error('Logging failed:', err));
    }

    static info(message) {
        this.logToFile(message, 'INFO');
        console.log(message);
    }

    static error(message) {
        this.logToFile(message, 'ERROR');
        console.error(message);
    }

    static warn(message) {
        this.logToFile(message, 'WARN');
        console.warn(message);
    }
} 