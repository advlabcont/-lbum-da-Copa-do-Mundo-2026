import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, limit, getDoc, or } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, BookOpen, Users, Trash2, Megaphone, ChevronRight } from 'lucide-react';
import { getTotalStickersCount, ALBUM_SECTIONS } from '../lib/stickers';

interface Album {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[];
  stickers: Record<string, number>;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'update' | 'alert';
  createdAt: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const fetchedOwnerIds = React.useRef<Set<string>>(new Set());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Fetch owner names for shared albums
    const fetchOwnerNames = async () => {
      const missingOwnerIds = albums
        .filter(a => a.ownerId !== user.uid)
        .map(a => a.ownerId)
        .filter(id => !fetchedOwnerIds.current.has(id));
        
      if (missingOwnerIds.length === 0) return;

      missingOwnerIds.forEach(id => fetchedOwnerIds.current.add(id));

      const newNames: Record<string, string> = {};
      for (const id of missingOwnerIds) {
        try {
          const docRef = doc(db, 'users', id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             newNames[id] = snap.data().displayName || 'Colecionador';
          } else {
             newNames[id] = 'Colecionador';
          }
        } catch (error) {
          console.error("Error fetching owner name", error);
        }
      }
      setOwnerNames(prev => ({ ...prev, ...newNames }));
    };

