import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, BookOpen, Users } from 'lucide-react';
import { getTotalStickersCount } from '../lib/stickers';

interface Album {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[];
  stickers: Record<string, number>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    try {
      const q1 = query(collection(db, 'albums'), where('ownerId', '==', user.uid));
      const q2 = query(collection(db, 'albums'), where('sharedWith', 'array-contains', user.uid));

      const handleSnapshots = () => {
        // We will collect from both queries and merge
      };

      const albumsMap = new Map<string, Album>();

      const unsubscribe1 = onSnapshot(q1, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            albumsMap.delete(change.doc.id);
          } else {
            albumsMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as Album);
          }
        });
        setAlbums(Array.from(albumsMap.values()));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'albums-owner');
      });

      const unsubscribe2 = onSnapshot(q2, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            albumsMap.delete(change.doc.id);
          } else {
            albumsMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as Album);
          }
        });
        setAlbums(Array.from(albumsMap.values()));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'albums-shared');
      });

      return () => {
        unsubscribe1();
        unsubscribe2();
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

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando seus álbuns...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black text-gray-900 tracking-tight leading-tight">Meus Álbuns</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((album) => {
          // Calculate progress
          const totalStickersCount = getTotalStickersCount();
          const uniqueCollected = Object.values(album.stickers || {}).filter((amount: any) => amount > 0).length;
          const pct = Math.round((uniqueCollected / totalStickersCount) * 100) || 0;
          
          return (
          <Link
            key={album.id}
            to={`/album/${album.id}`}
            className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-green-300 hover:-translate-y-1 transition-all overflow-hidden relative group"
          >
            <div className="h-2 bg-gray-100 w-full absolute top-0 left-0">
               <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
            </div>
            
            <div className="p-6 pt-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-green-700">
                      <BookOpen className="w-5 h-5" />
                      <h3 className="font-bold text-xl leading-none truncate text-gray-900">{album.name}</h3>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      <span className="font-semibold text-gray-900">{uniqueCollected}</span> de {totalStickersCount}
                    </div>
                    <div className="font-bold text-green-600">
                      {pct}%
                    </div>
                  </div>
                </div>
              </div>
              
              {album.sharedWith && album.sharedWith.length > 0 && (
                <div className="mt-4 flex items-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full w-fit">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Compartilhado
                </div>
              )}
            </div>
          </Link>
        )})}

        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col justify-center hover:bg-gray-100 transition-colors">
          <form onSubmit={handleCreateAlbum} className="flex flex-col space-y-4 w-full">
            <h3 className="font-medium text-gray-900 leading-none mb-1">Novo Álbum</h3>
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Ex: Álbum Oficial Copa 26"
              className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-manipulation"
              disabled={isCreating}
              required
            />
            <button
              type="submit"
              disabled={isCreating || !newAlbumName.trim()}
              className="flex items-center justify-center space-x-2 w-full min-h-[48px] px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50 text-base font-medium touch-manipulation"
            >
              <PlusCircle className="w-5 h-5 flex-shrink-0" />
              <span>Criar Álbum</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
