import { useState, useEffect, useRef } from 'react'
import {
  getSupabase,
  isSupabaseConfigured,
  getDeviceId,
  generateRoomCode
} from './supabaseClient'

// Audio synthesis for tactile game feedback
function playSound(type = 'move') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'draw') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (e) {
    // Ignore audio restrictions
  }
}

// Icons
function TicTacToeGridIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="16" y2="21" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="16" x2="21" y2="16" />
    </svg>
  );
}

function PieceX() {
  return (
    <div className="animate-pop-in flex items-center justify-center select-none w-full h-full p-3 sm:p-4">
      <svg className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="xGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <filter id="xGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.4" />
          </filter>
        </defs>
        <line x1="22" y1="22" x2="78" y2="78" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" />
        <line x1="78" y1="22" x2="22" y2="78" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" />
        <line x1="22" y1="22" x2="78" y2="78" stroke="url(#xGrad)" strokeWidth="12" strokeLinecap="round" filter="url(#xGlow)" />
        <line x1="78" y1="22" x2="22" y2="78" stroke="url(#xGrad)" strokeWidth="12" strokeLinecap="round" filter="url(#xGlow)" />
      </svg>
    </div>
  );
}

function PieceO() {
  return (
    <div className="animate-pop-in flex items-center justify-center select-none w-full h-full p-3 sm:p-4">
      <svg className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="oGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="50%" stopColor="#81b64c" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>
          <filter id="oGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#65a30d" floodOpacity="0.5" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="29" fill="none" stroke="#181715" strokeWidth="18" />
        <circle cx="50" cy="50" r="29" fill="none" stroke="url(#oGrad)" strokeWidth="12" filter="url(#oGlow)" />
      </svg>
    </div>
  );
}

