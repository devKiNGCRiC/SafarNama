import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import UserModel from '../Models/userModel.js';

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // Map to store client connections

        this.wss.on('connection', async (ws, req) => {
            try {
                // Extract token from query string
                const token = this.extractToken(req.url);
                if (!token) {
                    ws.close();
                    return;
                }

                // Verify token and get user
                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                const user = await UserModel.findById(decoded.id);
                
                if (!user) {
                    ws.close();
                    return;
                }

                // Store client connection
                this.clients.set(user._id.toString(), ws);

                // Handle client messages
                ws.on('message', (message) => {
                    this.handleMessage(message, user._id);
                });

                // Handle client disconnect
                ws.on('close', () => {
                    this.clients.delete(user._id.toString());
                });

            } catch (error) {
                console.error('WebSocket connection error:', error);
                ws.close();
            }
        });
    }

    extractToken(url) {
        const params = new URLSearchParams(url.split('?')[1]);
        return params.get('token');
    }

    handleMessage(message, userId) {
        try {
            const parsedMessage = JSON.parse(message);
            // Handle different message types
            switch (parsedMessage.type) {
                case 'ping':
                    this.sendToClient(userId, { type: 'pong' });
                    break;
                // Add more message type handlers as needed
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async sendNotification(userId, notification) {
        const ws = this.clients.get(userId.toString());
        if (ws) {
            ws.send(JSON.stringify({
                type: 'notification',
                data: notification
            }));
        }
    }

    async broadcastToFollowers(userId, notification) {
        try {
            const user = await UserModel.findById(userId).populate('followers');
            user.followers.forEach(follower => {
                this.sendNotification(follower._id, notification);
            });
        } catch (error) {
            console.error('Error broadcasting to followers:', error);
        }
    }

    // Helper method to send message to specific client
    sendToClient(userId, message) {
        const ws = this.clients.get(userId.toString());
        if (ws) {
            ws.send(JSON.stringify(message));
        }
    }

    // Helper method to broadcast to all connected clients
    broadcast(message) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

export default WebSocketService;