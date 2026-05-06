import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { ALBUM_SECTIONS, AlbumSection, generateStickerIdsForSection, getTotalStickersCount } from '../lib/stickers';
import { ArrowLeft, Users, UserPlus, Minus, Plus, Share2, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Album {
  id: string;
  name: string;
  ownerId: string;
  sharedWith: string[];
  stickers: Record<string, number>;
}

export default function AlbumView() {
  const { albumId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState({ type: '', text: '' });
  const [isSharing, setIsSharing] = useState(false);
  
  const [activeSection, setActiveSection] = useState<string>(ALBUM_SECTIONS[0].id);

  useEffect(() => {
    if (!user || !albumId) return;

    const docRef = doc(db, 'albums', albumId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAlbum({ id: docSnap.id, ...docSnap.data() } as Album);
      } else {
        // Album deleted or doesn't exist
        navigate('/');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `albums/${albumId}`);
    });

    return unsubscribe;
  }, [user, albumId, navigate]);

  const updateSticker = async (stickerId: string, delta: number) => {
    if (!album || !albumId) return;
    
    const currentAmount = album.stickers[stickerId] || 0;
    const newAmount = Math.max(0, currentAmount + delta); // don't go below 0

    // Optimistic UI updates are handled by onSnapshot fairly quickly,
    // but just sending the request.
    try {
      const docRef = doc(db, 'albums', albumId);
      await updateDoc(docRef, {
        [`stickers.${stickerId}`]: newAmount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `albums/${albumId}`);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim() || !albumId) return;

    setIsSharing(true);
    setShareMessage({ type: '', text: '' });

    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', shareEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setShareMessage({ type: 'error', text: 'Usuário não encontrado. Peça para ele fazer login primeiro.' });
        return;
      }

      const friendId = querySnapshot.docs[0].id;
      
      if (friendId === album?.ownerId) {
         setShareMessage({ type: 'error', text: 'Você já é o dono deste álbum.' });
         return;
      }

      if (album?.sharedWith?.includes(friendId)) {
         setShareMessage({ type: 'info', text: 'Álbum já compartilhado com esta pessoa.' });
         return;
      }

      const docRef = doc(db, 'albums', albumId);
      await updateDoc(docRef, {
        sharedWith: arrayUnion(friendId)
      });

      setShareMessage({ type: 'success', text: 'Álbum compartilhado com sucesso!' });
      setShareEmail('');
    } catch (error) {
      console.error(error);
      setShareMessage({ type: 'error', text: 'Erro ao compartilhar álbum.' });
      handleFirestoreError(error, OperationType.UPDATE, `albums/${albumId}`);
    } finally {
      setIsSharing(false);
    }
  };

  const generatePDF = () => {
    if (!album) return;
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Figurinhas Repetidas - ${album.name}`, 14, 22);
    
    const repeated: [string, string][] = [];
    (Object.entries(album.stickers || {}) as [string, number][]).forEach(([id, amount]) => {
       if (amount > 1) {
          repeated.push([id, `${amount - 1}`]);
       }
    });
    
    if (repeated.length === 0) {
      alert('Você não tem figurinhas repetidas no momento.');
      return;
    }
    
    autoTable(doc, {
      startY: 30,
      head: [['Figurinha', 'Quantidade Repetida']],
      body: repeated,
      theme: 'grid',
      styles: { fontSize: 12 },
      headStyles: { fillColor: [21, 128, 61] } // bg-green-700
    });
    
    doc.save(`repetidas-${album.name}.pdf`);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando álbum...</div>;
  if (!album) return null;

  const currentSectionData = ALBUM_SECTIONS.find(s => s.id === activeSection);
  const sectionStickers = currentSectionData ? generateStickerIdsForSection(currentSectionData) : [];

  const isOwner = album.ownerId === user?.uid;

  const totalStickersCount = getTotalStickersCount();
  
  let uniqueCollected = 0;
  let duplicates = 0;
  let totalCardsCount = 0;

  Object.values(album.stickers || {}).forEach((amount: any) => {
    if (amount > 0) {
      uniqueCollected++;
      totalCardsCount += amount;
      if (amount > 1) {
        duplicates += (amount - 1);
      }
    }
  });

  const missingCount = totalStickersCount - uniqueCollected;
  const percentage = Math.round((uniqueCollected / totalStickersCount) * 100) || 0;

  const chartData = [
    { name: 'Tenho', value: uniqueCollected, color: '#facc15' }, // yellow-400
    { name: 'Falta', value: missingCount, color: '#e5e7eb' }, // gray-200
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar for Navigation / Sharing */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
        <div>
          <div className="flex items-center space-x-3 border-b-2 border-yellow-200 pb-4">
            <Link to="/" className="p-2 -ml-2 text-green-700 hover:bg-yellow-100 rounded-full transition-colors flex-shrink-0 touch-manipulation">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-green-900 truncate">{album.name}</h1>
          </div>
          <div className="flex items-center justify-between mt-3">
             <div className="flex items-center text-sm text-green-700 font-medium">
               <Users className="w-4 h-4 mr-2" />
               {album.sharedWith.length} amigo(s)
             </div>
             <button
               onClick={generatePDF}
               className="flex items-center text-xs font-bold px-3 py-1.5 bg-yellow-400 text-green-900 rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
             >
               <Download className="w-3.5 h-3.5 mr-1.5" />
               PDF Repetidas
             </button>
          </div>
        </div>

        {isOwner && (
          <div className="bg-white p-4 rounded-xl border border-yellow-300 shadow-sm">
            <h3 className="text-sm font-semibold text-green-900 flex items-center mb-3">
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </h3>
            <form onSubmit={handleShare} className="space-y-2">
              <input
                type="email"
                placeholder="Email do parceiro(a)"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="submit"
                disabled={isSharing}
                className="w-full flex items-center justify-center py-2 bg-green-700 text-white hover:bg-green-800 rounded-md transition-colors text-sm font-medium disabled:opacity-50 touch-manipulation"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
              </button>
            </form>
            {shareMessage.text && (
              <p className={`mt-2 text-xs font-medium ${
                shareMessage.type === 'error' ? 'text-red-600' :
                shareMessage.type === 'success' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {shareMessage.text}
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-yellow-300 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-yellow-200 text-sm font-bold text-green-900 uppercase tracking-wider">
            Seções
          </div>
          <div className="flex overflow-x-auto space-x-2 p-2 lg:flex-col lg:space-x-0 lg:max-h-[60vh] lg:overflow-y-auto w-full hide-scrollbar">
            {ALBUM_SECTIONS.map((section) => {
              const active = activeSection === section.id;
              
              // Calculate progress for section
              const secIds = generateStickerIdsForSection(section);
              let ownedCount = 0;
              secIds.forEach(id => {
                 if (album.stickers[id] && album.stickers[id] > 0) ownedCount++;
              });
              const pct = Math.round((ownedCount / section.count) * 100);

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-shrink-0 lg:w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    active ? 'bg-green-700 text-yellow-300 font-bold' : 'text-green-800 hover:bg-yellow-50 font-medium'
                  }`}
                >
                  <span className="truncate mr-4">{section.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border min-w-fit ${active ? 'bg-green-800 text-yellow-300 border-green-600' : 'bg-white text-green-700 border-yellow-300'}`}>
                    {ownedCount}/{section.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        
        {/* Dashboard Progress Panel */}
        <div className="bg-white rounded-xl border-t-4 border-yellow-400 p-6 flex flex-col md:flex-row items-center gap-8 shadow-md">
           <div className="relative w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={55}
                     outerRadius={75}
                     startAngle={90}
                     endAngle={-270}
                     dataKey="value"
                     stroke="none"
                     isAnimationActive={true}
                   >
                      {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-green-900 tracking-tighter">{percentage}%</span>
                 <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Completo</span>
              </div>
           </div>
           
           <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6 w-full">
             <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 lg:p-4 shadow-sm">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5 lg:mb-1">Álbum</p>
                <p className="text-xl lg:text-2xl font-black text-gray-800">{totalStickersCount}</p>
             </div>
             <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4 shadow-sm">
                <p className="text-green-700 text-[10px] font-bold uppercase tracking-wider mb-0.5 lg:mb-1">Tenho</p>
                <p className="text-xl lg:text-2xl font-black text-green-800">{uniqueCollected}</p>
             </div>
             <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4 shadow-sm">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 lg:mb-1">Faltam</p>
                <p className="text-xl lg:text-2xl font-black text-gray-500">{missingCount}</p>
             </div>
             <div className="bg-green-800 border border-green-900 rounded-lg p-3 lg:p-4 shadow-sm text-center col-span-2 sm:col-span-1">
                <p className="text-green-200 text-[10px] font-bold uppercase tracking-wider mb-0.5 lg:mb-1">Estoque</p>
                <p className="text-xl lg:text-2xl font-black text-yellow-400">{totalCardsCount}</p>
             </div>
             <div className="bg-yellow-400 border border-yellow-500 rounded-lg p-3 lg:p-4 shadow-sm text-center col-span-2 sm:col-span-2">
                <p className="text-yellow-900 text-[10px] font-bold uppercase tracking-wider mb-0.5 lg:mb-1">Repetidas</p>
                <p className="text-xl lg:text-3xl font-black text-green-900">{duplicates}</p>
             </div>
           </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-2">
          <div className="flex items-center">
             <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2" />
             <span className="text-sm font-medium text-gray-700">Falta</span>
          </div>
          <div className="flex items-center">
             <div className="w-4 h-4 bg-green-700 shadow-md rounded mr-2 border border-green-800" />
             <span className="text-sm font-medium text-gray-700">Tenho (1)</span>
          </div>
          <div className="flex items-center">
             <div className="w-4 h-4 bg-yellow-400 shadow-md rounded mr-2 border border-yellow-500" />
             <span className="text-sm font-medium text-gray-700">Repetida (2+)</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {sectionStickers.map((stickerId) => {
             const amount = album.stickers[stickerId] || 0;
             const isMissing = amount === 0;
             const isDuplicate = amount > 1;

             const handleStickerClick = () => {
               if (amount === 0) updateSticker(stickerId, 1);
               else if (amount === 1) updateSticker(stickerId, 1); // move to duplicate (2)
               else updateSticker(stickerId, -amount); // reset to 0
             };

             return (
               <div 
                 key={stickerId}
                 className="flex flex-col items-center group relative pt-6"
               >
                 <div
                   onClick={handleStickerClick}
                   className={`relative cursor-pointer select-none w-14 h-16 sm:w-16 sm:h-20 flex flex-col items-center justify-center border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 touch-manipulation
                    ${isMissing 
                      ? 'bg-gray-50 border-gray-300 text-gray-400 hover:border-green-300 hover:text-green-700' 
                      : isDuplicate
                        ? 'bg-yellow-400 border-yellow-500 shadow-sm hover:bg-yellow-500 text-green-900 font-black'
                        : 'bg-green-700 border-green-800 text-yellow-300 shadow-sm hover:bg-green-800 font-bold'
                    }
                   `}
                 >
                    <span className={`text-[10px] font-bold mb-0.5 tracking-tighter ${isMissing ? 'opacity-70' : 'opacity-90'}`}>
                      {currentSectionData?.id}
                    </span>
                    <span className="text-lg leading-none">{stickerId.split('-')[1]}</span>
                    
                    {amount > 0 && (
                      <div className={`absolute -top-2 -right-2 w-6 h-6 border rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${
                        isDuplicate 
                          ? 'bg-green-800 border-green-900 text-yellow-300' 
                          : 'bg-yellow-400 border-yellow-500 text-green-900'
                      }`}>
                        {amount}
                      </div>
                    )}
                 </div>

                 {/* Increment/Decrement Buttons shown on hover if amount > 0 */}
                 <div className="absolute top-0 w-full flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateSticker(stickerId, -1); }}
                      className="pointer-events-auto bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 rounded-full p-1"
                      title="Diminuir"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateSticker(stickerId, 1); }}
                      className="pointer-events-auto bg-green-100 text-green-600 hover:bg-green-200 border border-green-200 rounded-full p-1"
                      title="Aumentar"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
