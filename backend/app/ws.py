from fastapi import APIRouter, WebSocket, Query, Depends
from .websocket import websocket_endpoint
from .deps import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.websocket("/ws/session/{session_id}")
async def session_websocket(
    websocket: WebSocket, 
    session_id: int, 
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    print(f"WS_ROUTER: Entered session_websocket for session {session_id} with token: {token[:30]}...")
    """WebSocket endpoint for WebRTC signaling in video sessions"""
    await websocket_endpoint(websocket, session_id, token, db)
