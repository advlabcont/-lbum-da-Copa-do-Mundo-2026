import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ArrowLeftRight, Check, X } from 'lucide-react';

interface Trade {
  id: string;
  creatorId: string;
  creatorStickersOffered: string[];
  creatorStickersRequested: string[];
  status: 'open' | 'completed' | 'cancelled';
  responderId?: string;
}

export default function TradesView() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [offered, setOffered] = useState('');
  const [requested, setRequested] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    try {
      // For simplicity, we fetch all open trades and user's own trades (even if completed)
      // Since rules allow reading all trades, we will read all open trades, plus my trades.
      // Firestore v9 doesn't easily let us say (status == open OR creatorId == me) with complex indexes if we aren't careful, 
      // but we can just query all trades, or just query status == 'open'. 
      // Let's just fetch all trades and filter in JS (rules allow read all).
      // Note: In a real large app we'd restrict read via rules, but here read is allowed for authenticated.
      const q = query(collection(db, 'trades'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tradesData: Trade[] = [];
        snapshot.forEach((doc) => {
          tradesData.push({ id: doc.id, ...doc.data() } as Trade);
        });
        
        // Sort: open first
        tradesData.sort((a, b) => {
           if (a.status === 'open' && b.status !== 'open') return -1;
           if (a.status !== 'open' && b.status === 'open') return 1;
           return 0;
        });
        setTrades(tradesData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'trades');
      });

      return unsubscribe;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'trades');
    }
  }, [user]);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const offeredList = offered.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const requestedList = requested.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    if (offeredList.length === 0 || requestedList.length === 0) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'trades'), {
        creatorId: user.uid,
        creatorStickersOffered: offeredList,
        creatorStickersRequested: requestedList,
        status: 'open',
      });
      setOffered('');
      setRequested('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trades');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    try {
      await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled' });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `trades/${tradeId}`);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    if (!user) return;
    try {
       await updateDoc(doc(db, 'trades', tradeId), { 
         status: 'completed',
         responderId: user.uid
       });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `trades/${tradeId}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando mercado de trocas...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black text-gray-900 tracking-tight leading-tight">Mercado de Trocas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
           <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-[5rem]">
             <h3 className="font-semibold text-xl mb-4 text-gray-900">Nova Proposta</h3>
             <form onSubmit={handleCreateTrade} className="space-y-5">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1.5">Ofereço as figurinhas</label>
                   <input
                     type="text"
                     placeholder="BRA-1, ARG-5, FWC-3"
                     value={offered}
                     onChange={(e) => setOffered(e.target.value)}
                     className="w-full h-12 px-4 shadow-sm border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-manipulation outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1.5">Quero em troca</label>
                   <input
                     type="text"
                     placeholder="USA-10, STA-1"
                     value={requested}
                     onChange={(e) => setRequested(e.target.value)}
                     className="w-full h-12 px-4 shadow-sm border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-manipulation outline-none"
                   />
                </div>
                <button
                  type="submit"
                  disabled={isCreating || !offered.trim() || !requested.trim()}
                  className="w-full min-h-[48px] py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base font-medium transition-colors disabled:opacity-50 touch-manipulation flex items-center justify-center"
                >
                  Publicar Troca
                </button>
             </form>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           {trades.filter(t => t.status === 'open' || t.creatorId === user?.uid).map(trade => {
              const isMine = trade.creatorId === user?.uid;
              const isOpen = trade.status === 'open';

              return (
                <div key={trade.id} className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                   <div className="flex-1 w-full">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                         <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                           {isMine ? 'Minha Proposta' : 'Oferta do Mercado'}
                         </span>
                         <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            trade.status === 'open' ? 'bg-green-100 text-green-800' :
                            trade.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                         }`}>
                            {trade.status === 'open' ? 'Aberta' : trade.status === 'completed' ? 'Concluída' : 'Cancelada'}
                         </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 w-full">
                         <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 sm:p-4 text-sm w-full">
                            <span className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Oferece:</span>
                            <div className="font-semibold text-gray-800 break-words">{trade.creatorStickersOffered.join(', ')}</div>
                         </div>
                         <div className="flex justify-center -my-2 sm:my-0 sm:block relative z-10">
                           <div className="bg-white rounded-full p-1 border border-gray-100 sm:border-none sm:bg-transparent">
                             <ArrowLeftRight className="w-5 h-5 text-gray-400 flex-shrink-0 transform rotate-90 sm:rotate-0" />
                           </div>
                         </div>
                         <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 sm:p-4 text-sm w-full">
                            <span className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Pede:</span>
                            <div className="font-semibold text-gray-800 break-words">{trade.creatorStickersRequested.join(', ')}</div>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col sm:w-auto w-full gap-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                      {isMine && isOpen && (
                         <button 
                           onClick={() => handleCancelTrade(trade.id)}
                           className="w-full sm:w-auto min-h-[44px] px-4 py-2 border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg text-sm font-semibold transition-colors touch-manipulation flex items-center justify-center"
                         >
                           <X className="w-4 h-4 mr-1.5" /> Cancelar
                         </button>
                      )}
                      {!isMine && isOpen && (
                         <button 
                           onClick={() => handleAcceptTrade(trade.id)}
                           className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-green-600 text-white hover:bg-green-700 shadow-sm rounded-lg text-sm font-semibold transition-colors touch-manipulation flex items-center justify-center transform active:scale-95"
                         >
                           <Check className="w-4 h-4 mr-1.5" /> Aceitar Troca
                         </button>
                      )}
                   </div>
                </div>
              );
           })}
           {trades.filter(t => t.status === 'open' || t.creatorId === user?.uid).length === 0 && (
             <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300">
                Nenhuma proposta de troca no momento.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
