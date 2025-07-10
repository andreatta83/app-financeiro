import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, collection, query, addDoc, deleteDoc } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { Landmark, CreditCard, TrendingUp, LayoutDashboard, Plus, Trash2, Edit, X, Copy, ArrowDown, ArrowUp, LogOut, KeyRound, Target } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyARHXDG8M6Qd8U7UMsdjCFlDlwGpR6uors",
  authDomain: "meu-app-financeirov2.firebaseapp.com",
  projectId: "meu-app-financeirov2",
  storageBucket: "meu-app-financeirov2.firebasestorage.app",
  messagingSenderId: "30295709812",
  appId: "1:30295709812:web:b17b76c70c96c468aed921",
  measurementId: "G-D61EFQJYQ6"
};

// Inicializar Firebase e serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const appId = firebaseConfig.projectId;

// --- COMPONENTES DE UI (Helpers) ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Aviso"}>
      <p className="text-gray-300 mb-6 whitespace-pre-wrap">{message}</p>
      <div className="flex justify-end">
        <Button onClick={onClose}>OK</Button>
      </div>
    </Modal>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmar Ação"}>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-end gap-4">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={onConfirm} variant="danger">Excluir</Button>
            </div>
        </Modal>
    );
};

const Input = React.forwardRef((props, ref) => (
  <input
    ref={ref}
    {...props}
    className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
  />
));

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const StatCard = ({ title, value, icon, color, subValue }) => (
    <div className="bg-gray-800 p-6 rounded-2xl flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
            {subValue && <p className="text-gray-400 text-xs mt-1">{subValue}</p>}
        </div>
    </div>
);

// --- ECRÃ DE LOGIN ---

const LoginScreen = ({ showAlert }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showAlert("Erro de Login", "Por favor, preencha o email e a senha.");
            return;
        }
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // O onAuthStateChanged no componente App irá tratar da mudança de ecrã.
        } catch (error) {
            console.error("Erro de login:", error.code);
            let friendlyMessage = "Ocorreu um erro ao tentar fazer o login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                friendlyMessage = "Email ou senha inválidos. Por favor, tente novamente.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "O formato do email é inválido.";
            }
            showAlert("Erro de Login", friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Controle Financeiro</h1>
                    <p className="text-gray-400 mt-2">Faça login para aceder ao seu painel.</p>
                </div>
                <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl shadow-2xl space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2" htmlFor="email">Email</label>
                        <Input 
                            id="email"
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="seu.email@exemplo.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2" htmlFor="password">Senha</label>
                        <Input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <KeyRound size={16} />
                                Entrar
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};


// --- ABA DE GASTOS MENSAIS ---

