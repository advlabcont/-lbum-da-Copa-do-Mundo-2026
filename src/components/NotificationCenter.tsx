import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Bell, X, Check, Share2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  type: 'album_shared';
  albumId: string;
  albumName: string;
  read: boolean;
  createdAt: any;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    }, (error) => {
      console.error("Notifications error", error);
      // handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return unsubscribe;
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
       console.error("Error marking as read", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
       console.error("Error deleting notification", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-yellow-400 transition-colors bg-white/10 rounded-full"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full ring-2 ring-green-700">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden text-gray-900 animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-xs text-gray-500">Notificações</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Nenhuma notificação por enquanto.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50/50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            <span className="font-bold">{notification.fromUserName}</span> compartilhou o álbum <span className="font-bold">"{notification.albumName}"</span> com você.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                             <Link 
                               to={`/album/${notification.albumId}`} 
                               onClick={() => {
                                 setIsOpen(false);
                                 markAsRead(notification.id);
                               }}
                               className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md hover:bg-green-100 transition-colors"
                             >
                               Ver Álbum
                             </Link>
                             {!notification.read && (
                               <button 
                                 onClick={() => markAsRead(notification.id)}
                                 className="text-xs font-bold text-gray-500 hover:text-green-700"
                               >
                                 Marcar como lida
                               </button>
                             )}
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-300 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
               <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Suas últimas 20 atividades</p>
               </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
