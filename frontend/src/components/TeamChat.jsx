import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, MessageCircle, Shield } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuthStore } from '../store/useAuthStore';

export default function TeamChat() {
  const { user } = useAuthStore();
  const { isConnected, messages, sendMessage } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const listRef = useRef(null);

  // Inject CSS keyframes for animation
  useEffect(() => {
    const styleId = 'team-chat-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Listen for external open triggers
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('chat:open', handleOpen);
    return () => window.removeEventListener('chat:open', handleOpen);
  }, []);

  // Track unread messages
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages.length]);

  // Clear unreads on open
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  // Only render if a user is authenticated
  if (!user) return null;

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = '0 10px 35px rgba(79, 70, 229, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(79, 70, 229, 0.4)';
          }}
        >
          <MessageCircle size={26} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '10px',
                padding: '3px 7px',
                border: '2px solid #ffffff'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-up Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '360px',
            height: '500px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 999,
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#10b981' : '#f59e0b',
                  boxShadow: isConnected ? '0 0 8px #10b981' : 'none'
                }}
              />
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>Team Live Room</h4>
                <span style={{ fontSize: '9px', opacity: 0.85 }}>
                  {isConnected ? 'Connected & Live' : 'Reconnecting...'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: 0.8,
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '12px',
                  textAlign: 'center',
                  padding: '20px'
                }}
              >
                <MessageSquare size={36} strokeWidth={1.5} style={{ marginBottom: '10px' }} />
                <span>Welcome to the Team Live Room!</span>
                <span style={{ fontSize: '10px', marginTop: '4px' }}>Send a message to start real-time chatting.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.senderId === user.id;
                const authorInitials = msg.senderName
                  ? msg.senderName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'TM';

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isSelf ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    {/* Meta info */}
                    {!isSelf && (
                      <span style={{ fontSize: '9.5px', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                        <strong>{msg.senderName}</strong>
                        <span style={{ fontSize: '8px', background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                          {msg.senderRole}
                        </span>
                      </span>
                    )}

                    {/* Bubble body */}
                    <div style={{ display: 'flex', gap: '8px', maxWidth: '85%' }}>
                      {!isSelf && (
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {authorInitials}
                        </div>
                      )}
                      <div
                        style={{
                          background: isSelf ? '#4f46e5' : '#ffffff',
                          color: isSelf ? '#ffffff' : '#1e293b',
                          padding: '8px 12px',
                          borderRadius: isSelf ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                          fontSize: '11.5px',
                          lineHeight: '1.4',
                          border: isSelf ? 'none' : '1px solid #e2e8f0'
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>

                    <span style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', alignSelf: isSelf ? 'flex-end' : 'flex-start', marginLeft: isSelf ? '0' : '38px' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '12px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              background: '#ffffff'
            }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              style={{
                background: text.trim() ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: text.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
