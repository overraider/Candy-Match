const { useState, useEffect } = React;

const GRID_SIZE = 8;
const CANDY_TYPES = ['🍬', '🍭', '🍫', '🍩', '🧁', '🍪'];
const MATCH_MIN = 3;

// Ícones SVG como componentes
const Sparkles = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    <path d="M19 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
  </svg>
);

const Trophy = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const RotateCcw = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

function CandyMatch() {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [selected, setSelected] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    let newGrid;
    do {
      newGrid = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          type: CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)],
          id: Math.random()
        }))
      );
    } while (hasMatches(newGrid));
    
    setGrid(newGrid);
    setScore(0);
    setMoves(30);
    setGameOver(false);
    setCombo(0);
  };

  const hasMatches = (g) => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (col <= GRID_SIZE - MATCH_MIN) {
          const match = g[row][col].type === g[row][col + 1].type && 
                       g[row][col].type === g[row][col + 2].type;
          if (match) return true;
        }
        if (row <= GRID_SIZE - MATCH_MIN) {
          const match = g[row][col].type === g[row + 1][col].type && 
                       g[row][col].type === g[row + 2][col].type;
          if (match) return true;
        }
      }
    }
    return false;
  };

  const handleCellClick = (row, col) => {
    if (isAnimating || gameOver) return;

    if (!selected) {
      setSelected({ row, col });
    } else {
      const rowDiff = Math.abs(selected.row - row);
      const colDiff = Math.abs(selected.col - col);
      
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        swapCandies(selected.row, selected.col, row, col);
      }
      setSelected(null);
    }
  };

  const swapCandies = async (row1, col1, row2, col2) => {
    setIsAnimating(true);
    
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
    
    setGrid(newGrid);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (hasMatches(newGrid)) {
      setMoves(m => m - 1);
      processMatches(newGrid);
    } else {
      [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
      setGrid(newGrid);
      setIsAnimating(false);
    }
  };

  const processMatches = async (currentGrid) => {
    let newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    let matchFound = true;
    let currentCombo = 0;

    while (matchFound) {
      matchFound = false;
      const toRemove = [];

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (col <= GRID_SIZE - MATCH_MIN) {
            let count = 1;
            while (col + count < GRID_SIZE && 
                   newGrid[row][col].type === newGrid[row][col + count].type) {
              count++;
            }
            if (count >= MATCH_MIN) {
              for (let i = 0; i < count; i++) {
                toRemove.push({ row, col: col + i });
              }
              matchFound = true;
            }
          }
          
          if (row <= GRID_SIZE - MATCH_MIN) {
            let count = 1;
            while (row + count < GRID_SIZE && 
                   newGrid[row][col].type === newGrid[row + count][col].type) {
              count++;
            }
            if (count >= MATCH_MIN) {
              for (let i = 0; i < count; i++) {
                toRemove.push({ row: row + i, col });
              }
              matchFound = true;
            }
          }
        }
      }

      if (matchFound) {
        currentCombo++;
        const points = toRemove.length * 10 * currentCombo;
        setScore(s => s + points);
        setCombo(currentCombo);

        toRemove.forEach(({ row, col }) => {
          newGrid[row][col] = null;
        });

        setGrid(newGrid);
        await new Promise(resolve => setTimeout(resolve, 300));

        for (let col = 0; col < GRID_SIZE; col++) {
          let emptySpaces = 0;
          for (let row = GRID_SIZE - 1; row >= 0; row--) {
            if (newGrid[row][col] === null) {
              emptySpaces++;
            } else if (emptySpaces > 0) {
              newGrid[row + emptySpaces][col] = newGrid[row][col];
              newGrid[row][col] = null;
            }
          }
          
          for (let row = 0; row < emptySpaces; row++) {
            newGrid[row][col] = {
              type: CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)],
              id: Math.random()
            };
          }
        }

        setGrid(newGrid);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setCombo(0);
    setIsAnimating(false);
    
    if (moves <= 1) {
      setGameOver(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2 flex items-center justify-center gap-2">
            <span className="text-yellow-400"><Sparkles /></span>
            Candy Match
          </h1>
        </div>

        <div className="flex justify-between mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
          <div className="text-center">
            <div className="text-sm font-semibold text-purple-600">Pontos</div>
            <div className="text-2xl font-bold text-purple-800">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-pink-600">Jogadas</div>
            <div className="text-2xl font-bold text-pink-800">{moves}</div>
          </div>
          {combo > 1 && (
            <div className="text-center animate-bounce">
              <div className="text-sm font-semibold text-yellow-600">Combo</div>
              <div className="text-2xl font-bold text-yellow-800">x{combo}</div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl p-3 mb-4">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}-${cell?.id}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={isAnimating || gameOver}
                  className={`
                    aspect-square rounded-lg text-3xl flex items-center justify-center
                    transition-all duration-200 transform
                    ${selected?.row === rowIndex && selected?.col === colIndex
                      ? 'scale-110 bg-yellow-200 shadow-lg ring-4 ring-yellow-400'
                      : 'bg-white hover:scale-105 hover:shadow-md'
                    }
                    ${isAnimating ? 'pointer-events-none' : 'cursor-pointer'}
                  `}
                >
                  {cell?.type}
                </button>
              ))
            )}
          </div>
        </div>

        {gameOver ? (
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4">
              <div className="flex justify-center text-white mb-2"><Trophy /></div>
              <div className="text-white font-bold text-xl">Fim do Jogo!</div>
              <div className="text-white text-3xl font-bold">{score} pontos</div>
            </div>
            <button
              onClick={initializeGrid}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw />
              Jogar Novamente
            </button>
          </div>
        ) : (
          <button
            onClick={initializeGrid}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw />
            Novo Jogo
          </button>
        )}
      </div>
    </div>
  );
}

ReactDOM.render(<CandyMatch />, document.getElementById('root'));
