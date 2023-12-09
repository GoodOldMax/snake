class Game {
    _intervalId = null;
    _snake = [];
    _currentScore = 0;
    _options = {
        width: 10,
        height: 10,
        interval: 500,
        initialAppleCount: 2,
    };

    constructor() {
        this._fieldElement = document.querySelector('#field');
        this._currentScoreElement = document.querySelector('.score_current');
        this._bestScoreElement = document.querySelector('.score_best');
        document.querySelectorAll('.control__btn').forEach(element => {
            element.addEventListener('click', event => {
                if (!this.isStarted()) {
                    this.play();
                }
            });
        });
        this._initNewField();
    }

    isStarted() {
        return Boolean(this._intervalId);
    }

    play() {
        this._generateApples(this._options.initialAppleCount);
        this._bindKeys();
        this._field.draw();
        this._intervalId = this._startInterval();
    }

    over() {
        clearInterval(this._intervalId);
        this._intervalId = null;
        alert('Игра окончена');
        this._initNewField();
    }

    _initNewField() {
        this._updateBestScore();
        this._setCurrentScore(0);
        this._field = new Field(
            this._options.width,
            this._options.height,
            this._fieldElement,
        );
        this._generateSnake();
        this._field.draw();
    }

    _generateSnake() {
        this._snake = new Snake(this._field);
    }

    _generateApples(count) {
        for (let i = 0; i < count; i++) {
            new Apple(this._field);
        }
    }

    _setCurrentScore(value) {
        this._currentScore = value;
        this._currentScoreElement.innerHTML = value;
    }

    _setSpeed(value) {
        this._options.interval = value;
        clearInterval(this._intervalId);
        this._intervalId = this._startInterval();
    }

    _startInterval() {
        return setInterval(() => {
            const eaten = this._snake.move()
            if (Apple.prototype.consistsOf(eaten)) {
                // Съели яблоко, это хорошо
                this._generateApples(1);
                this._setSpeed(this._options.interval - 10);
                this._setCurrentScore(this._currentScore + 1);
            } else if (Snake.prototype.consistsOf(eaten) || eaten === undefined) {
                // Съели часть себя, игра окончена
                this.over();
            }
            this._field.draw();
        }, this._options.interval);
    }

    _updateBestScore() {
        const bestScore = Math.max(
            parseInt(localStorage.getItem('bestScore') || 0),
            this._currentScore,
        );

        localStorage.setItem('bestScore', bestScore);
        this._bestScoreElement.innerHTML = bestScore;

        if (bestScore) {
            this._bestScoreElement.hidden = false;
        } else {
            this._bestScoreElement.hidden = true;
        }
    }

    _bindKeys() {
        document.addEventListener('keydown', event => {
            switch (event.key) {
                case "ArrowUp":
                    this._snake.setDirection(0, -1);
                    break;
                case "ArrowDown":
                    this._snake.setDirection(0, 1);
                    break;
                case "ArrowLeft":
                    this._snake.setDirection(-1, 0);
                    break;
                case "ArrowRight":
                    this._snake.setDirection(1, 0);
                    break;
            }
        });
        document.querySelector('.control__btn_up').addEventListener('click', event => {
            this._snake.setDirection(0, -1);
        });
        document.querySelector('.control__btn_down').addEventListener('click', event => {
            this._snake.setDirection(0, 1);
        });
        document.querySelector('.control__btn_left').addEventListener('click', event => {
            this._snake.setDirection(-1, 0);
        });
        document.querySelector('.control__btn_right').addEventListener('click', event => {
            this._snake.setDirection(1, 0);
        });
    }
}


class Field {
    _cells = []

    constructor(width, height, htmlElement) {
        this._htmlElement = htmlElement;
        for (let x = 0; x < width; x++) {
            this._cells[x] = [];
            for (let y = 0; y < height; y++) {
                this._cells[x][y] = null;
            }
        }
    }

    getCell(x, y) {
        if (this._cells[x] === undefined) {
            return undefined;
        }
        return this._cells[x][y];
    }

    setCell(x, y, value) {
        this._cells[x][y] = value;
    }

    resetCell(x, y) {
        this._cells[x][y] = null;
    }

    setEmptyCell(value) {
        const foundCells = [];

        this._cells.forEach((column, x) => {
            column.forEach((item, y) => {
                if (item === null) {
                    foundCells.push({x: x, y: y});
                }
            })
        });

        const randomCellIndex = Math.floor(Math.random() * foundCells.length);
        const randomCell = foundCells[randomCellIndex];
        this._cells[randomCell.x][randomCell.y] = value;
        return randomCell;
    }

    _getCellCoordinates(value) {
        for (let x = 0; x < this._cells.length; x++) {
            for (let y = 0; y < this._cells[0].length; y++) {
                if (this._cells[x][y] === value) {
                    return {x: x, y: y};
                }
            }
        }
    }

    draw() {
        this._htmlElement.innerHTML = this._cells.map((column, x) => {
            return column.map((item, y) => {
                if (item === null) {
                    return '<div class="cell"></div>';
                } else if (item instanceof AppleCell) {
                    return '<div class="cell cell_apple"></div>';
                } else if (item instanceof SnakeCell) {
                    return '<div class="cell cell_snake"></div>';
                }
            }).reduce((prev, cur) => [prev, cur].join(''));
        }).reduce((prev, cur) => [prev, cur].join(''));
    }
}


class Apple {
    _field = null

    constructor(field) {
        this._field = field;

        const part = new AppleCell();
        this._field.setEmptyCell(part);
    }

    consistsOf(entity) {
        return entity instanceof AppleCell;
    }
}


class Snake {
    _field = null
    _parts = []
    _direction = {
        dx: 1,
        dy: 0,
    }

    constructor(field) {
        this._field = field;

        const head = new SnakeCell();
        this._field.setCell(5, 4, head);
        this._parts.push(head);

        const body = new SnakeCell();
        this._field.setCell(4, 4, body);
        this._parts.push(body);
    }

    move() {
        const currentHead = this._parts[0];
        const currentHeadCoordinates = this._field._getCellCoordinates(currentHead);

        // вычисляем координаты клетки, на которую наступаем
        const nextHeadCoordinates = {
            x: currentHeadCoordinates.x + this._direction.dx,
            y: currentHeadCoordinates.y + this._direction.dy,
        }

        // проверяем что мы нашли на следующей клетке по текущему направлению движения
        const eaten = this._field.getCell(
            nextHeadCoordinates.x, nextHeadCoordinates.y
        )

        if (!Apple.prototype.consistsOf(eaten)) {
            // удаляем старый хвост
            const previousTail = this._parts.pop();
            const previousTailCoordinates = this._field._getCellCoordinates(previousTail);
            this._field.resetCell(previousTailCoordinates.x, previousTailCoordinates.y);
        }

        if (eaten !== undefined) {
            // создаем новую голову по текущему направлению движения
            const newHead = new SnakeCell();
            this._field.setCell(
                nextHeadCoordinates.x, nextHeadCoordinates.y, newHead
            );
            this._parts.unshift(newHead);
        }

        // возвращаем то, что "съели" в новой клетке
        return eaten;
    }

    setDirection(dx, dy) {
        this._direction.dx = dx;
        this._direction.dy = dy;
    }

    consistsOf(entity) {
        return entity instanceof SnakeCell;
    }
}


class AppleCell {}


class SnakeCell {}


const game = new Game();

document.querySelector('#field').addEventListener('click', event => {
    if (!game.isStarted()) {
        game.play();
    }
});
