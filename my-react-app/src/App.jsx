import { useState } from 'react'

function Square({ value, onSquareClick }) {
  return <button className='square' onClick={onSquareClick}>{value}</button>;
}
function Board({ xIsNext, squares, onPlay, players }) {

  function handleClick(i) {
    if (squares[i] || calculateWinner(squares)) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    }
    else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  }
  const winner = calculateWinner(squares);
  const isBoardFull = squares.every(square => square !== null);
  let status;
  if (winner) {
    status = "Winner: " + players[winner];
  }
  else if (isBoardFull) {
    status = "Draw";
  }
  else {
    status = "Next player: " + (xIsNext ? players.X : players.O);
  }
  return (
    <div className='board'>
      <div className='status'>{status}</div>
      <div className='board-row'>
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />

      </div>
      <div className='board-row'>
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />

      </div>
      <div className='board-row'>
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />


      </div>
    </div>


  );

}

export default function game() {
  const [players, setPlayers] = useState(null); // null = names not set yet
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [history, sethistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function startGame() {
    if (!name1.trim() || !name2.trim()) {
      alert("Please enter both player names!");
      return;
    }
    setPlayers({ X: name1.trim(), O: name2.trim() });
  }

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    sethistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);

  }
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);


  }
  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = "Go to move #" + move;
    }
    else {
      description = "Go to game start"
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );


  }

  );
  if (!players) {
    return (
      <div className="setup-screen">
        <div className='setup-card'>
          <h2>Enter Player Names</h2>
          <input value={name1} onChange={(e) => setName1(e.target.value)} placeholder="Player 1 (X)" />
          <input value={name2} onChange={(e) => setName2(e.target.value)} placeholder="Player 2 (O)" />
          <button onClick={startGame}>Start Game</button>

        </div>

      </div>
    );
  }
  return (
    <div className='game'>
      <div className='game-board'>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} players={players} />
      </div>
      <div className='game-info'>
        <ol className='bg-blue-500'>{moves}</ol>

      </div>

    </div>
  );
}
function calculateWinner(squares) {
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
      return squares[a];
    }


  }
  return null;

}