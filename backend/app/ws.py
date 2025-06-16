from fastapi import APIRouter, WebSocket, Depends, HTTPException
from typing import List, Dict
from .deps import get_current_user
from .crud import create_message, save_whiteboard

router = APIRouter()
active_connections: Dict[int, List[WebSocket]] = {}

@router.websocket("/ws/{session_id}/chat")
async def chat_ws(session_id: int, websocket: WebSocket, user=Depends(get_current_user)):
    await websocket.accept()
    active_connections.setdefault(session_id, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg = create_message(
                db=websocket.app.state.db,  # assume .state.db set
                session_id=session_id,
                sender_id=user.id,
                mc=types.SimpleNamespace(message_text=data.get("text"))
            )
            for conn in active_connections[session_id]:
                await conn.send_json({
                    "sender": user.name,
                    "text": data.get("text"),
                    "timestamp": str(msg.timestamp)
                })
    except Exception:
        pass
    finally:
        active_connections[session_id].remove(websocket)

@router.websocket("/ws/{session_id}/whiteboard")
async def whiteboard_ws(session_id: int, websocket: WebSocket, user=Depends(get_current_user)):
    await websocket.accept()
    active_connections.setdefault((session_id, 'wb'), []).append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            save_whiteboard(
                db=websocket.app.state.db,
                session_id=session_id,
                wb=types.SimpleNamespace(data_json=data)
            )
            for conn in active_connections[(session_id, 'wb')]:
                await conn.send_json(data)
    except Exception:
        pass
    finally:
        active_connections[(session_id, 'wb')].remove(websocket)