const MonthlyExpenses = ({ db, userId, showAlert }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState({ fixed: [], essential: [], variable: [], superfluous: [] });
  const [previousMonthData, setPreviousMonthData] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemValue, setItemValue] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  
  useEffect(() => {
    if (!userId) return;
    
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIncomes(data.incomes || []);
        setExpenses(data.expenses || { fixed: [], essential: [], variable: [], superfluous: [] });
      } else {
        setIncomes([]);
        setExpenses({ fixed: [], essential: [], variable: [], superfluous: [] });
      }
    }, (error) => {
        console.error("Erro no listener do Firestore (Gastos): ", error);
        showAlert("Erro de Leitura", `Não foi possível carregar os dados mensais. Verifique as suas regras de segurança e a ligação.\n\nErro: ${error.code}`);
    });

    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = prevDate.toISOString().slice(0, 7);
    const prevDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', prevMonthStr);
    const unsubPrev = onSnapshot(prevDocRef, (docSnap) => {
        setPreviousMonthData(docSnap.exists() ? docSnap.data() : null);
    });

    return () => { unsubscribe(); unsubPrev(); };
  }, [userId, currentMonth, db]);

  const handleCopyFixedExpenses = async () => {
    if (!previousMonthData || !previousMonthData.expenses || !previousMonthData.expenses.fixed) {
        showAlert("Aviso", "Não há dados de gastos fixos do mês anterior para copiar.");
        return;
    }
    
    const currentFixed = expenses.fixed || [];
    const prevFixed = previousMonthData.expenses.fixed;
    const currentFixedNames = new Set(currentFixed.map(item => item.name));
    const newItemsToAdd = prevFixed.filter(item => !currentFixedNames.has(item.name)).map(item => ({...item, id: Date.now().toString() + Math.random() }));

    if (newItemsToAdd.length === 0) {
        showAlert("Aviso", "Todos os gastos fixos do mês anterior já existem no mês atual.");
        return;
    }

    const updatedFixedExpenses = [...currentFixed, ...newItemsToAdd];
    const updatedExpenses = { ...expenses, fixed: updatedFixedExpenses };

    try {
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
        await setDoc(docRef, { expenses: updatedExpenses }, { merge: true });
        showAlert("Sucesso", `${newItemsToAdd.length} gasto(s) fixo(s) copiado(s) com sucesso!`);
    } catch (error) {
        console.error("Erro ao copiar gastos: ", error);
        showAlert("Erro ao Copiar", `Ocorreu um erro ao copiar os gastos.\n\nErro: ${error.code}`);
    }
  };

  const handleSave = async () => {
    if (!itemName || !itemValue) return;
    const value = parseFloat(itemValue);
    if (isNaN(value)) return;

    const newItem = { id: editingItem ? editingItem.id : Date.now().toString(), name: itemName, value };
    let updatedData = {};

    if (modalType === 'income') {
        const updatedIncomes = editingItem ? incomes.map(i => i.id === editingItem.id ? newItem : i) : [...incomes, newItem];
        updatedData = { incomes: updatedIncomes };
    } else {
        const categoryExpenses = expenses[modalType] || [];
        const updatedCategoryExpenses = editingItem ? categoryExpenses.map(e => e.id === editingItem.id ? newItem : e) : [...categoryExpenses, newItem];
        updatedData = { expenses: { ...expenses, [modalType]: updatedCategoryExpenses } };
    }
    
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
        await setDoc(docRef, updatedData, { merge: true });
        closeModal();
    } catch (error) {
        console.error("Erro ao guardar: ", error);
        showAlert("Erro ao Guardar", `Não foi possível guardar os dados.\n\nErro: ${error.code}\n${error.message}`);
    }
  };
  
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setItemName(item ? item.name : '');
    setItemValue(item ? item.value : '');
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const requestDelete = (type, id) => {
    setActionToConfirm(() => () => performDelete(type, id));
    setIsConfirmOpen(true);
  };

  const performDelete = async (type, id) => {
    let updatedData = {};
    if (type === 'income') {
        updatedData = { incomes: incomes.filter(i => i.id !== id) };
    } else {
        const updatedCategoryExpenses = expenses[type].filter(e => e.id !== id);
        updatedData = { expenses: { ...expenses, [type]: updatedCategoryExpenses } };
    }
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
        await setDoc(docRef, updatedData, { merge: true });
    } catch (error) {
        console.error("Erro ao apagar: ", error);
        showAlert("Erro ao Apagar", `Não foi possível apagar o item.\n\nErro: ${error.code}\n${error.message}`);
    }
    setIsConfirmOpen(false);
  };

  const handleKeyDown = (event) => { if (event.key === 'Enter') { handleSave(); } };

  const renderTable = (title, data, type) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-white">{title}</h3><Button onClick={() => openModal(type)} variant="secondary"><Plus size={16} /> Adicionar</Button></div>
        <div className="overflow-x-auto"><table className="w-full text-left">
            <thead><tr className="border-b border-gray-700"><th className="p-3 text-sm font-semibold text-gray-400">Descrição</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Valor</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Ações</th></tr></thead>
            <tbody>
              {data.map(item => (<tr key={item.id} className="border-b border-gray-700/50"><td className="p-3 text-white">{item.name}</td><td className="p-3 text-white text-right">R$ {item.value.toFixed(2)}</td><td className="p-3 text-right"><button onClick={() => openModal(type, item)} className="text-blue-400 hover:text-blue-300 mr-2"><Edit size={16} /></button><button onClick={() => requestDelete(type, item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button></td></tr>))}
              {data.length === 0 && (<tr><td colSpan="3" className="text-center p-4 text-gray-500">Nenhum item.</td></tr>)}
            </tbody>
            <tfoot><tr className="font-bold"><td className="p-3 text-white">Total</td><td className="p-3 text-white text-right" colSpan="2">R$ {total.toFixed(2)}</td></tr></tfoot>
        </table></div>
      </div>
    );
  };
  
  const prevMonthTotalExpenses = previousMonthData ? Object.values(previousMonthData.expenses || {}).flat().reduce((sum, item) => sum + item.value, 0) : 0;
  const prevMonthTotalIncomes = previousMonthData ? (previousMonthData.incomes || []).reduce((sum, item) => sum + item.value, 0) : 0;
  const totalIncomes = incomes.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = Object.values(expenses).flat().reduce((sum, item) => sum + item.value, 0);
  const balance = totalIncomes - totalExpenses;

  return (
    <div className="space-y-8">
        <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={actionToConfirm} message="Tem a certeza que deseja apagar este item? Esta ação não pode ser desfeita."/>
        <div className="flex justify-between items-center bg-gray-800 p-4 rounded-2xl"><h2 className="text-2xl font-bold text-white">Controlo de {new Date(currentMonth + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2><Input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="w-auto" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total de Receitas" value={`R$ ${totalIncomes.toFixed(2)}`} icon={<ArrowUp size={24} />} color="bg-green-500/30 text-green-400" subValue={`Mês anterior: R$ ${prevMonthTotalIncomes.toFixed(2)}`} />
            <StatCard title="Total de Despesas" value={`R$ ${totalExpenses.toFixed(2)}`} icon={<ArrowDown size={24} />} color="bg-red-500/30 text-red-400" subValue={`Mês anterior: R$ ${prevMonthTotalExpenses.toFixed(2)}`} />
            <StatCard title="Saldo do Mês" value={`R$ ${balance.toFixed(2)}`} icon={<Landmark size={24} />} color={balance >= 0 ? "bg-blue-500/30 text-blue-400" : "bg-yellow-500/30 text-yellow-400"} />
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 flex justify-end"><Button onClick={handleCopyFixedExpenses} variant="secondary" disabled={!previousMonthData}><Copy size={16} /> Copiar Gastos Fixos do Mês Anterior</Button></div>
        {renderTable('Receitas', incomes, 'income')}
        <div className="grid md:grid-cols-2 gap-8">{renderTable('Gastos Fixos', expenses.fixed, 'fixed')}{renderTable('Gastos Essenciais', expenses.essential, 'essential')}{renderTable('Gastos Variáveis', expenses.variable, 'variable')}{renderTable('Gastos Supérfluos', expenses.superfluous, 'superfluous')}</div>
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "Editar Item" : "Adicionar Item"}><div className="space-y-4" onKeyDown={handleKeyDown}><Input type="text" placeholder="Nome" value={itemName} onChange={e => setItemName(e.target.value)} /><Input type="number" placeholder="Valor" value={itemValue} onChange={e => setItemValue(e.target.value)} /><Button onClick={handleSave} className="w-full">{editingItem ? "Guardar" : "Adicionar"}</Button></div></Modal>
    </div>
  );
};

