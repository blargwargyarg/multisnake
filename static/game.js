let socket = io();
const cellSize = 20;
document.addEventListener('keydown', function(event) {
    let movement = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    switch (event.code) {
        case "ArrowLeft":
            movement.left = true;
            movement.right = false;
            movement.up = false;
            movement.down = false;
            break;
        case "ArrowUp":
            movement.left = false;
            movement.right = false;
            movement.up = true;
            movement.down = false;
            break;
        case "ArrowRight":
            movement.left = false;
            movement.right = true;
            movement.up = false;
            movement.down = false;
            break;
        case "ArrowDown":
            movement.left = false;
            movement.right = false;
            movement.up = false;
            movement.down = true;
            break;
    }
    socket.emit('movement',movement);
});
socket.emit('new player');
let canvas = document.getElementById('canvas');
let textArea = document.getElementById('textArea');
canvas.width = 580;
canvas.height = 400;
let context = canvas.getContext('2d');
let grid = {x:subdivide(27),y:subdivide(17)};
function subdivide(x){
    let t = [];
    let size = cellSize;
    for(let i = 0;i<x;i++){
        t.push(size);
        size += cellSize;
    }
    return t;
}
socket.on('state', function(players,food,game) {
    context.fillStyle = '#FC5454';
    context.fillRect(0, 0, 580, 400);
    context.fillStyle = '#0000D9';
    context.fillRect(20,20,540,340);
    context.fillStyle = 'red';
    if(food[0]!==-1)context.fillRect(grid.x[food[0]],grid.y[food[1]],cellSize,cellSize);
    if(game.state[0]!==""){
        textArea.innerHTML= game.state[0];
    }else if(game.state[1]!==""){
        textArea.innerHTML = game.state[1]+"<br>"+textArea.innerHTML;
        if((textArea.innerHTML.match(/<br>/g) || []).length>2)textArea.innerHTML= textArea.innerHTML.slice(0,textArea.innerHTML.lastIndexOf("<br>"));
    }
    for (let id in players) {
        context.fillStyle = players[id].color;
        if(id === socket.id){
            context.fillText("Length: "+players[socket.id].size,500,380);
        }
        let player = players[id];
        if(player.alive)for(let i = 0;i<player.size;i++)if(player.pts[i][0]!==-1)context.fillRect(grid.x[player.pts[i][0]]+1,grid.y[player.pts[i][1]]+1,cellSize-2,cellSize-2);
    }
});