    fetchOwnerNames();
  }, [albums, user]);

  useEffect(() => {
    if (!user) return;

    // Fetch announcements
    const annQuery = query(
      collection(db, 'announcements'), 
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribeAnn = onSnapshot(annQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (error) => {
      console.error("Announcements fetch error:", error);
      // Not throwing a UI error for announcements if it fails (e.g. index building)
    });

    try {
      const q = query(
        collection(db, 'albums'), 
        or(
          where('ownerId', '==', user.uid),
          where('sharedWith', 'array-contains', user.uid)
        )
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAlbums = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Album));
        console.log(`Fetched ${fetchedAlbums.length} albums for ${user.uid}`);
        setAlbums(fetchedAlbums);
        setLoading(false);
      }, (error) => {
        console.error("Albums fetch error:", error);
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'albums');
      });

      return () => {
        unsubscribe();
        unsubscribeAnn();
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'albums');
    }
  }, [user]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAlbumName.trim()) return;

    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'albums'), {
        ownerId: user.uid,
        name: newAlbumName.trim(),
        sharedWith: [],
        stickers: {},
      });
      navigate(`/album/${docRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'albums');
    } finally {
      setIsCreating(false);
      setNewAlbumName('');
    }
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, albumId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Tem certeza que deseja excluir este álbum? Esta ação é irreversível.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'albums', albumId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `albums/${albumId}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando seus álbuns...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black text-gray-900 tracking-tight leading-tight">Meus Álbuns</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-yellow-200 shadow-sm flex flex-col items-center justify-center text-center">
          <BookOpen className="w-6 h-6 text-green-700 mb-2" />
          <span className="text-2xl font-black text-gray-900">{albums.filter(a => a.ownerId === user?.uid).length}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Meus Álbuns</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-yellow-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="w-6 h-6 text-green-700 mb-2" />
          <span className="text-2xl font-black text-gray-900">{albums.filter(a => a.ownerId !== user?.uid).length}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compartilhados</span>
        </div>
      </div>

      <div className="mb-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
           <Users className="w-5 h-5" />
        </div>
        <div className="text-sm text-blue-900">
          <p className="font-bold">Dica: Álbuns Compartilhados</p>
          <p className="opacity-80">Álbuns que outros colecionadores compartilharem com você aparecerão automaticamente nesta página, na seção "Compartilhados Comigo".</p>
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="mb-10 bg-green-50 border border-green-100 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Megaphone className="w-24 h-24 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-green-700" />
              <h2 className="font-black text-green-900 uppercase tracking-wider text-sm">Novidades</h2>
            </div>
            
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="flex items-start gap-4 p-4 bg-white/60 hover:bg-white rounded-2xl transition-colors border border-green-100/50 group cursor-default">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ann.type === 'alert' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-950 text-base">{ann.title}</h3>
                    <p className="text-green-800/70 text-sm mt-1 leading-relaxed">{ann.content}</p>
                    {ann.createdAt && (
                      <span className="text-[10px] font-bold text-green-600/50 uppercase mt-2 block">
                        {ann.createdAt.seconds 
                          ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('pt-BR') 
                          : new Date(ann.createdAt).toLocaleDateString('pt-BR') !== 'Invalid Date'
                            ? new Date(ann.createdAt).toLocaleDateString('pt-BR')
                            : ''
                        }
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meus Álbuns Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Meus Álbuns</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.filter(a => a.ownerId === user?.uid).map((album) => {
            // Calculate progress
            const totalStickersCount = getTotalStickersCount();
            const uniqueCollected = Object.entries(album.stickers || {}).filter(([id, amount]) => {
              const sectionId = id.split('-')[0];
              const section = ALBUM_SECTIONS.find(s => s.id === sectionId);
              return (amount as number) > 0 && section && !section.excludeFromTotal;
            }).length;
            const pct = Math.round((uniqueCollected / totalStickersCount) * 100) || 0;
            
            return (
            <Link
              key={album.id}
              to={`/album/${album.id}`}
              className="block bg-white rounded-2xl border border-yellow-300 shadow-sm hover:shadow-lg hover:border-yellow-400 hover:-translate-y-1 transition-all overflow-hidden relative group"
            >
              <div className="h-2 bg-yellow-100 w-full absolute top-0 left-0">
                 <div className="h-full bg-green-700 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
              </div>
              
              <div className="p-6 pt-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-green-800">
                        <BookOpen className="w-5 h-5 flex-shrink-0" />
                        <h3 className="font-bold text-xl leading-none truncate text-green-900">{album.name}</h3>
                      </div>
                      <button
                        onClick={(e) => handleDeleteAlbum(e, album.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Excluir Álbum"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        <span className="font-black text-gray-800">{uniqueCollected}</span> de {totalStickersCount}
                      </div>
                      <div className="font-bold text-green-700">
                        {pct}%
                      </div>
                    </div>
                  </div>
                </div>
                
                {album.sharedWith && album.sharedWith.length > 0 && (
                  <div className="mt-4 flex items-center text-xs font-bold text-green-900 bg-yellow-400 px-3 py-1.5 rounded-full w-fit">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Compartilhado
                  </div>
                )}
              </div>
            </Link>
          )})}

          <div className="bg-white rounded-2xl border-2 border-dashed border-yellow-300 p-6 flex flex-col justify-center hover:bg-yellow-50 transition-colors">
            <form onSubmit={handleCreateAlbum} className="flex flex-col space-y-4 w-full">
              <h3 className="font-bold text-green-900 leading-none mb-1">Novo Álbum</h3>
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Ex: Álbum Oficial Copa 26"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 touch-manipulation"
                disabled={isCreating}
                required
              />
              <button
                type="submit"
                disabled={isCreating || !newAlbumName.trim()}
                className="flex items-center justify-center space-x-2 w-full min-h-[48px] px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-green-900 rounded-lg transition-colors disabled:opacity-50 text-base font-bold touch-manipulation"
              >
                <PlusCircle className="w-5 h-5 flex-shrink-0" />
                <span>Criar Álbum</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Compartilhados Comigo Section */}
      {albums.filter(a => a.ownerId !== user?.uid).length > 0 && (
        <div className="mt-12 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Compartilhados Comigo</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.filter(a => a.ownerId !== user?.uid).map((album) => {
              // Calculate progress
              const totalStickersCount = getTotalStickersCount();
              const uniqueCollected = Object.entries(album.stickers || {}).filter(([id, amount]) => {
                const sectionId = id.split('-')[0];
                const section = ALBUM_SECTIONS.find(s => s.id === sectionId);
                return (amount as number) > 0 && section && !section.excludeFromTotal;
              }).length;
              const pct = Math.round((uniqueCollected / totalStickersCount) * 100) || 0;
              
              return (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                className="block bg-white rounded-2xl border border-yellow-300 shadow-sm hover:shadow-lg hover:border-yellow-400 hover:-translate-y-1 transition-all overflow-hidden relative group"
              >
                <div className="h-2 bg-yellow-100 w-full absolute top-0 left-0">
                   <div className="h-full bg-green-700 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                </div>
                
                <div className="p-6 pt-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-green-800">
                          <Users className="w-5 h-5 flex-shrink-0" />
                          <div className="flex flex-col">
                            <h3 className="font-bold text-xl leading-none truncate text-green-900">{album.name}</h3>
                            {ownerNames[album.ownerId] && (
                              <span className="text-xs text-green-700/80 font-medium mt-1">de {ownerNames[album.ownerId]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="text-gray-500">
                          <span className="font-black text-gray-800">{uniqueCollected}</span> de {totalStickersCount}
                        </div>
                        <div className="font-bold text-green-700">
                          {pct}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}