// --- ABA DE CONTROLO DE CARTÕES ---

const CardControl = ({ db, userId, showAlert }) => {
    const [cards, setCards] = useState([]);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [cardName, setCardName] = useState('');
    
    const [currentCardId, setCurrentCardId] = useState(null);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseValue, setExpenseValue] = useState('');

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const cardsCollectionRef = useMemo(() => {
        if (!userId) return null;
        return collection(db, 'artifacts', appId, 'users', userId, 'creditCards');
    }, [userId, db]);

    useEffect(() => {
        if (!cardsCollectionRef) return;
        const unsubscribe = onSnapshot(query(cardsCollectionRef), (snap) => {
            setCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }, (error) => {
            console.error("Erro no listener do Firestore (Cartões): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar os dados dos cartões.\n\nErro: ${error.code}`);
        });
        return () => unsubscribe();
    }, [cardsCollectionRef]);

    const openCardModal = (card = null) => { setEditingCard(card); setCardName(card ? card.name : ''); setIsCardModalOpen(true); };
    const closeCardModal = () => setIsCardModalOpen(false);

    const handleSaveCard = async () => {
        if (!cardName) return;
        try {
            if (editingCard) {
                await updateDoc(doc(cardsCollectionRef, editingCard.id), { name: cardName });
            } else {
                await addDoc(cardsCollectionRef, { name: cardName, expenses: [] });
            }
            closeCardModal();
        } catch (error) {
            console.error("Erro ao guardar cartão: ", error);
            showAlert("Erro ao Guardar", `Não foi possível guardar o cartão.\n\nErro: ${error.code}`);
        }
    };

    const requestDeleteCard = (cardId) => {
        setActionToConfirm(() => () => performDeleteCard(cardId));
        setIsConfirmOpen(true);
    };
    const performDeleteCard = async (cardId) => {
        try {
            await deleteDoc(doc(cardsCollectionRef, cardId));
        } catch(error) {
            console.error("Erro ao apagar cartão: ", error);
            showAlert("Erro ao Apagar", `Não foi possível apagar o cartão.\n\nErro: ${error.code}`);
        }
        setIsConfirmOpen(false);
    };

    const openExpenseModal = (cardId) => { setCurrentCardId(cardId); setExpenseDate(new Date().toISOString().slice(0, 10)); setExpenseDescription(''); setExpenseValue(''); setIsExpenseModalOpen(true); };
    const closeExpenseModal = () => setIsExpenseModalOpen(false);

    const handleSaveExpense = async () => {
        if (!expenseDescription || !expenseValue || !expenseDate) return;
        const value = parseFloat(expenseValue);
        if (isNaN(value)) return;

        const card = cards.find(c => c.id === currentCardId);
        if (card) {
            try {
                const newExpense = { id: Date.now().toString(), date: expenseDate, description: expenseDescription, value };
                const updatedExpenses = [...(card.expenses || []), newExpense].sort((a, b) => new Date(b.date) - new Date(a.date));
                await updateDoc(doc(cardsCollectionRef, currentCardId), { expenses: updatedExpenses });
                closeExpenseModal();
            } catch(error) {
                console.error("Erro ao guardar gasto do cartão: ", error);
                showAlert("Erro ao Guardar", `Não foi possível guardar o gasto.\n\nErro: ${error.code}`);
            }
        }
    };
    
    const requestDeleteExpense = (cardId, expenseId) => {
        setActionToConfirm(() => () => performDeleteExpense(cardId, expenseId));
        setIsConfirmOpen(true);
    };

    const performDeleteExpense = async (cardId, expenseId) => {
        const card = cards.find(c => c.id === cardId);
        if (card) {
            try {
                const updatedExpenses = card.expenses.filter(e => e.id !== expenseId);
                await updateDoc(doc(cardsCollectionRef, cardId), { expenses: updatedExpenses });
            } catch(error) {
                console.error("Erro ao apagar gasto do cartão: ", error);
                showAlert("Erro ao Apagar", `Não foi possível apagar o gasto.\n\nErro: ${error.code}`);
            }
        }
        setIsConfirmOpen(false);
    };

    const handleCardModalKeyDown = (event) => { if (event.key === 'Enter') { handleSaveCard(); } };
    const handleExpenseModalKeyDown = (event) => { if (event.key === 'Enter') { handleSaveExpense(); } };

    return (
        <div className="space-y-8">
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={actionToConfirm} message="Tem a certeza que deseja apagar este item? Esta ação não pode ser desfeita."/>
            <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-white">Controlo de Cartões</h2><Button onClick={() => openCardModal()}><Plus size={16} /> Novo Cartão</Button></div>
            {cards.length === 0 && <div className="text-center py-16 bg-gray-800 rounded-2xl"><CreditCard size={48} className="mx-auto text-gray-500" /><p className="mt-4 text-gray-400">Nenhum cartão adicionado.</p></div>}
            <div className="space-y-6">
                {cards.map(card => {
                    const total = (card.expenses || []).reduce((sum, exp) => sum + exp.value, 0);
                    return (
                        <div key={card.id} className="bg-gray-800 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4"><div><h3 className="text-xl font-bold text-white">{card.name}</h3><p className="text-red-400 font-semibold">Total: R$ {total.toFixed(2)}</p></div><div className="flex gap-2"><Button onClick={() => openExpenseModal(card.id)} variant="secondary"><Plus size={16} /> Adicionar Gasto</Button><Button onClick={() => requestDeleteCard(card.id)} variant="danger"><Trash2 size={16} /></Button></div></div>
                            <div className="overflow-x-auto"><table className="w-full text-left">
                                <thead><tr className="border-b border-gray-700/50"><th className="p-2 text-sm font-semibold text-gray-400">Data</th><th className="p-2 text-sm font-semibold text-gray-400">Descrição</th><th className="p-2 text-sm font-semibold text-gray-400 text-right">Valor</th><th className="p-2 text-sm font-semibold text-gray-400 text-right">Ações</th></tr></thead>
                                <tbody>
                                    {(card.expenses || []).map(exp => (<tr key={exp.id}><td className="p-2 text-white">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td className="p-2 text-white">{exp.description}</td><td className="p-2 text-white text-right">R$ {exp.value.toFixed(2)}</td><td className="p-2 text-right"><button onClick={() => requestDeleteExpense(card.id, exp.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button></td></tr>))}
                                    {(card.expenses || []).length === 0 && <tr><td colSpan="4" className="text-center p-4 text-gray-500">Nenhum gasto.</td></tr>}
                                </tbody>
                            </table></div>
                        </div>
                    );
                })}
            </div>
            <Modal isOpen={isCardModalOpen} onClose={closeCardModal} title={editingCard ? "Editar Cartão" : "Novo Cartão"}><div className="space-y-4" onKeyDown={handleCardModalKeyDown}><Input type="text" placeholder="Nome do Cartão" value={cardName} onChange={e => setCardName(e.target.value)} /><Button onClick={handleSaveCard} className="w-full">{editingCard ? "Guardar" : "Adicionar"}</Button></div></Modal>
            <Modal isOpen={isExpenseModalOpen} onClose={closeExpenseModal} title="Adicionar Gasto"><div className="space-y-4" onKeyDown={handleExpenseModalKeyDown}><label className="text-gray-400">Data</label><Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} /><Input type="text" placeholder="Descrição" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} /><Input type="number" placeholder="Valor" value={expenseValue} onChange={e => setExpenseValue(e.target.value)} /><Button onClick={handleSaveExpense} className="w-full">Adicionar</Button></div></Modal>
        </div>
    );
};

