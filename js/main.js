"use strict";

;(function () {
    let difficulty = document.querySelector('#difficulty');
    let size = document.querySelector('#size');
    let flag = document.querySelector('#flag');
    let clock = document.querySelector('#clock');
    let restart = document.querySelector('#restart');
    let field = document.querySelector('#field');
    let timerId;
    
    newGame();

    restart.addEventListener('click', newGame);

    // начало новой игры
    function newGame() {
        getClean();
        createField();
        timerId = setInterval(function() {
            clock.value++;
        }, 1000);
    }

    // очистка
    function getClean() {
        field.textContent = '';
        clock.value = 0;
        clearInterval(timerId);
        restart.classList.remove('fail');
    }

    // создание поля
    function createField() {
        let bombArr = getRandomArr(getBombs()); // массив номеров ячеек с бомбами
        let tds = [] // массив tdшек, номеров соседей и количества бомб рядом
        let num = 0; // счётчик tdшек

        flag.value = bombArr.length;
        
        for (let i = 0; i < size.value; i++) {
            let tr = document.createElement('tr');
    
            for (let j = 0; j < size.value; j++) {
                let td = document.createElement('td');
    
                tds[num] = {};
                tds[num].elem = td;
                td.classList.add('close');

                if (bombArr.includes(num)) {
                    td.classList.add('bomb');
                }
               
                num++;
                tr.appendChild(td);
            }
            field.appendChild(tr);
        }

        getNeighbours(tds, +size.value);
        getBombsNear(tds);
        openTd(tds); // навешивание на tdшки события открытия и меток флага
    }

    // расчёт количества бомб
    function getBombs() {
        return size.value * size.value * difficulty.value / 100;
    }
    
    // генерация массива номеров случайных ячеек с бомбами
    function getRandomArr(bombs) {
        let max = size.value * size.value - 1;
        let arr = [];

        while (arr.length != bombs) {
            let num = Math.floor(Math.random() * max + 1);

            if (arr.includes(num)) {
                continue;
            } else {
                arr.push(num);
            }
        }

        return arr;
    }

    // получение соседей 
    function getNeighbours(tds, size) {
        getPerimeterNeighbours(tds, size);
        getTopLine(tds, size);
        getBottomLine(tds, size);
        getLeftLine(tds, size);
        getRightLine(tds, size);
        getRemainingNeighbours(tds, size);
    }

    // получение четырёх соседей по периметру
    function getPerimeterNeighbours(tds, size) {
        tds[0].neighbours = [1, size, size + 1];
        tds[size - 1].neighbours = [(size - 2), (size + size - 1), (size + size - 2)];
        tds[size * size - size].neighbours = [(size * size - 2 * size), (size * size - 2 * size + 1), (size * size - size + 1)];
        tds[size * size - 1].neighbours = [(size * size - 2), (size * size - size - 2), (size * size - size - 1)];
    }

    // получение соседей верхнего ряда 
    function getTopLine(tds, size) {
        for (let i = 1; i < size - 1; i++) { 
            tds[i].neighbours = [i - 1, i + 1, i + size + 1, i + size, i + size - 1];
        }
    }

    // получение соседей нижнего ряда
    function getBottomLine(tds, size) {
        for (let i = (size * size - size + 1); i < (size * size - 1); i++) {
            tds[i].neighbours = [i - 1, i - size - 1, i - size, i - size + 1, i + 1];
        }
    }

    // получение соседей левого ряда
    function getLeftLine(tds, size) {
        for (let i = size; i < (size * size - size); i += size) {
            tds[i].neighbours = [i - size, i - size + 1, i + 1, i + size + 1, i + size];
        }
    }
    
    // получение соседей правого ряда
    function getRightLine(tds, size) {
        for (let i = (size + size - 1); i < (size * size - 1); i += size) {
            tds[i].neighbours = [i - 1, i - size - 1, i - size, i + size, i + size - 1];
        }
    }

    // получение оставшихся соседей
    function getRemainingNeighbours(tds, size) {
        for (let i = 0; i < size * size; i++) {
            if (!('neighbours' in tds[i])) {
                tds[i].neighbours = [i - 1, i - size - 1, i - size, i - size + 1, i + 1, i + size + 1, i + size, i + size - 1]
            }
        }
    }

    // вычисление количества бомб рядом
    function getBombsNear(tds) {
        for (let td of tds) {
            let bombs = 0;

            for (let neighbour of td.neighbours) {
                if (tds[neighbour].elem.classList.contains('bomb')) {
                    bombs++;
                }
            }

            td.bombsNear = bombs;
        }
    }

    // событие открытия ячейки и отметки флагом
    function openTd(tds) {
        for (let td of tds) {
            td.elem.addEventListener('contextmenu', function func(event) {
                event.preventDefault();

                if (td.elem.classList.contains('close') && !td.elem.classList.contains('disable')) {
                    td.elem.classList.toggle('flag');

                    if (td.elem.classList.contains('flag')) {
                        flag.value--;
                    } else {
                        flag.value++;
                    }

                    checkWin(tds);
                }
            });

            td.elem.addEventListener('click', function func() {
                if (!(td.elem.classList.contains('disable') || td.elem.classList.contains('flag'))) {
                        td.elem.classList.remove('close');
    
                    if (!td.elem.classList.contains('bomb'))  {
                        checkBombsNear(tds, td);
                    } else {
                        td.elem.classList.add('fail');
                        gameOver(tds);
                    }

                    checkWin(tds);
                    td.elem.removeEventListener('click', func); 
                }
            });
        }
    }

    // определение и запись количества бомб рядом
    function checkBombsNear(tds, td) {
        if (td.bombsNear) {
            td.elem.textContent = td.bombsNear;
            td.elem.classList.add('b' + td.bombsNear);

            if (!activeBombs(tds, td)) {
                openFreeSpace(tds, td);
            }
        } else {
            openFreeSpace(tds, td);
        }
    } 

    // проверка на разминирование, то есть флаг стоит на бомбе
    function activeBombs(tds, td) {
        let bombs = td.bombsNear;

        for (let neighbour of td.neighbours) {
            if (tds[neighbour].elem.classList.contains('bomb') && tds[neighbour].elem.classList.contains('flag')) {
                bombs--;
            }
        }

        return bombs;
    }
    
    // открытие свободного пространства
    function openFreeSpace(tds, td) {
        for (let neighbour of td.neighbours) {
            if (tds[neighbour].elem.classList.contains('close') && !tds[neighbour].elem.classList.contains('bomb') && !tds[neighbour].elem.classList.contains('flag')) {

                tds[neighbour].elem.classList.remove('close');

                if (tds[neighbour].bombsNear) {
                    checkBombsNear(tds, tds[neighbour]);
                } else {
                    openFreeSpace(tds, tds[neighbour]);
                }
            }
        }
    }

    // проверка на победу
    function checkWin(tds) {
        if (flag.value != 0) {
            return false;
        } else {
            for (let td of tds) {
                if ((td.elem.classList.contains('bomb') && !td.elem.classList.contains('flag')) || (!td.elem.classList.contains('bomb') && td.elem.classList.contains('flag'))) {
                    return false;
                } else if ((td.elem.classList.contains('close') && !td.elem.classList.contains('bomb'))) {
                    return false;
                }
            }           
        }

        for (let td of tds) {
            td.elem.classList.add('disable');
        }
        
        clearInterval(timerId);
        alert('ПОБЕДА!!!');
    }

    // поражение
    function gameOver(tds) {
        for (let td of tds) {
            td.elem.classList.add('disable');

            if (td.elem.classList.contains('bomb')) {
                td.elem.classList.remove('close');
                td.elem.classList.remove('flag');
            }
        }

        restart.classList.add('fail');
        clearInterval(timerId);
        alert('BOOM!!!');
    }
})();