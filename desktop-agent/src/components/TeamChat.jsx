import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, MessageCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

export default function TeamChat() {
  const { user } = useAuth();
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
            transform: translateY(15px) scale(0.97);
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
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <MessageCircle size={22} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--brand-red, #ef4444)',
                color: '#ffffff',
                fontSize: '9.5px',
                fontWeight: 'bold',
                borderRadius: '10px',
                padding: '2px 6px',
                border: '1.5px solid #ffffff'
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
            width: '320px',
            height: '440px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid var(--sidebar-border, #e2e8f0)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 999,
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isConnected ? '#22c55e' : '#f59e0b',
                  boxShadow: isConnected ? '0 0 6px #22c55e' : 'none'
                }}
              />
              <div>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Team Live Room</h4>
                <span style={{ fontSize: '8.5px', opacity: 0.85 }}>
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
                padding: '2px'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
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
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '20px'
                }}
              >
                <MessageSquare size={30} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
                <span>Welcome to the Team Live Room!</span>
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
                      <span style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '4px' }}>
                        <strong>{msg.senderName}</strong>
                        <span style={{ fontSize: '7.5px', background: '#e2e8f0', padding: '0.5px 3px', borderRadius: '2px', fontWeight: 'bold' }}>
                          {msg.senderRole}
                        </span>
                      </span>
                    )}

                    {/* Bubble body */}
                    <div style={{ display: 'flex', gap: '6px', maxWidth: '85%' }}>
                      {!isSelf && (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
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
                          background: isSelf ? 'var(--primary, #6366f1)' : '#ffffff',
                          color: isSelf ? '#ffffff' : '#1e293b',
                          padding: '6px 10px',
                          borderRadius: isSelf ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                          fontSize: '11px',
                          lineHeight: '1.35',
                          border: isSelf ? 'none' : '1px solid var(--sidebar-border, #e2e8f0)'
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>

                    <span style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '2.5px', alignSelf: isSelf ? 'flex-end' : 'flex-start', marginLeft: isSelf ? '0' : '30px' }}>
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
              padding: '10px',
              borderTop: '1px solid var(--sidebar-border, #e2e8f0)',
              display: 'flex',
              gap: '6px',
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
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              style={{
                background: text.trim() ? 'linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6)' : '#e2e8f0',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: text.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
