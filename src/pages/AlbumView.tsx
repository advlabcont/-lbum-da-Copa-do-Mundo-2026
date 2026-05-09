import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { ALBUM_SECTIONS, AlbumSection, generateStickerIdsForSection, getTotalStickersCount, isStandardSticker, getExtraStickersCount, getAllStickerIds } from '../lib/stickers';
import { ArrowLeft, Users, UserPlus, Minus, Plus, Share2, Download, Search, HelpCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TutorialModal } from '../components/TutorialModal';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'missing' | 'duplicates'>('all');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial for this album
    if (albumId) {
      const hasSeen = localStorage.getItem(`tutorial-seen-${albumId}`);
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [albumId]);

  const handleCloseTutorial = () => {
    if (albumId) {
      localStorage.setItem(`tutorial-seen-${albumId}`, 'true');
    }
    setShowTutorial(false);
  };

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
      // Firebase generally returns emails in lowercase from auth providers
      const q = query(usersRef, where('email', '==', shareEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setShareMessage({ type: 'error', text: 'Usuário não encontrado. Peça para ele fazer login primeiro.' });
        return;
      }

      const friendId = querySnapshot.docs[0].id;
      const friendData = querySnapshot.docs[0].data();
      const friendName = friendData.displayName || shareEmail;
      
      if (friendId === album?.ownerId) {
         setShareMessage({ type: 'error', text: 'Você já é o dono deste álbum.' });
         return;
      }

      if (album?.sharedWith?.includes(friendId)) {
         setShareMessage({ type: 'info', text: `Este álbum já está compartilhado com ${friendName}.` });
         return;
      }

      const docRef = doc(db, 'albums', albumId);
      await updateDoc(docRef, {
        sharedWith: arrayUnion(friendId)
      });

      setShareMessage({ type: 'success', text: `Álbum compartilhado com ${friendName}!` });
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

  const groupedStickers = React.useMemo(() => {
    const groups: { section: AlbumSection, stickers: string[] }[] = [];
    const stickersData = album?.stickers || {};

    for (const section of ALBUM_SECTIONS) {
      let ids = generateStickerIdsForSection(section);
      
      // Apply filter
      if (filterType === 'missing') {
         ids = ids.filter(id => (stickersData[id] || 0) === 0);
      } else if (filterType === 'duplicates') {
         ids = ids.filter(id => (stickersData[id] || 0) > 1);
      }
      
      // Apply search
      if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase().trim();
         ids = ids.filter(id => {
           const sectionId = id.split('-')[0];
           const number = id.split('-')[1];
           const searchStr = `${sectionId} ${section.name} ${sectionId}${number} ${number}`.toLowerCase();
           return searchStr.includes(q);
         });
      }
      
      if (ids.length > 0) {
        groups.push({ section, stickers: ids });
      }
    }
    return groups;
  }, [searchQuery, filterType, album?.stickers]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando álbum...</div>;
  if (!album) return null;

  const isOwner = album.ownerId === user?.uid;

  const totalStickersCount = getTotalStickersCount();
  
  let uniqueCollected = 0;
  let duplicates = 0;
  let totalCardsCount = 0;

  let extraUniqueCollected = 0;
  let extraDuplicates = 0;
  let extraTotalCardsCount = 0;

  Object.entries(album.stickers || {}).forEach(([id, amount]) => {
    const numAmount = amount as number;
    if (numAmount > 0) {
      if (isStandardSticker(id)) {
        uniqueCollected++;
        totalCardsCount += numAmount;
        if (numAmount > 1) {
          duplicates += (numAmount - 1);
        }
      } else {
        extraUniqueCollected++;
        extraTotalCardsCount += numAmount;
        if (numAmount > 1) {
          extraDuplicates += (numAmount - 1);
        }
      }
    }
  });

  const missingCount = totalStickersCount - uniqueCollected;
  const percentage = totalStickersCount > 0 ? (Math.round((uniqueCollected / totalStickersCount) * 100 * 10) / 10).toFixed(1) : "0.0";
  const extraMax = getExtraStickersCount();

  const chartData = [
    { name: 'Tenho', value: uniqueCollected, color: '#166534' }, // green-800
    { name: 'Falta', value: missingCount, color: '#e5e7eb' }, // gray-200
  ];

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
      <TutorialModal isOpen={showTutorial} onClose={handleCloseTutorial} />
      
      {/* Header Info */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-yellow-300 shadow-sm">
         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
           <div className="flex flex-col gap-1 flex-1">
             <div className="flex items-center gap-3">
               <Link to="/" className="p-2 -ml-2 text-green-700 hover:bg-yellow-100 rounded-full transition-colors flex-shrink-0 touch-manipulation">
                 <ArrowLeft className="w-5 h-5" />
               </Link>
               <span className="text-xs font-black tracking-widest text-green-700 uppercase">
                 Olá, {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Colecionador'}
               </span>
               <button 
                 onClick={() => setShowTutorial(true)}
                 className="p-1 text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors"
                 title="Ver Tutorial"
               >
                 <HelpCircle className="w-4 h-4" />
               </button>
             </div>
             
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
               <div className="relative w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={chartData}
                         cx="50%"
                         cy="50%"
                         innerRadius={45}
                         outerRadius={60}
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
                     <span className="text-xl font-black text-green-900 tracking-tighter">{percentage}%</span>
                     <span className="text-[8px] uppercase font-bold text-green-700 tracking-wider">Completo</span>
                  </div>
               </div>
               
               <div>
                 <h1 className="text-4xl md:text-5xl font-black text-green-900 tracking-tight leading-tight">
                   Faltam {missingCount} para completar!
                 </h1>
                 <p className="text-green-800 font-medium mt-1 text-lg">
                   {uniqueCollected} de {totalStickersCount} figurinhas obtidas
                 </p>
               </div>
             </div>
           </div>
           
           <div className="flex items-center justify-end gap-3 self-start">
              <button
                onClick={generatePDF}
                className="flex items-center text-sm font-bold px-4 py-2 bg-yellow-400 text-green-900 rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF Repetidas
              </button>
           </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-stretch">
               <div className="w-1.5 bg-green-700 flex-shrink-0"></div>
               <div className="p-4 flex-1 bg-white">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Tenho</p>
                  <p className="text-3xl font-black text-gray-900 leading-none">{uniqueCollected}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">de {totalStickersCount}</p>
               </div>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-stretch">
               <div className="w-1.5 bg-red-600 flex-shrink-0"></div>
               <div className="p-4 flex-1 bg-white">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Faltam</p>
                  <p className="text-3xl font-black text-red-600 leading-none">{missingCount}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">pra completar</p>
               </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-stretch">
               <div className="w-1.5 bg-yellow-400 flex-shrink-0"></div>
               <div className="p-4 flex-1 bg-white">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Repetidas</p>
                  <p className="text-3xl font-black text-yellow-600 leading-none">{duplicates + extraDuplicates}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">pra trocar</p>
               </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-stretch">
               <div className="w-1.5 bg-amber-900 flex-shrink-0"></div>
               <div className="p-4 flex-1 bg-white">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 tracking-tighter">Especiais (Extra / Coca)</p>
                  <p className="text-3xl font-black text-amber-900 leading-none">{extraUniqueCollected}<span className="text-lg text-amber-900/60 font-bold">/{extraMax}</span></p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">patrocinador e lendas</p>
               </div>
            </div>
         </div>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-700/50" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Buscar seleção, código ou número (ex: Brasil, Portugal, BRA-07)"
             className="w-full text-base lg:text-lg pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm transition-all text-green-900"
           />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center bg-gray-100 p-1 rounded-lg">
             <button
               onClick={() => setFilterType('all')}
               className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white text-green-900 shadow-sm' : 'text-gray-600 hover:text-green-800'}`}
             >
               Todas
             </button>
             <button
               onClick={() => setFilterType('missing')}
               className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filterType === 'missing' ? 'bg-white text-green-900 shadow-sm' : 'text-gray-600 hover:text-green-800'}`}
             >
               Faltantes
             </button>
             <button
               onClick={() => setFilterType('duplicates')}
               className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filterType === 'duplicates' ? 'bg-white text-green-900 shadow-sm' : 'text-gray-600 hover:text-green-800'}`}
             >
               Repetidas
             </button>
           </div>
        </div>
      </div>

      {/* Grid Iteration */}
      <div className="flex flex-col gap-8 min-h-[400px]">
        {groupedStickers.length === 0 ? (
          <div className="bg-white rounded-xl border border-yellow-300 shadow-sm p-8 flex flex-col items-center justify-center py-20 text-center">
             <div className="text-gray-400 mb-4 bg-gray-50 p-4 rounded-full">
                <Search className="w-8 h-8" />
             </div>
             <p className="text-lg font-bold text-gray-700">Nenhuma figurinha encontrada.</p>
             <p className="text-sm text-gray-500 mt-1">Tente mudar os filtros ou a busca.</p>
          </div>
        ) : (
          groupedStickers.map(({ section, stickers }) => {
            const secIds = generateStickerIdsForSection(section);
            let ownedCount = 0;
            secIds.forEach(id => {
               if (album.stickers[id] && album.stickers[id] > 0) ownedCount++;
            });

            return (
              <div key={section.id} className="bg-white rounded-xl border border-yellow-300 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-yellow-100 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-2 py-1 rounded-md tracking-wider">
                      {section.id}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-green-900">{section.name}</h2>
                  </div>
                  <div className="mt-2 sm:mt-0 px-3 py-1 bg-yellow-50 text-green-800 text-sm font-bold rounded-full border border-yellow-200 shadow-sm">
                    {ownedCount} / {section.count} obtidas
                  </div>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                  {stickers.map((stickerId) => {
                    const amount = album.stickers[stickerId] || 0;
                    const sectionId = stickerId.split('-')[0];
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
                             {sectionId}
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
            );
          })
        )}
      </div>

      {isOwner && (
        <div className="bg-white p-6 md:p-8 flex flex-col items-center justify-center rounded-2xl border border-yellow-300 shadow-sm max-w-xl mx-auto w-full mt-4">
          <h3 className="text-xl font-bold text-green-900 flex items-center mb-4">
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar Álbum
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Convide um amigo para ver suas repetidas e controlar as figurinhas que faltam junto com você.
          </p>
          <form onSubmit={handleShare} className="flex flex-col sm:flex-row w-full gap-3">
            <input
              type="email"
              placeholder="Email do colecionador(a)"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="flex-1 text-base px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px]"
              required
            />
            <button
              type="submit"
              disabled={isSharing}
              className="flex items-center justify-center px-6 py-3 bg-green-700 text-white hover:bg-green-800 rounded-xl transition-colors text-base font-bold disabled:opacity-50 touch-manipulation min-h-[48px]"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Convidar
            </button>
          </form>
          {shareMessage.text && (
            <p className={`mt-4 text-sm font-bold ${
              shareMessage.type === 'error' ? 'text-red-600' :
              shareMessage.type === 'success' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {shareMessage.text}
            </p>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
