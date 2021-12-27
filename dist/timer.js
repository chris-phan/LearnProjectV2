let intervalID;
function startTimer() {
    const numbers = [];
    for (let i = 0; i <= 9; i++) {
        numbers[i] = "../images/red_" + i + ".png";
    }

    const leftTime = document.querySelector("#red-num-timer-left");
    const midTime = document.querySelector("#red-num-timer-mid");
    const rightTime = document.querySelector("#red-num-timer-right");
    var time = 0;
    var delay = 1000;

    intervalID = setInterval(() => {
        time++;
        if (!(time > 999)) {
            rightTime.src = numbers[time % 10];
            midTime.src = numbers[Math.floor(time / 10) % 10];
            leftTime.src = numbers[Math.floor(time / 100)];
        }

    }, delay);

    return time;
}

function stopTimer(interval) {
    clearInterval(interval);
}