function Square({ value, onSquareClick, row, col, isWinningSquare, xIsNext, disabled, canClick }) {
  const isLight = (row + col) % 2 === 0;
  let bgClass = isLight ? "bg-[#eeeed2]" : "bg-[#769656]";
  
  if (isWinningSquare) {
    bgClass = isLight ? "bg-[#f7ec59] shadow-inner" : "bg-[#baca44] shadow-inner";
  }

  const coordColor = isLight ? "text-[#769656]" : "text-[#eeeed2]";
  const files = ['a', 'b', 'c'];
  const ranks = ['3', '2', '1'];

  return (
    <button
      className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 ${bgClass} transition-colors duration-100 flex items-center justify-center select-none focus:outline-none group active:brightness-95 ${
        canClick && !value && !disabled ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={onSquareClick}
      disabled={disabled || !canClick}
      id={`square-${row}-${col}`}
      aria-label={`Square ${files[col]}${ranks[row]}`}
    >
      {col === 0 && (
        <span className={`absolute top-1 left-1.5 text-[11px] sm:text-xs font-bold leading-none ${coordColor} opacity-90 select-none pointer-events-none`}>
          {ranks[row]}
        </span>
      )}

      {row === 2 && (
        <span className={`absolute bottom-1 right-1.5 text-[11px] sm:text-xs font-bold leading-none ${coordColor} opacity-90 select-none pointer-events-none`}>
          {files[col]}
        </span>
      )}

      {!value && canClick && !disabled && (
        <div className="w-9 h-9 rounded-full border-2 border-dashed border-black/15 dark:border-white/20 opacity-0 group-hover:opacity-80 transition-opacity duration-150 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-black text-black/40 dark:text-white/40">
            {xIsNext ? 'X' : 'O'}
          </span>
        </div>
      )}

      {value === 'X' && <PieceX />}
      {value === 'O' && <PieceO />}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay, players, myRole, isOnline }) {
  const winner = calculateWinner(squares);
  const winningLine = calculateWinningLine(squares);
  const isBoardFull = squares.every(square => square !== null);

  const isMyTurn = !isOnline || (myRole === 'X' && xIsNext) || (myRole === 'O' && !xIsNext);
  const canPlayMove = isMyTurn && !winner && !isBoardFull;

  function handleClick(i) {
    if (squares[i] || calculateWinner(squares) || (isOnline && !canPlayMove)) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }

    const nextWinner = calculateWinner(nextSquares);
    const nextFull = nextSquares.every(sq => sq !== null);

    if (nextWinner) {
      playSound('win');
    } else if (nextFull) {
      playSound('draw');
    } else {
      playSound('move');
    }

    onPlay(nextSquares);
  }

  let statusBadge;
  if (winner) {
    statusBadge = (
      <div className="flex items-center gap-2 bg-[#81b64c]/20 border border-[#81b64c] px-3.5 py-1.5 rounded-lg text-[#81b64c] font-bold text-sm shadow-md animate-pop-in">
        <span className="w-2.5 h-2.5 rounded-full bg-[#81b64c] animate-ping" />
        🏆 Winner: {players[winner]} ({winner})!
      </div>
    );
  } else if (isBoardFull) {
    statusBadge = (
      <div className="flex items-center gap-2 bg-[#363431] border border-gray-600 px-3.5 py-1.5 rounded-lg text-gray-300 font-bold text-sm">
        🤝 Match Drawn!
      </div>
    );
  } else {
    statusBadge = (
      <div className="flex items-center gap-2 bg-[#312e2b] border border-[#403d39] px-3 py-1.5 rounded-lg text-gray-200 font-medium text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-[#81b64c] animate-pulse" />
        Turn: <span className="font-bold text-white">{xIsNext ? players.X : players.O}</span> ({xIsNext ? 'X' : 'O'})
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-3 w-full flex justify-between items-center">
        {statusBadge}
        <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
          {isOnline ? (
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isMyTurn ? 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30' : 'bg-[#312e2b] text-gray-400'
            }`}>
              {isMyTurn ? '👉 Your Turn' : "Opponent's Turn"}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Local Match
            </span>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-2.5 bg-[#21201d] rounded-xl shadow-2xl border-4 border-[#312e2b] inline-block">
        <div className="grid grid-cols-3 overflow-hidden rounded-lg shadow-inner">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            return (
              <Square
                key={index}
                value={squares[index]}
                onSquareClick={() => handleClick(index)}
                row={row}
                col={col}
                isWinningSquare={winningLine?.includes(index)}
                xIsNext={xIsNext}
                disabled={Boolean(winner || isBoardFull)}
                canClick={!isOnline || canPlayMove}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  // Game Setup & Modes
  const [gameMode, setGameMode] = useState('LOCAL'); // 'LOCAL' | 'ONLINE_LOBBY' | 'ONLINE_MATCH'
  const [onlineTab, setOnlineTab] = useState('CREATE'); // 'CREATE' | 'JOIN'
  const [roomCode, setRoomCode] = useState('');
  const [joinInputCode, setJoinInputCode] = useState('');
  const [myPlayerName, setMyPlayerName] = useState('');
  const [myRole, setMyRole] = useState(null); // 'X' | 'O' | 'SPECTATOR'
  const [onlineStatus, setOnlineStatus] = useState('idle'); // 'waiting_opponent' | 'connected' | 'error'
  const [copiedLink, setCopiedLink] = useState(false);

  // Match State
  const [players, setPlayers] = useState(null);
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [history, sethistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [lastProcessedEnd, setLastProcessedEnd] = useState(null);

  const moveListRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const deviceId = getDeviceId();

  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove] || Array(9).fill(null);
  const winner = calculateWinner(currentSquares);
  const isBoardFull = currentSquares.every(sq => sq !== null);
  const isGameOver = Boolean(winner || isBoardFull);

  // Check URL query parameter for room code (e.g. ?room=TAC-123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setGameMode('ONLINE_LOBBY');
      setOnlineTab('JOIN');
      setJoinInputCode(roomParam.toUpperCase());
    }
  }, []);

  // Auto-scroll move history
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [history.length, currentMove]);

  // Update match score in Local mode
  useEffect(() => {
    if (gameMode === 'LOCAL' && isGameOver) {
      const matchKey = `${history.length}-${winner}`;
      if (lastProcessedEnd !== matchKey) {
        setLastProcessedEnd(matchKey);
        if (winner === 'X') {
          setScores(prev => ({ ...prev, X: prev.X + 1 }));
        } else if (winner === 'O') {
          setScores(prev => ({ ...prev, O: prev.O + 1 }));
        } else if (isBoardFull) {
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        }
      }
    }
  }, [gameMode, isGameOver, winner, isBoardFull, history.length, lastProcessedEnd]);

  // Clean up Supabase realtime subscription
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        const supabase = getSupabase();
        if (supabase) supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // Subscribe to Supabase Realtime for Online Room
  function subscribeToRoom(code) {
    const supabase = getSupabase();
    if (!supabase) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`room_${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `room_code=eq.${code}` },
        (payload) => {
          const gameData = payload.new;
          if (!gameData) return;

          if (gameData.player_o_name && gameData.player_x_name) {
            setPlayers({ X: gameData.player_x_name, O: gameData.player_o_name });
            setGameMode('ONLINE_MATCH');
            setOnlineStatus('connected');
          }

          if (gameData.history && Array.isArray(gameData.history)) {
            sethistory(gameData.history);
            setCurrentMove(gameData.history.length - 1);
          }

          if (gameData.scores) {
            setScores(gameData.scores);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }

  // CREATE ONLINE ROOM
  async function handleCreateOnlineRoom() {
    if (!isSupabaseConfigured()) {
      alert("Supabase credentials not configured in .env!");
      return;
    }
    if (!myPlayerName.trim()) {
      alert("Please enter your name!");
      return;
    }

    const code = generateRoomCode();
    setRoomCode(code);
    setMyRole('X');
    setOnlineStatus('waiting_opponent');

    const supabase = getSupabase();
    try {
      const { error } = await supabase.from('games').insert([
        {
          room_code: code,
          player_x_name: myPlayerName.trim(),
          player_x_id: deviceId,
          player_o_name: null,
          player_o_id: null,
          squares: Array(9).fill(null),
          current_turn: 'X',
          history: [Array(9).fill(null)],
          scores: { X: 0, O: 0, draws: 0 },
          status: 'waiting',
        },
      ]);

      if (error) {
        alert("Error creating room: " + error.message);
        return;
      }

      subscribeToRoom(code);
    } catch (err) {
      alert("Failed to connect to Supabase: " + err.message);
    }
  }

  // JOIN ONLINE ROOM
  async function handleJoinOnlineRoom() {
    if (!isSupabaseConfigured()) {
      alert("Supabase credentials not configured in .env!");
      return;
    }
    if (!myPlayerName.trim()) {
      alert("Please enter your name!");
      return;
    }
    if (!joinInputCode.trim()) {
      alert("Please enter a room code!");
      return;
    }

    const code = joinInputCode.trim().toUpperCase();
    setRoomCode(code);

    const supabase = getSupabase();
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', code)
        .single();

      if (error || !data) {
        alert("Room not found! Check the room code and try again.");
        return;
      }

      if (data.player_x_id === deviceId) {
        setMyRole('X');
      } else if (data.player_o_id === deviceId || !data.player_o_id) {
        setMyRole('O');
        await supabase
          .from('games')
          .update({
            player_o_name: myPlayerName.trim(),
            player_o_id: deviceId,
            status: 'in_progress',
          })
          .eq('room_code', code);
      } else {
        setMyRole('SPECTATOR');
      }

      setPlayers({ X: data.player_x_name, O: data.player_o_name || myPlayerName.trim() });
      sethistory(data.history || [Array(9).fill(null)]);
      setCurrentMove((data.history || [Array(9).fill(null)]).length - 1);
      setScores(data.scores || { X: 0, O: 0, draws: 0 });

      setGameMode('ONLINE_MATCH');
      subscribeToRoom(code);
    } catch (err) {
      alert("Failed to join room: " + err.message);
    }
  }

  // PLAY MOVE (ONLINE or LOCAL)
  async function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    sethistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);

    if (gameMode === 'ONLINE_MATCH' && roomCode) {
      const nextWinner = calculateWinner(nextSquares);
      const nextFull = nextSquares.every(sq => sq !== null);
      let newScores = { ...scores };

      if (nextWinner === 'X') newScores.X += 1;
      else if (nextWinner === 'O') newScores.O += 1;
      else if (nextFull) newScores.draws += 1;

      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from('games')
          .update({
            squares: nextSquares,
            history: nextHistory,
            current_turn: xIsNext ? 'O' : 'X',
            winner: nextWinner,
            winning_line: calculateWinningLine(nextSquares),
            scores: newScores,
          })
          .eq('room_code', roomCode);
      }
    }
  }

  // TIME TRAVEL TO MOVE
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  // RESTART / PLAY NEXT ROUND
  async function restartGame() {
    const initialHistory = [Array(9).fill(null)];
    sethistory(initialHistory);
    setCurrentMove(0);
    setLastProcessedEnd(null);

    if (gameMode === 'ONLINE_MATCH' && roomCode) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from('games')
          .update({
            squares: Array(9).fill(null),
            history: initialHistory,
            current_turn: 'X',
            winner: null,
            winning_line: null,
          })
          .eq('room_code', roomCode);
      }
    }
  }

  // START LOCAL GAME
  function startLocalGame() {
    if (!name1.trim() || !name2.trim()) {
      alert("Please enter both player names!");
      return;
    }
    setPlayers({ X: name1.trim(), O: name2.trim() });
    setScores({ X: 0, O: 0, draws: 0 });
    setGameMode('LOCAL');
  }

  function resetAll() {
    if (realtimeChannelRef.current) {
      const supabase = getSupabase();
      if (supabase) supabase.removeChannel(realtimeChannelRef.current);
    }
    sethistory([Array(9).fill(null)]);
    setCurrentMove(0);
    setPlayers(null);
    setScores({ X: 0, O: 0, draws: 0 });
    setLastProcessedEnd(null);
    setGameMode('LOCAL');
    setRoomCode('');
    setOnlineStatus('idle');
    setMyRole(null);
  }

  function copyInviteLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  const positionDescriptions = [
    'Top-Left (a3)', 'Top-Center (b3)', 'Top-Right (c3)',
    'Mid-Left (a2)', 'Center (b2)', 'Mid-Right (c2)',
    'Bottom-Left (a1)', 'Bottom-Center (b1)', 'Bottom-Right (c1)'
  ];

  function getMoveDetail(stepIndex) {
    if (stepIndex === 0) return 'Game start';
    const prev = history[stepIndex - 1];
    const curr = history[stepIndex];
    if (!prev || !curr) return `Move #${stepIndex}`;
    let changedIndex = -1;
    for (let i = 0; i < 9; i++) {
      if (prev[i] !== curr[i]) {
        changedIndex = i;
        break;
      }
    }
    if (changedIndex !== -1) {
      const piece = curr[changedIndex];
      const pos = positionDescriptions[changedIndex];
      return `${piece} → ${pos}`;
    }
    return `Move #${stepIndex}`;
  }

  // 1. SETUP / LOBBY SCREEN
  if (!players || (gameMode === 'ONLINE_LOBBY' && onlineStatus !== 'connected')) {
    return (
      <div className="min-h-screen bg-[#262421] text-gray-200 flex flex-col justify-between font-['Montserrat',sans-serif]">
        {/* Header */}
        <header className="bg-[#1e1d1a] border-b border-[#302e2b] px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#81b64c] rounded-lg flex items-center justify-center text-white shadow-md">
              <TicTacToeGridIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
                TicTacToe<span className="text-[#81b64c]">.com</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium -mt-1">
                Chess-Style Arena • Real-Time Multiplayer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#2b2926] px-3 py-1.5 rounded-full border border-gray-700 text-gray-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Online 2-Player Match</span>
          </div>
        </header>

        {/* Main Selection Area */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-[#312e2b] rounded-2xl shadow-2xl border border-[#403d39] overflow-hidden">
            {/* Mode Switch Tabs */}
            <div className="flex border-b border-[#3d3b37] bg-[#262421]">
              <button
                type="button"
                onClick={() => { setGameMode('ONLINE_LOBBY'); setOnlineStatus('idle'); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  gameMode === 'ONLINE_LOBBY'
                    ? 'border-[#81b64c] text-white bg-[#312e2b]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>🌐 Play Online (Multiplayer)</span>
              </button>
              <button
                type="button"
                onClick={() => { setGameMode('LOCAL'); setOnlineStatus('idle'); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  gameMode === 'LOCAL'
                    ? 'border-[#81b64c] text-white bg-[#312e2b]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>👥 Pass & Play (Local)</span>
              </button>
            </div>

            {/* TAB 1: ONLINE MULTIPLAYER */}
            {gameMode === 'ONLINE_LOBBY' ? (
              <div className="p-6 space-y-4">
                {onlineStatus === 'waiting_opponent' ? (
                  /* Waiting for Opponent Screen */
                  <div className="text-center py-4 space-y-4 animate-pop-in">
                    <div className="w-14 h-14 bg-[#81b64c]/20 border-2 border-[#81b64c] rounded-full flex items-center justify-center mx-auto text-2xl animate-pulse">
                      ⏳
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Room Created!</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Share this room code with your friend on any phone or laptop:
                      </p>
                    </div>

                    <div className="bg-[#1e1d1a] border-2 border-dashed border-[#81b64c] rounded-xl p-3 flex items-center justify-between">
                      <span className="font-mono text-2xl font-black text-[#81b64c] tracking-widest pl-2">
                        {roomCode}
                      </span>
                      <button
                        type="button"
                        onClick={copyInviteLink}
                        className="btn-chess-green text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        {copiedLink ? '✓ Copied Link' : '🔗 Copy Link'}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#81b64c] animate-ping" />
                      <span>Waiting for Player 2 to join...</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOnlineStatus('idle')}
                      className="text-xs text-gray-400 hover:text-gray-200 underline pt-2 cursor-pointer"
                    >
                      Cancel and Back
                    </button>
                  </div>
                ) : (
                  /* Create / Join Tabs */
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-[#1e1d1a] rounded-lg border border-[#3d3b37]">
                      <button
                        type="button"
                        onClick={() => setOnlineTab('CREATE')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                          onlineTab === 'CREATE' ? 'bg-[#81b64c] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Create Room
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnlineTab('JOIN')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                          onlineTab === 'JOIN' ? 'bg-[#81b64c] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Join Room
                      </button>
                    </div>

                    <div className="bg-[#262421] p-3.5 rounded-xl border border-[#3d3b37] space-y-2">
                      <label className="text-xs font-semibold text-gray-300 block">Your Display Name</label>
                      <input
                        type="text"
                        value={myPlayerName}
                        onChange={(e) => setMyPlayerName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="w-full bg-[#1e1d1a] border border-[#45423e] rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#81b64c] focus:ring-1 focus:ring-[#81b64c]"
                      />
                    </div>

                    {onlineTab === 'JOIN' && (
                      <div className="bg-[#262421] p-3.5 rounded-xl border border-[#3d3b37] space-y-2">
                        <label className="text-xs font-semibold text-gray-300 block">6-Character Room Code</label>
                        <input
                          type="text"
                          value={joinInputCode}
                          onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                          placeholder="e.g. TAC-729"
                          className="w-full bg-[#1e1d1a] border border-[#45423e] rounded-lg px-3.5 py-2 text-sm font-mono text-white placeholder-gray-500 uppercase tracking-wider focus:outline-none focus:border-[#81b64c] focus:ring-1 focus:ring-[#81b64c]"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={onlineTab === 'CREATE' ? handleCreateOnlineRoom : handleJoinOnlineRoom}
                      className="w-full btn-chess-green text-white font-extrabold text-base py-3 px-6 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>{onlineTab === 'CREATE' ? 'Create Online Match' : 'Join Match Room'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: PASS & PLAY (LOCAL) */
              <div className="p-6 space-y-4">
                <div className="bg-[#262421] p-3.5 rounded-xl border border-[#3d3b37] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <span className="w-5 h-5 rounded bg-sky-500 text-white font-black flex items-center justify-center text-xs shadow-sm">
                      X
                    </span>
                    <span>Player 1 (Plays X • First Move)</span>
                  </div>
                  <input
                    type="text"
                    value={name1}
                    onChange={(e) => setName1(e.target.value)}
                    placeholder="Enter Player 1 Name"
                    className="w-full bg-[#1e1d1a] border border-[#45423e] rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#81b64c] focus:ring-1 focus:ring-[#81b64c]"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <span className="px-3 py-0.5 rounded-full bg-[#262421] text-xs font-bold text-gray-400 border border-[#3d3b37]">
                    VS
                  </span>
                </div>

                <div className="bg-[#262421] p-3.5 rounded-xl border border-[#3d3b37] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <span className="w-5 h-5 rounded bg-[#81b64c] text-black font-black flex items-center justify-center text-xs shadow-sm">
                      O
                    </span>
                    <span>Player 2 (Plays O • Second Move)</span>
                  </div>
                  <input
                    type="text"
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    placeholder="Enter Player 2 Name"
                    className="w-full bg-[#1e1d1a] border border-[#45423e] rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#81b64c] focus:ring-1 focus:ring-[#81b64c]"
                  />
                </div>

                <button
                  type="button"
                  onClick={startLocalGame}
                  className="w-full btn-chess-green text-white font-extrabold text-base py-3 px-6 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Start Local Match</span>
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-gray-500 border-t border-[#302e2b]">
          Tic-Tac-Toe • Chess.com Style Interface
        </footer>
      </div>
    );
  }

  // 2. ACTIVE MATCH ARENA
  const isOnline = gameMode === 'ONLINE_MATCH';

  return (
    <div className="min-h-screen bg-[#262421] text-[#c3c2c0] flex flex-col md:flex-row font-['Montserrat',sans-serif]">
      {/* Left Navigation Bar */}
      <aside className="w-full md:w-16 lg:w-20 bg-[#1e1d1a] border-b md:border-b-0 md:border-r border-[#302e2b] flex md:flex-col items-center justify-between p-2.5 md:py-5 shrink-0 z-20">
        <div className="flex md:flex-col items-center gap-4 sm:gap-6">
          <div
            onClick={resetAll}
            title="TicTacToe.com"
            className="w-10 h-10 bg-[#81b64c] hover:bg-[#95c85b] rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer transition"
          >
            <TicTacToeGridIcon className="w-6 h-6" />
          </div>

          <nav className="flex md:flex-col items-center gap-1.5 sm:gap-2">
            <button
              title="Play Match"
              className="p-2.5 rounded-xl bg-[#312e2b] text-[#81b64c] border-l-0 md:border-l-4 border-[#81b64c] flex flex-col items-center justify-center transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
              <span className="text-[9px] font-bold mt-0.5">Arena</span>
            </button>

            <button
              title="Restart Round"
              onClick={restartGame}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#2b2926] flex flex-col items-center justify-center transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-[9px] font-medium mt-0.5">Reset</span>
            </button>
          </nav>
        </div>

        <div className="flex md:flex-col items-center gap-2">
          <button
            onClick={resetAll}
            title="Leave / Change Match"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#2b2926] transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Center Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Room banner for online mode */}
        {isOnline && (
          <div className="w-full max-w-sm sm:max-w-md mb-2 flex items-center justify-between bg-[#1e1d1a] px-3.5 py-1.5 rounded-lg border border-[#302e2b] text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Room: <strong className="text-white font-mono">{roomCode}</strong>
            </span>
            <button
              onClick={copyInviteLink}
              className="text-[#81b64c] hover:underline font-semibold cursor-pointer"
            >
              {copiedLink ? '✓ Copied' : 'Copy Invite Link'}
            </button>
          </div>
        )}

        {/* Top Player Card (Player 2 - O) */}
        <div className="w-full max-w-sm sm:max-w-md bg-[#21201d] rounded-t-xl px-4 py-3 flex items-center justify-between border-t border-x border-[#302e2b]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-[#181715] border-2 border-gray-700 flex items-center justify-center font-black text-lg text-[#81b64c] shadow-inner">
                O
              </div>
              {!xIsNext && !isGameOver && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#81b64c] border-2 border-[#21201d] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white leading-tight">
                  {players.O}
                </span>
                <span className="text-[10px] font-bold bg-[#81b64c]/20 text-[#81b64c] px-1.5 py-0.5 rounded border border-[#81b64c]/40">
                  {isOnline && myRole === 'O' ? 'YOU (O)' : 'Player O'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span>Wins: <strong className="text-white">{scores.O}</strong></span>
                <span>•</span>
                <span>Second Turn</span>
              </div>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-md text-xs font-bold ${
            !xIsNext && !isGameOver
              ? 'bg-[#81b64c] text-white shadow-md animate-pulse'
              : 'bg-[#181715] text-gray-500'
          }`}>
            {!xIsNext && !isGameOver ? 'ACTIVE TURN' : 'WAITING'}
          </div>
        </div>

        {/* Board Component */}
        <div className="w-full max-w-sm sm:max-w-md bg-[#2b2926] p-3 sm:p-4 border-x border-[#302e2b] flex items-center justify-center">
          <Board
            xIsNext={xIsNext}
            squares={currentSquares}
            onPlay={handlePlay}
            players={players}
            myRole={myRole}
            isOnline={isOnline}
          />
        </div>

        {/* Bottom Player Card (Player 1 - X) */}
        <div className="w-full max-w-sm sm:max-w-md bg-[#21201d] rounded-b-xl px-4 py-3 flex items-center justify-between border-b border-x border-[#302e2b]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-sky-950 border-2 border-sky-600 flex items-center justify-center font-black text-lg text-sky-400 shadow">
                X
              </div>
              {xIsNext && !isGameOver && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#81b64c] border-2 border-[#21201d] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white leading-tight">
                  {players.X}
                </span>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/40">
                  {isOnline && myRole === 'X' ? 'YOU (X)' : 'Player X'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span>Wins: <strong className="text-white">{scores.X}</strong></span>
                <span>•</span>
                <span>First Turn</span>
              </div>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-md text-xs font-bold ${
            xIsNext && !isGameOver
              ? 'bg-[#81b64c] text-white shadow-md animate-pulse'
              : 'bg-[#181715] text-gray-500'
          }`}>
            {xIsNext && !isGameOver ? 'ACTIVE TURN' : 'WAITING'}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 bg-[#21201d] border-t md:border-t-0 md:border-l border-[#302e2b] flex flex-col justify-between shrink-0 h-auto md:h-screen">
        <div className="p-4 border-b border-[#302e2b] bg-[#1e1d1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <div>
              <h2 className="text-sm font-bold text-white">Match Information</h2>
              <div className="text-[11px] text-gray-400">
                {isOnline ? 'Online Real-Time Room' : 'Local 2-Player Match'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#262421] px-2.5 py-1 rounded-md border border-[#3d3b37] text-xs font-bold">
            <span className="text-sky-400">{scores.X}</span>
            <span className="text-gray-500">-</span>
            <span className="text-[#81b64c]">{scores.O}</span>
            <span className="text-gray-500 text-[10px] ml-1">({scores.draws} D)</span>
          </div>
        </div>

        {/* Moves List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2.5 bg-[#262421] border-b border-[#302e2b] flex items-center justify-between text-xs font-semibold text-gray-400">
            <span>Moves ({history.length - 1} / 9)</span>
            <span>{isOnline ? 'Synced via Supabase' : 'Click move to step'}</span>
          </div>

          <div ref={moveListRef} className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-56 md:max-h-full">
            <button
              type="button"
              onClick={() => jumpTo(0)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                currentMove === 0
                  ? 'bg-[#45753c] text-white font-bold shadow'
                  : 'bg-[#262421] text-gray-300 hover:bg-[#312e2b]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🏁</span>
                <span>Initial Empty Grid</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">#0</span>
            </button>

            {history.slice(1).map((_, index) => {
              const moveIndex = index + 1;
              const isXMove = moveIndex % 2 === 1;
              const playerName = isXMove ? players.X : players.O;

              return (
                <button
                  key={moveIndex}
                  type="button"
                  onClick={() => jumpTo(moveIndex)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                    currentMove === moveIndex
                      ? 'bg-[#45753c] text-white font-bold shadow'
                      : 'bg-[#262421] text-gray-200 hover:bg-[#312e2b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center ${
                      isXMove ? 'bg-sky-500 text-white' : 'bg-[#81b64c] text-black'
                    }`}>
                      {isXMove ? 'X' : 'O'}
                    </span>
                    <span className="font-medium text-white">{playerName}:</span>
                    <span className="font-mono text-gray-300">{getMoveDetail(moveIndex)}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">#{moveIndex}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Controls Footer */}
        <div className="p-3 sm:p-4 bg-[#1e1d1a] border-t border-[#302e2b] space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              disabled={currentMove === 0}
              onClick={() => jumpTo(0)}
              title="First move"
              className="btn-chess-secondary text-gray-200 py-2 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              |◀
            </button>
            <button
              type="button"
              disabled={currentMove === 0}
              onClick={() => jumpTo(Math.max(0, currentMove - 1))}
              title="Previous move"
              className="btn-chess-secondary text-gray-200 py-2 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              ◀
            </button>
            <button
              type="button"
              disabled={currentMove === history.length - 1}
              onClick={() => jumpTo(Math.min(history.length - 1, currentMove + 1))}
              title="Next move"
              className="btn-chess-secondary text-gray-200 py-2 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              ▶
            </button>
            <button
              type="button"
              disabled={currentMove === history.length - 1}
              onClick={() => jumpTo(history.length - 1)}
              title="Latest move"
              className="btn-chess-secondary text-gray-200 py-2 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              ▶|
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={restartGame}
              className="w-full btn-chess-green text-white font-extrabold text-sm py-2.5 px-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isGameOver ? 'Play Next Round' : 'Restart Round'}</span>
            </button>

            <button
              type="button"
              onClick={resetAll}
              className="w-full btn-chess-secondary text-gray-300 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>⚙ Leave Match / Setup</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function calculateWinningLine(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return lines[i];
    }
  }
  return null;
}

function calculateWinner(squares) {
  const line = calculateWinningLine(squares);
  return line ? squares[line[0]] : null;
}