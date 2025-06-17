import json
import asyncio
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from .auth import get_current_user_ws
from sqlalchemy.orm import Session
from . import models
import os

class ConnectionManager:
    def __init__(self):
        # Store active connections by session_id -> set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Store user info by WebSocket connection
        self.connection_users: Dict[WebSocket, dict] = {}
        # Store session participants
        self.session_participants: Dict[int, list] = {}

    async def connect(self, websocket: WebSocket, session_id: int, user_info: dict):
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
            self.session_participants[session_id] = []
        
        self.active_connections[session_id].add(websocket)
        self.connection_users[websocket] = user_info
        
        # Add user to session participants
        participant_info = {
            'userId': user_info['user_id'],
            'userName': user_info['name'],
            'role': user_info['role']
        }
        
        # Check if user is already in participants list
        existing_participant = next(
            (p for p in self.session_participants[session_id] if p['userId'] == user_info['user_id']), 
            None
        )
        if not existing_participant:
            self.session_participants[session_id].append(participant_info)
        
        # Notify all participants about the new user
        await self.broadcast_to_session(session_id, {
            'type': 'user_joined',
            'userId': user_info['user_id'],
            'userName': user_info['name'],
            'role': user_info['role']
        }, exclude_websocket=websocket)
        
        # Send current participants list to the new user
        await websocket.send_text(json.dumps({
            'type': 'participants_list',
            'participants': self.session_participants[session_id]
        }))
        
        # Notify existing participants about the new user
        await self.broadcast_to_session(session_id, {
            'type': 'participants_list',
            'participants': self.session_participants[session_id]
        })

    def disconnect(self, websocket: WebSocket, session_id: int):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            
            # Remove user from participants
            user_info = self.connection_users.get(websocket)
            if user_info:
                self.session_participants[session_id] = [
                    p for p in self.session_participants[session_id] 
                    if p['userId'] != user_info['user_id']
                ]
                
                # Notify others that user left
                asyncio.create_task(self.broadcast_to_session(session_id, {
                    'type': 'user_left',
                    'userId': user_info['user_id'],
                    'userName': user_info['name']
                }))
                
                # Update participants list for remaining users
                asyncio.create_task(self.broadcast_to_session(session_id, {
                    'type': 'participants_list',
                    'participants': self.session_participants[session_id]
                }))
            
            del self.connection_users[websocket]
            
            # Clean up empty sessions
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                if session_id in self.session_participants:
                    del self.session_participants[session_id]

    async def broadcast_to_session(self, session_id: int, message: dict, exclude_websocket: WebSocket = None):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(json.dumps(message))
                    except:
                        # Remove broken connections
                        self.active_connections[session_id].discard(connection)
                        if connection in self.connection_users:
                            del self.connection_users[connection]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except:
            # Handle broken connection
            pass

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, session_id: int, token: str, db: Session):
    try:
        # Authenticate user
        print(f"WS: Received token: {token[:30]}...") # Print first 30 chars of token
        print(f"WS: Backend SECRET_KEY loaded: {os.getenv('SECRET_KEY')}") # Verify SECRET_KEY
        user = await get_current_user_ws(token, db)
        if not user:
            print("WS: Authentication failed - user not found or token invalid")
            await websocket.close(code=4001, reason="Authentication failed")
            return
        
        print(f"WS: User {user.email} ({user.role}) authenticated for session {session_id}")

        # Verify user has access to this session
        session = db.query(models.Session).filter(models.Session.id == session_id).first()
        if not session:
            print(f"WS: Session {session_id} not found")
            await websocket.close(code=4004, reason="Session not found")
            return
        
        # Check if user is teacher or enrolled student
        if user.role == "teacher":
            if session.teacher_id != user.id:
                print(f"WS: Teacher {user.email} not authorized for session {session_id} (not owner)")
                await websocket.close(code=4003, reason="Not authorized for this session")
                return
        else:
            # Check if student is enrolled in the class
            if session.class_id:
                enrollment = db.query(models.ClassEnrollment).filter(
                    models.ClassEnrollment.class_id == session.class_id,
                    models.ClassEnrollment.student_id == user.id
                ).first()
                if not enrollment:
                    print(f"WS: Student {user.email} not enrolled in class for session {session_id}")
                    await websocket.close(code=4003, reason="Not enrolled in this class")
                    return
        
        print(f"WS: User {user.email} authorized for session {session_id}")

        # Connect to the session
        user_info = {
            'user_id': user.id,
            'name': user.name,
            'role': user.role
        }
        
        await manager.connect(websocket, session_id, user_info)
        
        try:
            while True:
                # Receive messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message['type'] in ['offer', 'answer', 'ice_candidate']:
                    # Forward signaling messages to target user
                    target_user_id = message.get('targetUserId')
                    if target_user_id:
                        # Find the target user's websocket
                        target_websocket = None
                        for ws, user_data in manager.connection_users.items():
                            if user_data['user_id'] == target_user_id:
                                target_websocket = ws
                                break
                        
                        if target_websocket:
                            # Add sender info to the message
                            message['fromUserId'] = user.id
                            await manager.send_personal_message(message, target_websocket)
                
                elif message['type'] == 'chat_message':
                    # Broadcast chat message to all participants in the session
                    chat_message = {
                        'type': 'chat_message',
                        'userId': user.id,
                        'userName': user.name,
                        'message': message['message'],
                        'timestamp': message.get('timestamp')
                    }
                    await manager.broadcast_to_session(session_id, chat_message)
                
                elif message['type'] == 'whiteboard_draw':
                    # Broadcast whiteboard drawing to all participants in the session
                    whiteboard_message = {
                        'type': 'whiteboard_draw',
                        'x0': message['x0'],
                        'y0': message['y0'],
                        'x1': message['x1'],
                        'y1': message['y1'],
                        'color': message.get('color', '#000000'),
                        'width': message.get('width', 2)
                    }
                    await manager.broadcast_to_session(session_id, whiteboard_message)
                
                elif message['type'] == 'whiteboard_clear':
                    # Broadcast whiteboard clear to all participants in the session
                    clear_message = {
                        'type': 'whiteboard_clear'
                    }
                    await manager.broadcast_to_session(session_id, clear_message)
                
                elif message['type'] == 'join':
                    # User joining is already handled in connect()
                    pass
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, session_id)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close(code=4000, reason="Internal server error")
        except:
            pass 