// --- ABA DE INVESTIMENTOS ---

const Investments = ({ db, userId, showAlert }) => {
    const GOAL = 1000000;
    const MONTHLY_INTEREST_RATE = 0.01;
    const TOTAL_PERIOD_MONTHS = 72; // 6 anos

    const [history, setHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 7));
    const [contributionValue, setContributionValue] = useState('');
    
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const docRef = useMemo(() => {
        if (!userId) return null;
        return doc(db, 'artifacts', appId, 'users', userId, 'investments', 'data');
    }, [userId, db]);

    useEffect(() => {
        if (!docRef) return;
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            // Ordena o histórico por data ao receber os dados
            const data = docSnap.exists() ? docSnap.data().history || [] : [];
            const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
            setHistory(sortedData);
        }, (error) => {
            console.error("Erro no listener do Firestore (Investimentos): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar o histórico de investimentos.\n\nErro: ${error.code}`);
        });
        return () => unsubscribe();
    }, [docRef]);

    const recalculateHistory = (historyArray) => {
        const sortedHistory = [...historyArray].sort((a, b) => a.date.localeCompare(b.date));
        let runningTotal = 0;
        return sortedHistory.map(entry => {
            const balanceBeforeInterest = runningTotal + entry.contribution;
            const interestEarned = balanceBeforeInterest * MONTHLY_INTEREST_RATE;
            runningTotal = balanceBeforeInterest + interestEarned;
            return { ...entry, interestEarned, total: runningTotal };
        });
    };

    const handleSave = async () => {
        const value = parseFloat(contributionValue);
        if (isNaN(value) || value <= 0 || !contributionDate) {
            showAlert("Aviso", "Por favor, preencha a data e um valor de aporte válido.");
            return;
        }

        let newHistory;
        if (editingEntry) {
            newHistory = history.map(entry => entry.id === editingEntry.id ? { ...entry, date: contributionDate, contribution: value } : entry);
        } else {
            const newEntry = { id: Date.now().toString(), date: contributionDate, contribution: value, interestEarned: 0, total: 0 };
            newHistory = [...history, newEntry];
        }

        const recalculated = recalculateHistory(newHistory);
        try {
            await setDoc(docRef, { history: recalculated });
            closeModal();
        } catch(error) {
            console.error("Erro ao guardar investimento: ", error);
            showAlert("Erro ao Guardar", `Não foi possível guardar o aporte.\n\nErro: ${error.code}`);
        }
    };

    const openModal = (entry = null) => { setEditingEntry(entry); setContributionDate(entry ? entry.date : new Date().toISOString().slice(0, 7)); setContributionValue(entry ? entry.contribution : ''); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingEntry(null); };

    const requestDelete = (id) => {
        setActionToConfirm(() => () => performDelete(id));
        setIsConfirmOpen(true);
    };

    const performDelete = async (id) => {
        const newHistory = history.filter(entry => entry.id !== id);
        const recalculated = recalculateHistory(newHistory);
        try {
            await setDoc(docRef, { history: recalculated });
        } catch(error) {
            console.error("Erro ao apagar investimento: ", error);
            showAlert("Erro ao Apagar", `Não foi possível apagar o aporte.\n\nErro: ${error.code}`);
        }
        setIsConfirmOpen(false);
    };

    const handleKeyDown = (event) => { if (event.key === 'Enter') { handleSave(); } };

    const currentTotal = history.length > 0 ? history[history.length - 1].total : 0;
    const progress = (currentTotal / GOAL) * 100;

    const averageMonthlyInvestment = useMemo(() => {
        const r = MONTHLY_INTEREST_RATE;
        
        if (history.length === 0) {
            const n = TOTAL_PERIOD_MONTHS;
            if (GOAL <= 0 || r <= 0 || n <= 0) return 0;
            return GOAL * (r / (Math.pow(1 + r, n) - 1));
        }

        const firstContributionDate = new Date(history[0].date + '-02T00:00:00');
        const today = new Date();

        const monthsElapsed = (today.getFullYear() - firstContributionDate.getFullYear()) * 12 + (today.getMonth() - firstContributionDate.getMonth());
        const monthsRemaining = Math.max(0, TOTAL_PERIOD_MONTHS - monthsElapsed);

        if (monthsRemaining <= 0) return 0;

        const n = monthsRemaining;
        const fv_of_current = currentTotal * Math.pow(1 + r, n);
        const remainingGoal = GOAL - fv_of_current;

        if (remainingGoal <= 0) return 0;

        return remainingGoal * (r / (Math.pow(1 + r, n) - 1));
    }, [history, currentTotal]);
    
    return (
        <div className="space-y-8">
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={actionToConfirm} message="Tem a certeza que deseja apagar este aporte? Esta ação não pode ser desfeita."/>
            
            <h2 className="text-3xl font-bold text-white">Plano de Investimentos: Rumo a R$ 1 Milhão</h2>
            
            <div className="bg-gray-800 rounded-2xl p-6 space-y-4"><h3 className="text-xl font-bold text-white">Progresso Atual</h3><div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div><div className="flex justify-between text-white font-semibold"><span>R$ {currentTotal.toFixed(2)}</span><span>Meta: R$ {GOAL.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div><p className="text-center text-2xl font-bold text-green-400">{progress.toFixed(2)}%</p></div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-2xl p-6 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-white mb-4">Novo Aporte</h3>
                    <Button onClick={() => openModal()} className="w-full"><Plus size={16} /> Adicionar Aporte</Button>
                </div>
                <div className="bg-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <div className="flex items-center gap-3 mb-2">
                        <Target size={24} className="text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Meta para 6 Anos</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">Para atingir R$ 1 milhão em 72 meses, o seu aporte mensal precisa ser de:</p>
                    <p className="text-3xl font-bold text-blue-400">R$ {averageMonthlyInvestment.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Histórico de Aportes</h3>
                <div className="overflow-x-auto max-h-96"><table className="w-full text-left">
                    <thead><tr className="border-b border-gray-700"><th className="p-3 text-sm font-semibold text-gray-400">Mês/Ano</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Aporte</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Juros</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Saldo Total</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Ações</th></tr></thead>
                    <tbody>
                        {history.map(entry => (<tr key={entry.id} className="border-b border-gray-700/50"><td className="p-3 text-white">{new Date(entry.date + '-02').toLocaleString('pt-BR', {month: 'long', year: 'numeric'})}</td><td className="p-3 text-green-400 text-right">+ R$ {entry.contribution.toFixed(2)}</td><td className="p-3 text-blue-400 text-right">+ R$ {entry.interestEarned.toFixed(2)}</td><td className="p-3 text-white font-bold text-right">R$ {entry.total.toFixed(2)}</td><td className="p-3 text-right flex gap-2 justify-end"><button onClick={() => openModal(entry)} className="text-blue-400 hover:text-blue-300"><Edit size={16} /></button><button onClick={() => requestDelete(entry.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button></td></tr>))}
                        {history.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-500">Comece por adicionar o seu primeiro aporte.</td></tr>}
                    </tbody>
                </table></div>
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEntry ? "Editar Aporte" : "Novo Aporte"}><div className="space-y-4" onKeyDown={handleKeyDown}><label className="text-gray-400">Mês/Ano do Aporte</label><Input type="month" value={contributionDate} onChange={e => setContributionDate(e.target.value)} /><label className="text-gray-400">Valor do Aporte</label><Input type="number" placeholder="1000.00" value={contributionValue} onChange={e => setContributionValue(e.target.value)} /><Button onClick={handleSave} className="w-full">{editingEntry ? "Guardar Alterações" : "Adicionar"}</Button></div></Modal>
        </div>
    );
};

// --- ABA DE DASHBOARD ---

const Dashboard = ({ db, userId, showAlert }) => {
    const [summary, setSummary] = useState({ totalIncomes: 0, totalExpenses: 0, balance: 0, totalCardDebt: 0, investmentTotal: 0, investmentProgress: 0, expenseBreakdown: {} });

    useEffect(() => {
        if (!userId) return;
        const month = new Date().toISOString().slice(0, 7);
        
        const monthlyDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', month);
        const unsubMonthly = onSnapshot(monthlyDocRef, (docSnap) => {
            let s = { totalIncomes: 0, totalExpenses: 0, balance: 0, expenseBreakdown: {} };
            if (docSnap.exists()) {
                const data = docSnap.data();
                s.totalIncomes = (data.incomes || []).reduce((sum, i) => sum + i.value, 0);
                const allExpenses = Object.values(data.expenses || {}).flat();
                s.totalExpenses = allExpenses.reduce((sum, e) => sum + e.value, 0);
                s.balance = s.totalIncomes - s.totalExpenses;
                s.expenseBreakdown = data.expenses || {};
            }
            setSummary(prev => ({ ...prev, ...s }));
        }, (error) => {
            console.error("Erro no listener do Dashboard (Mensal): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar o resumo mensal.\n\nErro: ${error.code}`);
        });

        const cardsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'creditCards');
        const unsubCards = onSnapshot(query(cardsCollectionRef), (snap) => {
            let totalCardDebt = 0;
            snap.forEach(doc => { totalCardDebt += (doc.data().expenses || []).reduce((sum, e) => sum + e.value, 0); });
            setSummary(prev => ({ ...prev, totalCardDebt }));
        }, (error) => {
            console.error("Erro no listener do Dashboard (Cartões): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar o resumo dos cartões.\n\nErro: ${error.code}`);
        });

        const investmentDocRef = doc(db, 'artifacts', appId, 'users', userId, 'investments', 'data');
        const unsubInvestments = onSnapshot(investmentDocRef, (docSnap) => {
            let investmentTotal = 0, investmentProgress = 0;
            if (docSnap.exists()) {
                const history = docSnap.data().history || [];
                investmentTotal = history.length > 0 ? history[history.length - 1].total : 0;
                investmentProgress = (investmentTotal / 1000000) * 100;
            }
            setSummary(prev => ({ ...prev, investmentTotal, investmentProgress }));
        }, (error) => {
            console.error("Erro no listener do Dashboard (Investimentos): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar o resumo dos investimentos.\n\nErro: ${error.code}`);
        });

        return () => { unsubMonthly(); unsubCards(); unsubInvestments(); };
    }, [userId, db]);

    const categoryTotals = useMemo(() => ({
        fixed: (summary.expenseBreakdown.fixed || []).reduce((s, i) => s + i.value, 0),
        essential: (summary.expenseBreakdown.essential || []).reduce((s, i) => s + i.value, 0),
        variable: (summary.expenseBreakdown.variable || []).reduce((s, i) => s + i.value, 0),
        superfluous: (summary.expenseBreakdown.superfluous || []).reduce((s, i) => s + i.value, 0),
    }), [summary.expenseBreakdown]);
    
    const totalExpensesForChart = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    const categoryColors = { fixed: 'bg-red-500', essential: 'bg-orange-500', variable: 'bg-yellow-500', superfluous: 'bg-purple-500' };
    const categoryLabels = { fixed: 'Fixos', essential: 'Essenciais', variable: 'Variáveis', superfluous: 'Supérfluos' };

    return (
        <div className="space-y-8"><h2 className="text-3xl font-bold text-white">Dashboard Financeiro</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard title="Saldo do Mês" value={`R$ ${summary.balance.toFixed(2)}`} icon={<Landmark size={24} />} color="bg-blue-500/30 text-blue-400" /><StatCard title="Dívida Cartões" value={`R$ ${summary.totalCardDebt.toFixed(2)}`} icon={<CreditCard size={24} />} color="bg-red-500/30 text-red-400" /><StatCard title="Total Investido" value={`R$ ${summary.investmentTotal.toFixed(2)}`} icon={<TrendingUp size={24} />} color="bg-green-500/30 text-green-400" /><StatCard title="Receitas do Mês" value={`R$ ${summary.totalIncomes.toFixed(2)}`} icon={<ArrowUp size={24} />} color="bg-green-500/30 text-green-400" /></div><div className="grid grid-cols-1 lg:grid-cols-5 gap-8"><div className="lg:col-span-3 bg-gray-800 rounded-2xl p-6"><h3 className="text-xl font-bold text-white mb-4">Distribuição de Despesas do Mês</h3>{totalExpensesForChart > 0 ? (<div className="space-y-4"><div className="w-full flex h-10 rounded-full overflow-hidden">{Object.entries(categoryTotals).map(([key, value]) => { const p = (value / totalExpensesForChart) * 100; if (p === 0) return null; return <div key={key} className={categoryColors[key]} style={{ width: `${p}%` }} title={`${categoryLabels[key]}: ${p.toFixed(1)}%`}></div> })}</div><div className="grid grid-cols-2 gap-4">{Object.entries(categoryTotals).map(([key, value]) => (<div key={key} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${categoryColors[key]}`}></div><div><span className="text-white font-medium">{categoryLabels[key]}</span><span className="text-gray-400 text-sm ml-2">R$ {value.toFixed(2)}</span></div></div>))}</div></div>) : (<div className="text-center py-10 text-gray-500"><p>Nenhuma despesa registada.</p></div>)}</div><div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6"><h3 className="text-xl font-bold text-white mb-4">Progresso da Meta de Investimento</h3><div className="flex flex-col items-center justify-center h-full gap-4"><div className="relative w-32 h-32"><svg className="w-full h-full" viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4A5568" strokeWidth="3" /><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#48BB78" strokeWidth="3" strokeDasharray={`${summary.investmentProgress}, 100`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-white">{summary.investmentProgress.toFixed(1)}%</span></div></div><p className="text-gray-400">Rumo a R$ 1.000.000</p></div></div></div></div>
    );
};

// --- COMPONENTE PRINCIPAL DA APLICAÇÃO ---

const MainApp = ({ userId, showAlert }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            showAlert("Erro de Logout", "Não foi possível terminar a sessão.");
        }
    };

    const tabs = {
        dashboard: { label: 'Dashboard', icon: <LayoutDashboard size={20} />, component: <Dashboard db={db} userId={userId} showAlert={showAlert} /> },
        monthly: { label: 'Gastos Mensais', icon: <Landmark size={20} />, component: <MonthlyExpenses db={db} userId={userId} showAlert={showAlert} /> },
        cards: { label: 'Cartões', icon: <CreditCard size={20} />, component: <CardControl db={db} userId={userId} showAlert={showAlert} /> },
        investments: { label: 'Investimentos', icon: <TrendingUp size={20} />, component: <Investments db={db} userId={userId} showAlert={showAlert} /> },
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-center">Controlo Financeiro Inteligente</h1>
                        <p className="text-center text-gray-400 mt-2">O seu assistente pessoal para uma vida financeira organizada.</p>
                    </div>
                    <Button onClick={handleLogout} variant="danger">
                        <LogOut size={16} />
                        Sair
                    </Button>
                </header>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 mb-8 flex flex-wrap justify-center gap-2">
                    {Object.entries(tabs).map(([key, { label, icon }]) => (<button key={key} onClick={() => setActiveTab(key)} className={`flex-grow md:flex-grow-0 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition ${activeTab === key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700/50'}`}>{icon}<span>{label}</span></button>))}
                </div>
                <main>{tabs[activeTab].component}</main>
                <footer className="text-center text-gray-500 mt-12 text-sm">
                    <p>O seu ID de utilizador (para referência): {userId || 'Nenhum'}</p>
                    <p>Desenvolvido com React e Firebase.</p>
                </footer>
            </div>
        </div>
    );
};

// --- GESTOR DE AUTENTICAÇÃO ---

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertInfo({ isOpen: true, title, message });
  };
  
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, title: '', message: '' });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  
  if (!isAuthReady) {
    return (<div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div><p className="mt-4 text-lg">A carregar...</p></div>);
  }

  return (
    <>
        <AlertModal isOpen={alertInfo.isOpen} onClose={closeAlert} title={alertInfo.title} message={alertInfo.message} />
        {user ? <MainApp userId={user.uid} showAlert={showAlert} /> : <LoginScreen showAlert={showAlert} />}
    </>
  );
}
