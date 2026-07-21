import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, Plus, Check, Trash2, X, Send } from 'lucide-react';
import { notificationApi, announcementApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function NotificationsTab({ companyId }) {
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

  const [announceForm, setAnnounceForm] = useState({
    title: '',
    body: '',
    targetType: 'ALL',
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifRes, annRes] = await Promise.all([
        notificationApi.list(),
        companyId ? announcementApi.list(companyId) : Promise.resolve({ data: { announcements: [] } }),
      ]);
      setNotifications(notifRes.data?.notifications || notifRes.notifications || []);
      setAnnouncements(annRes.data?.announcements || annRes.announcements || []);
    } catch (err) {
      toast.error('Failed to load notifications/announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      fetchData();
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      toast.success('All notifications marked as read');
      fetchData();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await announcementApi.create({ ...announceForm, companyId });
      toast.success('Broadcast announcement sent!');
      setShowAnnounceModal(false);
      setAnnounceForm({ title: '', body: '', targetType: 'ALL' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this broadcast announcement?')) return;
    try {
      await announcementApi.delete(id);
      toast.success('Announcement deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Communications & Broadcasts</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage enterprise company announcements and system notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition border border-gray-700"
          >
            <Check className="w-3.5 h-3.5" /> Mark All Read
          </button>
          {companyId && (
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              <Megaphone className="w-3.5 h-3.5" /> Post Announcement
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Broadcast Announcements Section */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Company Broadcasts</h3>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-800/30">
                {announcements.length} Active
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-gray-500">Loading broadcasts...</div>
            ) : announcements.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">No company announcements published yet.</div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 relative group">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ann.body}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
                      <span>Target: {ann.targetType}</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Notifications Inbox Section */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Notifications Inbox</h3>
              </div>
              <span className="text-[10px] bg-amber-950 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-800/30">
                {notifications.filter((n) => !n.read).length} Unread
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">Your notifications inbox is clean!</div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`border rounded-xl p-4 flex items-start justify-between gap-3 transition ${
                      notif.read ? 'bg-gray-900/30 border-gray-850 opacity-60' : 'bg-gray-900/80 border-gray-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-gray-500 mt-2 block">{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-bold uppercase shrink-0"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111827] border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white">Post Broadcast Announcement</h3>
              <button onClick={() => setShowAnnounceModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Announcement Title</label>
                <input
                  required
                  value={announceForm.title}
                  onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                  placeholder="e.g. Scheduled System Maintenance"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Target Audience</label>
                <select
                  value={announceForm.targetType}
                  onChange={(e) => setAnnounceForm({ ...announceForm, targetType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg"
                >
                  <option value="ALL">All Company Employees</option>
                  <option value="MANAGERS">Managers Only</option>
                  <option value="EMPLOYEES">Regular Staff Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Announcement Message Content</label>
                <textarea
                  required
                  rows={4}
                  value={announceForm.body}
                  onChange={(e) => setAnnounceForm({ ...announceForm, body: e.target.value })}
                  placeholder="Write message..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg resize-none"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAnnounceModal(false)} className="flex-1 py-2 border border-gray-700 text-gray-300 text-sm rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
