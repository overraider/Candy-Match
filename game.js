const { useState, useEffect } = React;

const GRID_SIZE = 8;
const CANDY_TYPES = ['🍬', '🍭', '🍫', '🍩', '🧁', '🍪'];
const MATCH_MIN = 3;

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

  return React.createElement('div', {
    className: "min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 flex items-center justify-center p-4"
  },
    React.createElement('div', {
      className: "bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full"
    },
      React.createElement('div', { className: "text-center mb-6" },
        React.createElement('h1', {
          className: "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2"
        }, '🌟 Candy Match')
      ),
      
      React.createElement('div', {
        className: "flex justify-between mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4"
      },
        React.createElement('div', { className: "text-center" },
          React.createElement('div', { className: "text-sm font-semibold text-purple-600" }, 'Pontos'),
          React.createElement('div', { className: "text-2xl font-bold text-purple-800" }, score)
        ),
        React.createElement('div', { className: "text-center" },
          React.createElement('div', { className: "text-sm font-semibold text-pink-600" }, 'Jogadas'),
          React.createElement('div', { className: "text-2xl font-bold text-pink-800" }, moves)
        ),
        combo > 1 && React.createElement('div', { className: "text-center animate-bounce" },
          React.createElement('div', { className: "text-sm font-semibold text-yellow-600" }, 'Combo'),
          React.createElement('div', { className: "text-2xl font-bold text-yellow-800" }, 'x' + combo)
        )
      ),

      React.createElement('div', {
        className: "bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl p-3 mb-4"
      },
        React.createElement('div', {
          className: "grid gap-1",
          style: { gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }
        },
          grid.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
              React.createElement('button', {
                key: `${rowIndex}-${colIndex}-${cell?.id}`,
                onClick: () => handleCellClick(rowIndex, colIndex),
                disabled: isAnimating || gameOver,
                className: `
                  aspect-square rounded-lg text-3xl flex items-center justify-center
                  transition-all duration-200 transform
                  ${selected?.row === rowIndex && selected?.col === colIndex
                    ? 'scale-110 bg-yellow-200 shadow-lg ring-4 ring-yellow-400'
                    : 'bg-white hover:scale-105 hover:shadow-md'
                  }
                  ${isAnimating ? 'pointer-events-none' : 'cursor-pointer'}
                `
              }, cell?.type)
            )
          )
        )
      ),

      gameOver ? 
        React.createElement('div', { className: "text-center space-y-4" },
          React.createElement('div', {
            className: "bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4"
          },
            React.createElement('div', { className: "text-white text-5xl mb-2" }, '🏆'),
            React.createElement('div', { className: "text-white font-bold text-xl" }, 'Fim do Jogo!'),
            React.createElement('div', { className: "text-white text-3xl font-bold" }, score + ' pontos')
          ),
          React.createElement('button', {
            onClick: initializeGrid,
            className: "w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          }, '🔄 Jogar Novamente')
        )
      :
        React.createElement('button', {
          onClick: initializeGrid,
          className: "w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all"
        }, '🔄 Novo Jogo')
    )
  );
}

ReactDOM.render(React.createElement(CandyMatch), document.getElementById('root'));
