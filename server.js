// Dependencies
let express = require('express');
const http = require('http'),
    path = require('path');
let socketIO = require('socket.io');

let app = express();
let server = http.Server(app);
let io = socketIO(server);
let players = {},
    food = [-1,0],
    colors = ['yellow','green','white','black','brown','purple','grey','pink'],
    game = {start:false, players:0, counter:0, state:["",""]};
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});



// Starts the server.
server.listen(process.env.PORT||5000, function() {
    console.log('Starting server');
});

io.on('connection', function(socket) {
    socket.on('new player', function() {
        if(game.players<8) {
            players[socket.id] = {
                pts: [],
                xa: 0,
                ya: 0,
                size: 1,
                pa: [0, 0],
                alive: false,
                color: colors[0].slice(),
                wins: 0
            };
            game.players++;
            colors.splice(0, 1);
            game.counter = 0;
        }
    });
    socket.on('movement', function(data) {
        let player = players[socket.id] || {};
        if((player.size === 1 || player.pa[0] !== -1)&&data.right){player.xa=1;player.ya=0;}
        if((player.size === 1 || player.pa[0] !== 1)&&data.left){player.xa=-1;player.ya=0;}
        if((player.size === 1 || player.pa[1] !== -1)&&data.down){player.xa=0;player.ya=1;}
        if((player.size === 1 || player.pa[1] !== 1)&&data.up){player.xa=0;player.ya=-1;}
    });
    socket.on('disconnect', function() {
        if(players[socket.id]!==undefined){
            game.players--;
            if(game.players<2)game.start = false;
            game.counter = 0;
            try{colors.push(players[socket.id].color);}
            catch(err){
                let tcolors = ['yellow','green','white','black','brown','purple','grey','pink'];
                for(let i = tcolors.length-1; i>0;i--)for(let i0 =0;i<colors.length;i++)if(colors[i]===tcolors[i]){tcolors.splice(i,1);break;}
                for(let i = tcolors.length-1; i>0;i--)for(let id in players)if(players[id].color===tcolors[i]){tcolors.splice(i,1);break;}
                if (tcolors.length>0)colors.push(tcolors[0]);
            }
            delete players[socket.id];
        }
    });
});
function makeGrid(){
    let rArray = [];
    for(let id in players)if(players[id].alive)for(let i = 1;i<players[id].size;i++)rArray.push(players[id].pts[i]);
    return rArray;
}
function isSame(a,b){
    return(a[0]===b[0]&&a[1]===b[1]);
}
setInterval(function() {  //update game logic here//todo confirmation system for before game things
    game.state[0] = "";game.state[1] = "";
    if(!game.start){
        if(game.counter >= 0) {
            let c = 0;
            for (let id in players)if (players[id].xa !== 0 || players[id].ya !== 0)c++;
            for(let id in players){
                if ((players[id].xa !== 0 || players[id].ya !== 0) && !players[id].alive) {
                    players[id].alive = true;
                    if (c === 1) players[id].pts[0] = [1, 1];
                    else if (c === 2) players[id].pts.push([25, 15]);
                    else if (c === 3) players[id].pts.push([25, 1]);
                    else if (c === 4) players[id].pts.push([1, 15]);
                    else if (c === 5) players[id].pts.push([1, 8]);
                    else if (c === 6) players[id].pts.push([25, 8]);
                    else if (c === 7) players[id].pts.push([13, 1]);
                    else if (c === 8) players[id].pts.push([13, 15]);
                }
            }
            if(game.counter === 0){
                game.state[0]="Game Restarting | Press direction keys to join";
                for (let id in players){
                    players[id].alive = false;
                    players[id].size = 1;
                    players[id].pts = [];
                    players[id].xa = 0;
                    players[id].ya = 0;
                    players[id].pa = 0;
                }
                food=[-1,0];
            }
        }
        if(game.players>1)game.counter++;
        if(game.counter>=100) {
            let c = 0;
            for (let id in players)if (players[id].xa !== 0 || players[id].ya !== 0)c++;
            if(c>1) {
                game.start = true;
                game.state[0] = "Game Started";
            }
            game.counter = 0;
        }else if(game.counter === 0&&game.players<2)game.state[0] = "Waiting for players";
        else if(game.counter < 100&&game.counter>20){
            let c = 0;
            for (let id in players)if (players[id].xa !== 0 || players[id].ya !== 0)c++;
            game.state[1] = c + " Players | Time Remaining To Join: "+(100-game.counter);
        }
    }else if(game.counter>0){
        game.counter--;
        if(game.counter===0)game.start=false;
    }else{
        for (let id in players) {//movement loop
            let player = players[id];
            if (player.alive) {
                for (let i = player.size - 1; i > 0; i--) player.pts[i] = player.pts[i - 1].slice();
                player.pts[0][0] += player.xa;
                player.pts[0][1] += player.ya;
                player.pa[0] = player.xa;
                player.pa[1] = player.ya;
            }
        }
        let t = makeGrid();
        for (let id in players) {//wall and body collision loop
            let player = players[id];
            if (player.alive) {
                if (player.pts[0][0] < 0 || player.pts[0][1] < 0 || player.pts[0][0] > 26 || player.pts[0][1] > 16) {
                    player.alive = false;
                    if(game.state[1]!=="")game.state[1]+=", and ";
                    game.state[1]+=player.color + " is bad";
                }
                for (let i = 0; i < t.length; i++) if (isSame(player.pts[0], t[i])) {
                    player.alive = false;
                    if(game.state[1]!=="")game.state[1]+=", and ";
                    game.state[1]+=player.color + " is bad";
                    break;
                }
            }
        }
        let c = 0;
        for (let id1 in players) {//collisions between snake heads here
            if (players[id1].alive) {
                for (let id2 in players) {
                    if (id2 !== id1 && players[id2].alive) if (isSame(players[id1].pts[0], players[id2].pts[0])) {
                        if (players[id1].size > players[id2].size) {
                            players[id2].alive = false;
                            if(game.state[1]!=="")game.state[1]+=", and ";
                            game.state[1]+=players[id2].color + " is worse than "+players[id1].color;
                        }
                        else if (players[id2].size > players[id1].size) {
                            players[id1].alive = false;
                            if(game.state[1]!=="")game.state[1]+=", and ";
                            game.state[1]+=players[id1].color + " is worse than "+players[id2].color;
                            break;
                        } else {
                            players[id1].alive = false;
                            players[id2].alive = false;
                            if(game.state[1]!=="")game.state[1]+=", and ";
                            game.state[1]+=players[id1].color + " and " + players[id2].color+" are bad";
                            break;
                        }
                    }
                }
                t.push(players[id1].pts[0]);
                c++;
            }
        }
        if(c<2) {
            game.state[1]="";
            if (c === 0)game.state[0] = "Everyone is bad";
            else {
                for (let id in players) if (players[id].alive) {
                    players[id].wins++;
                    game.state[0] = players[id].color + " is the least bad and has "+players[id].wins+" wins";
                }
            }
            for (let id in players)game.state[0]+="<br>"+players[id].color+"|"+players[id].wins+" wins";
            game.counter = 25;
        }
        for (let id in players) {//food collision loop
            let player = players[id];
            if (isSame(player.pts[0], food)) {
                player.size += 5;
                for (let i = 0; i < 5; i++) player.pts.push([-1, 0]);
                food[0] = -1;
            }
        }
        while (food[0] === -1) {
            food[0] = Math.floor(Math.random() * 27);
            food[1] = Math.floor(Math.random() * 17);
            for (let i = 0; i < t.length; i++) if (isSame(t[i], food)) food[0] = -1;
        }
    }
    io.sockets.emit('state', players, food, game);
}, 80);