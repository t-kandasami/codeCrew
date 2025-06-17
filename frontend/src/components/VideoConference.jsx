import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Settings, 
  Maximize, Minimize, Share, Monitor, MessageSquare, Fullscreen, Minimize2, VideoIcon, BellDot, ArrowLeft
} from 'lucide-react';
import ChatBox from './ChatBox';

const VideoConference = ({ sessionId, userRole, userName }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peers, setPeers] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Video Session');
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [testMode, setTestMode] = useState(false);
  const [simulatedParticipants, setSimulatedParticipants] = useState([]);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const downloadLinkRef = useRef(null);
  
  const localVideoRef = useRef();
  const mainLocalVideoRef = useRef();
  const remoteVideosRef = useRef(new Map());
  const peerConnections = useRef(new Map());
  const wsRef = useRef(null);
  const screenStreamRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Add TURN servers for better connectivity
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  useEffect(() => {
    // Only connect to signaling server initially, don't request camera yet
    connectToSignalingServer();
    fetchSessionTitle();
    return () => cleanup();
  }, [sessionId]);

  // Debug useEffect to monitor remote streams
  useEffect(() => {
    console.log('Remote streams updated:', remoteStreams.size, 'streams');
    remoteStreams.forEach((stream, userId) => {
      console.log('Stream for user ID:', userId, 'Active:', stream.active, 'Tracks:', stream.getTracks().length);
      stream.getTracks().forEach(track => {
        console.log('Track:', track.kind, 'Enabled:', track.enabled, 'Ready state:', track.readyState);
      });
    });
  }, [remoteStreams]);

  const requestCameraPermission = async () => {
    if (isRequestingPermission) return;
    
    setIsRequestingPermission(true);
    try {
      // Get user media with mobile-friendly constraints
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user' // Use front camera on mobile
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      // Try with ideal constraints first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintError) {
        console.log('Failed with ideal constraints, trying basic constraints:', constraintError);
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      setLocalStream(stream);
      setCameraPermissionGranted(true);
      console.log('Camera and microphone access granted successfully');
      console.log('Stream tracks:', stream.getTracks().map(track => ({ kind: track.kind, enabled: track.enabled, readyState: track.readyState })));
      
      if (localVideoRef.current) {
        console.log('Local video ref found, setting srcObject');
        localVideoRef.current.srcObject = stream;
      } else {
        console.log('Local video ref not found yet');
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Provide more specific error messages for mobile
      let errorMessage = 'Unable to access camera/microphone. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Your browser does not support camera/microphone access.';
      } else {
        errorMessage += 'Please check permissions and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const connectToSignalingServer = () => {
    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws/session/${sessionId}?token=${token}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to signaling server');
      setIsConnecting(false);
      setConnectionStatus('Connected');
      // Join the session
      sendMessage({
        type: 'join',
        sessionId: sessionId,
        userId: localStorage.getItem('userId'),
        userName: userName,
        role: userRole
      });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleSignalingMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('Disconnected from signaling server:', event.code, event.reason);
      setIsConnecting(true);
      setConnectionStatus('Disconnected');
      // Attempt to reconnect after 3 seconds if not a normal closure
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          setConnectionStatus('Reconnecting...');
          connectToSignalingServer();
        }, 3000);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Connection Error');
    };
  };

  const handleSignalingMessage = async (message) => {
    switch (message.type) {
      case 'user_joined':
        const currentUserId = localStorage.getItem('userId');
        if (message.userId !== currentUserId) {
          handleUserJoined(message);
          
          // If we're a teacher and there are existing students, create connections with them
          if (userRole === 'teacher' && participants.length > 1) {
            console.log('Teacher joining, creating connections with existing students');
            participants.forEach(participant => {
              if (participant.userId !== currentUserId && 
                  participant.userId !== message.userId && 
                  !peerConnections.current.has(participant.userId)) {
                console.log('Creating connection with existing student:', participant.userName);
                createTeacherConnection(participant.userId, participant.userName);
              }
            });
          }
        }
        break;
      case 'user_left':
        handleUserLeft(message);
        break;
      case 'offer':
        await handleOffer(message);
        break;
      case 'answer':
        await handleAnswer(message);
        break;
      case 'ice_candidate':
        await handleIceCandidate(message);
        break;
      case 'participants_list':
        setParticipants(message.participants);
        break;
      case 'chat_message':
        setMessages(prev => [...prev, message]);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handleUserJoined = async (message) => {
    const { userId, userName } = message;
    const currentUserId = localStorage.getItem('userId');
    const currentUserRole = userRole;
    
    // Only teachers create peer connections and send offers
    // Students only respond to offers from teachers
    if (currentUserRole === 'teacher') {
      console.log('Teacher creating connection for new participant:', userName);
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnections.current.set(userId, peerConnection);
      
      console.log('Teacher created peer connection for user:', userName, 'Connection state:', peerConnection.connectionState, 'ICE state:', peerConnection.iceConnectionState);

      // Monitor connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Teacher peer connection state changed:', peerConnection.connectionState, 'for user:', userName);
        console.log('Teacher connection details:', {
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
          iceGatheringState: peerConnection.iceGatheringState,
          signalingState: peerConnection.signalingState
        });
        
        // Add timeout for connection
        if (peerConnection.connectionState === 'connecting') {
          setTimeout(() => {
            if (peerConnection.connectionState === 'connecting') {
              console.log('Teacher connection timeout for user:', userName);
            }
          }, 10000); // 10 second timeout
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('Teacher ICE connection state changed:', peerConnection.iceConnectionState, 'for user:', userName);
      };

      peerConnection.onicegatheringstatechange = () => {
        console.log('Teacher ICE gathering state changed:', peerConnection.iceGatheringState, 'for user:', userName);
      };

      // Add local stream tracks to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle incoming streams
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream for user:', userName, 'Streams:', event.streams.length);
        const remoteStream = event.streams[0];
        
        if (remoteStream) {
          console.log('Setting remote stream for user:', userName);
          setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
          
          // Set video element source immediately and with retry
          const setVideoSource = () => {
            const videoElement = remoteVideosRef.current.get(userId);
            if (videoElement) {
              console.log('Assigning stream to video element for:', userName);
              videoElement.srcObject = remoteStream;
              videoElement.onloadedmetadata = () => {
                console.log('Video metadata loaded for:', userName);
                videoElement.play().catch(e => console.error('Error playing video:', e));
              };
            } else {
              console.log('Video element not found for user:', userName, 'Retrying...');
              setTimeout(setVideoSource, 100);
            }
          };
          
          setVideoSource();
        } else {
          console.error('No remote stream received for user:', userName);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Teacher sending ICE candidate to student:', event.candidate.type, 'Protocol:', event.candidate.protocol, 'Address:', event.candidate.address);
          console.log('ICE candidate details:', {
            type: event.candidate.type,
            protocol: event.candidate.protocol,
            address: event.candidate.address,
            port: event.candidate.port,
            candidate: event.candidate.candidate
          });
          sendMessage({
            type: 'ice_candidate',
            candidate: event.candidate,
            targetUserId: userId
          });
        } else {
          console.log('Teacher ICE gathering complete');
        }
      };

      // Create and send offer
      try {
        console.log('Creating offer for user:', userName);
        const offer = await peerConnection.createOffer();
        console.log('Offer created, setting local description');
        await peerConnection.setLocalDescription(offer);
        console.log('Local description set, sending offer to:', userName);
        
        // Force ICE gathering to start (workaround for same-machine testing)
        setTimeout(() => {
          console.log('Teacher forcing ICE gathering restart');
          peerConnection.restartIce();
        }, 100);
        
        sendMessage({
          type: 'offer',
          offer: offer,
          targetUserId: userId
        });
        console.log('Offer sent successfully to:', userName);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    } else {
      console.log('Student waiting for teacher to initiate connection');
    }
  };

  const handleUserLeft = (message) => {
    const { userId } = message;
    
    // Close peer connection
    const peerConnection = peerConnections.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(userId);
    }

    // Remove remote stream
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });

    // Remove video element
    remoteVideosRef.current.delete(userId);
  };

  const handleOffer = async (message) => {
    const { offer, fromUserId } = message;
    
    // Only students should respond to offers (teachers are the initiators)
    if (userRole !== 'student') {
      console.log('Teacher received offer, ignoring (teachers are initiators)');
      return;
    }
    
    console.log('Student responding to offer from teacher');
    
    // Create peer connection
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections.current.set(fromUserId, peerConnection);

    console.log('Student created peer connection for teacher, Connection state:', peerConnection.connectionState, 'ICE state:', peerConnection.iceConnectionState);

    // Monitor connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Student peer connection state changed:', peerConnection.connectionState, 'for teacher');
      console.log('Student connection details:', {
        connectionState: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState,
        signalingState: peerConnection.signalingState
      });
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('Student ICE connection state changed:', peerConnection.iceConnectionState, 'for teacher');
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log('Student ICE gathering state changed:', peerConnection.iceGatheringState, 'for teacher');
    };

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      console.log('Student received remote stream from teacher, Streams:', event.streams.length);
      const remoteStream = event.streams[0];
      
      if (remoteStream) {
        console.log('Student setting remote stream from teacher');
        setRemoteStreams(prev => new Map(prev.set(fromUserId, remoteStream)));
        
        // Set video element source immediately and with retry
        const setVideoSource = () => {
          const videoElement = remoteVideosRef.current.get(fromUserId);
          if (videoElement) {
            console.log('Student assigning stream to video element for teacher');
            videoElement.srcObject = remoteStream;
            videoElement.onloadedmetadata = () => {
              console.log('Student video metadata loaded for teacher');
              videoElement.play().catch(e => console.error('Error playing video:', e));
            };
          } else {
            console.log('Student video element not found for teacher, retrying...');
            setTimeout(setVideoSource, 100);
          }
        };
        
        setVideoSource();
      } else {
        console.error('Student no remote stream received from teacher');
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Student sending ICE candidate to teacher:', event.candidate.type);
        console.log('Student ICE candidate details:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
          candidate: event.candidate.candidate
        });
        sendMessage({
          type: 'ice_candidate',
          candidate: event.candidate,
          targetUserId: fromUserId
        });
      } else {
        console.log('Student ICE gathering complete');
      }
    };

    // Set remote description and create answer
    try {
      console.log('Student setting remote description from teacher');
      await peerConnection.setRemoteDescription(offer);
      console.log('Student creating answer for teacher');
      const answer = await peerConnection.createAnswer();
      console.log('Student setting local description');
      await peerConnection.setLocalDescription(answer);
      console.log('Student sending answer to teacher');
      
      // Force ICE gathering to start (workaround for same-machine testing)
      setTimeout(() => {
        console.log('Student forcing ICE gathering restart');
        peerConnection.restartIce();
      }, 100);
      
      sendMessage({
        type: 'answer',
        answer: answer,
        targetUserId: fromUserId
      });
      console.log('Student answer sent successfully to teacher');
      
      // Check ICE gathering state after setting local description
      setTimeout(() => {
        console.log('Student ICE gathering state after answer:', peerConnection.iceGatheringState);
        console.log('Student connection state after answer:', peerConnection.connectionState);
        console.log('Student ICE connection state after answer:', peerConnection.iceConnectionState);
      }, 1000);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (message) => {
    const { answer, fromUserId } = message;
    
    console.log('Received answer from user ID:', fromUserId);
    const peerConnection = peerConnections.current.get(fromUserId);
    if (peerConnection) {
      try {
        console.log('Setting remote description for answer from user:', fromUserId);
        await peerConnection.setRemoteDescription(answer);
        console.log('Remote description set successfully for user:', fromUserId);
        
        // Check ICE gathering state after setting remote description
        setTimeout(() => {
          console.log('Teacher ICE gathering state after answer:', peerConnection.iceGatheringState);
          console.log('Teacher connection state after answer:', peerConnection.connectionState);
          console.log('Teacher ICE connection state after answer:', peerConnection.iceConnectionState);
        }, 1000);
      } catch (error) {
        console.error('Error setting remote description for answer:', error);
      }
    } else {
      console.error('No peer connection found for user:', fromUserId);
    }
  };

  const handleIceCandidate = async (message) => {
    const { candidate, fromUserId } = message;
    const peerConnection = peerConnections.current.get(fromUserId);
    
    if (peerConnection) {
      try {
        console.log('Adding ICE candidate from user:', fromUserId, 'Type:', candidate.type);
        console.log('ICE candidate details:', {
          type: candidate.type,
          protocol: candidate.protocol,
          address: candidate.address,
          port: candidate.port,
          candidate: candidate.candidate
        });
        await peerConnection.addIceCandidate(candidate);
        console.log('ICE candidate added successfully for user:', fromUserId);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    } else {
      console.error('No peer connection found for user:', fromUserId);
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true // Capture system audio too
        });
        screenStreamRef.current = screenStream;

        // Replace video track with screen share track for all peers
        peerConnections.current.forEach(peer => {
          const videoSender = peer.getSenders().find(sender => sender.track && sender.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });

        // Update local video feed to show screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Listen for screen share stop event
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
        alert('Could not share screen. Make sure you grant permission.');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Restore local camera stream to peers
    peerConnections.current.forEach(peer => {
      const videoSender = peer.getSenders().find(sender => sender.track && sender.track.kind === 'video');
      if (videoSender && localStream) {
        videoSender.replaceTrack(localStream.getVideoTracks()[0]);
      }
    });

    // Restore local video feed to camera stream
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const startRecording = () => {
    if (localStream && userRole === 'teacher') {
      recordedChunksRef.current = [];
      try {
        mediaRecorderRef.current = new MediaRecorder(localStream, {
          mimeType: 'video/webm; codecs=vp8'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: 'video/webm'
          });
          const url = URL.createObjectURL(blob);
          downloadLinkRef.current.href = url;
          downloadLinkRef.current.download = `codecrew-session-${sessionId}-${new Date().toISOString()}.webm`;
          downloadLinkRef.current.click();
          URL.revokeObjectURL(url); // Clean up the URL
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        console.log('Recording started!');
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. Please ensure your browser supports MediaRecorder and permissions are granted.');
      }
    } else if (userRole !== 'teacher') {
      alert('Only teachers can record sessions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped!');
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      const message = {
        type: 'chat_message',
        sessionId: sessionId,
        userId: localStorage.getItem('userId'),
        userName: userName,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      sendMessage(message);
      setNewMessage('');
    }
  };

  const leaveSession = () => {
    cleanup();
    window.location.href = '/dashboard/sessions';
  };

  const cleanup = () => {
    // Close all peer connections
    peerConnections.current.forEach(peerConnection => {
      peerConnection.close();
    });
    peerConnections.current.clear();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Stop screen share
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const fetchSessionTitle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const sessionData = await response.json();
        setSessionTitle(sessionData.title || 'Video Session');
      }
    } catch (error) {
      console.error('Error fetching session title:', error);
      setSessionTitle('Video Session');
    }
  };

  const toggleTestMode = () => {
    if (!testMode) {
      // Create simulated participants
      const simulated = [
        { userId: 'sim-1', userName: 'Test Student 1', role: 'student' },
        { userId: 'sim-2', userName: 'Test Student 2', role: 'student' },
        { userId: 'sim-3', userName: 'Test Teacher', role: 'teacher' }
      ];
      setSimulatedParticipants(simulated);
      setParticipants(simulated);
      setTestMode(true);
      console.log('Test mode enabled with simulated participants');
    } else {
      setSimulatedParticipants([]);
      setTestMode(false);
      console.log('Test mode disabled');
    }
  };

  // Helper function for teachers to create connections with existing students
  const createTeacherConnection = async (userId, userName) => {
    if (userRole !== 'teacher') return;
    
    console.log('Teacher creating connection with existing student:', userName);
    
    // Create peer connection
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections.current.set(userId, peerConnection);

    // Monitor connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Teacher peer connection state changed:', peerConnection.connectionState, 'for user:', userName);
      console.log('Teacher connection details:', {
        connectionState: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState,
        signalingState: peerConnection.signalingState
      });
      
      // Add timeout for connection
      if (peerConnection.connectionState === 'connecting') {
        setTimeout(() => {
          if (peerConnection.connectionState === 'connecting') {
            console.log('Teacher connection timeout for user:', userName);
          }
        }, 10000); // 10 second timeout
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('Teacher ICE connection state changed:', peerConnection.iceConnectionState, 'for user:', userName);
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log('Teacher ICE gathering state changed:', peerConnection.iceGatheringState, 'for user:', userName);
    };

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream for user:', userName, 'Streams:', event.streams.length);
      const remoteStream = event.streams[0];
      
      if (remoteStream) {
        console.log('Setting remote stream for user:', userName);
        setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
        
        // Set video element source immediately and with retry
        const setVideoSource = () => {
          const videoElement = remoteVideosRef.current.get(userId);
          if (videoElement) {
            console.log('Assigning stream to video element for:', userName);
            videoElement.srcObject = remoteStream;
            videoElement.onloadedmetadata = () => {
              console.log('Video metadata loaded for:', userName);
              videoElement.play().catch(e => console.error('Error playing video:', e));
            };
          } else {
            console.log('Video element not found for user:', userName, 'Retrying...');
            setTimeout(setVideoSource, 100);
          }
        };
        
        setVideoSource();
      } else {
        console.error('No remote stream received for user:', userName);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Teacher sending ICE candidate to student:', event.candidate.type, 'Protocol:', event.candidate.protocol, 'Address:', event.candidate.address);
        console.log('ICE candidate details:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
          candidate: event.candidate.candidate
        });
        sendMessage({
          type: 'ice_candidate',
          candidate: event.candidate,
          targetUserId: userId
        });
      } else {
        console.log('Teacher ICE gathering complete');
      }
    };

    // Create and send offer
    try {
      console.log('Creating offer for user:', userName);
      const offer = await peerConnection.createOffer();
      console.log('Offer created, setting local description');
      await peerConnection.setLocalDescription(offer);
      console.log('Local description set, sending offer to:', userName);
      
      // Force ICE gathering to start (workaround for same-machine testing)
      setTimeout(() => {
        console.log('Teacher forcing ICE gathering restart');
        peerConnection.restartIce();
      }, 100);
      
      sendMessage({
        type: 'offer',
        offer: offer,
        targetUserId: userId
      });
      console.log('Offer sent successfully to:', userName);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Create peer connections for existing participants when localStream becomes available
  useEffect(() => {
    if (localStream) {
      // Create peer connections for existing participants
      peerConnections.current.forEach((peerConnection, userId) => {
        if (userId !== localStorage.getItem('userId')) {
          console.log(`Creating connection for existing participant: ${userId}`);
          // Add local stream tracks to peer connection
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }
      });
    }
  }, [localStream]);

  // Connect local video element to stream when available
  useEffect(() => {
    if (localStream) {
      console.log('Connecting local video elements to stream');
      
      // Connect picture-in-picture local video
      if (localVideoRef.current) {
        console.log('Connecting PiP local video element to stream');
        localVideoRef.current.srcObject = localStream;
        
        localVideoRef.current.onloadedmetadata = () => {
          console.log('PiP local video metadata loaded');
          localVideoRef.current.play().catch(e => {
            console.error('Error playing PiP local video:', e);
          });
        };
      }
      
      // Connect main local video
      if (mainLocalVideoRef.current) {
        console.log('Connecting main local video element to stream');
        mainLocalVideoRef.current.srcObject = localStream;
        
        mainLocalVideoRef.current.onloadedmetadata = () => {
          console.log('Main local video metadata loaded');
          mainLocalVideoRef.current.play().catch(e => {
            console.error('Error playing main local video:', e);
          });
        };
      }
      
      // Add error handling
      const handleVideoError = (e) => {
        console.error('Local video error:', e);
      };
      
      if (localVideoRef.current) {
        localVideoRef.current.onerror = handleVideoError;
      }
      if (mainLocalVideoRef.current) {
        mainLocalVideoRef.current.onerror = handleVideoError;
      }
    }
  }, [localStream]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={leaveSession}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave Session
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{sessionTitle}</h1>
            <p className="text-sm text-gray-600">Live Video Session</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className={`${isConnecting ? 'text-yellow-600' : 'text-green-600'}`}>
              {connectionStatus}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{participants.length} Active Participants</span>
          </div>
          {userRole === 'teacher' && (
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <><BellDot className="w-4 h-4 animate-pulse" />Recording...</>
              ) : (
                <><VideoIcon className="w-4 h-4" />Start Recording</>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
          </Button>
          <Button
            variant={testMode ? "default" : "outline"}
            size="sm"
            onClick={toggleTestMode}
            className="flex items-center gap-2"
          >
            {testMode ? "Test Mode ON" : "Test Mode"}
          </Button>
        </div>
      </div>

      {/* Camera Permission Request Overlay */}
      {!cameraPermissionGranted && (
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Enable Camera & Microphone</h2>
            <p className="text-gray-600 mb-6">
              To join the video session, you need to allow camera and microphone access. 
              This is required for video conferencing.
            </p>
            <Button
              onClick={requestCameraPermission}
              disabled={isRequestingPermission}
              size="lg"
              className="w-full"
            >
              {isRequestingPermission ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Requesting Permission...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Enable Camera & Microphone
                </div>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Your browser will ask for permission. Please click "Allow" when prompted.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {cameraPermissionGranted && (
        <div className="flex flex-1 overflow-hidden">
          {/* Video Streams Section */}
          <div className="relative flex-1 bg-gray-900 flex items-center justify-center p-4">
            {/* Local Video (Picture-in-Picture style) */}
            <div className="absolute top-4 left-4 w-40 h-30 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border-2 border-blue-500">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
              {localStream && !isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs font-medium">
                  Video Off
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {remoteStreams.size === 0 && !testMode ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                  <div className="mb-4">
                    <Video className="w-16 h-16 mx-auto text-white opacity-75" />
                  </div>
                  <p className="text-white text-lg opacity-75 mb-4">Waiting for other participants to join...</p>
                  {/* Show local video prominently when no remote participants */}
                  {localStream && (
                    <div className="w-96 h-72 bg-gray-800 rounded-lg shadow-lg overflow-hidden mx-auto relative">
                      <video 
                        ref={mainLocalVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        You (Local)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full h-full p-4">
                {/* Real remote streams */}
                {[...remoteStreams.entries()].map(([userId, stream]) => (
                  <div key={userId} className="relative w-full h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <video 
                      ref={el => remoteVideosRef.current.set(userId, el)}
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    ></video>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {participants.find(p => p.userId === userId)?.userName || 'Participant'}
                    </div>
                  </div>
                ))}
                
                {/* Simulated participants in test mode */}
                {testMode && simulatedParticipants.map((participant) => (
                  <div key={participant.userId} className="relative w-full h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <div className="text-center text-white">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">{participant.userName}</p>
                        <p className="text-xs opacity-75">{participant.role}</p>
                        <p className="text-xs opacity-50 mt-1">(Simulated)</p>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {participant.userName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Section (Conditional) */}
          {showChat && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <ChatBox sessionId={sessionId} />
            </div>
          )}
        </div>
      )}

      {/* Controls Bar */}
      {cameraPermissionGranted && (
        <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
          <Button 
            variant={isAudioEnabled ? "default" : "destructive"} 
            onClick={toggleAudio}
            size="lg"
            className="rounded-full p-3"
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          <Button 
            variant={isVideoEnabled ? "default" : "destructive"} 
            onClick={toggleVideo}
            size="lg"
            className="rounded-full p-3"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          <Button 
            variant={isScreenSharing ? "default" : "outline"} 
            onClick={toggleScreenShare}
            size="lg"
            className="rounded-full p-3"
          >
            <Monitor className="w-6 h-6" />
          </Button>
          <Button 
            variant={showChat ? "default" : "outline"} 
            onClick={() => setShowChat(!showChat)}
            size="lg"
            className="rounded-full p-3"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
          <Button 
            variant="destructive" 
            onClick={leaveSession}
            size="lg"
            className="rounded-full p-3"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      )}
      {/* Hidden download link for recording */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VideoConference;