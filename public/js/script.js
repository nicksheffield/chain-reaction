var s_id = '';
var o_id = '';
var w = 6;
var h = 8;
var grid = {};
var team = 1;
var turns = 0;
var gameover = false;
var yourturn = false;
var changed = {x:0, y:0};
var ingame = false;
var yourteam = 0;
var local = false;
var exploding = [];
var randomlySeed = 0;
var moved = false;
var animTime = 100;

gsockets.connect('http://numbereft.com', 9000);

gsockets.socket.on('connected', function(data){
	$('.id').val(data.socketID);
	s_id = data.socketID;
	$('.connecting').addClass('hide');
	$('.connected').removeClass('hide');
})

$('#challenge').on('click', function(){
	gsockets.send($('#opponent_id').val(), 'challenge', {socketID: s_id})
})

gsockets.on('challenge', function(data){
	if(!ingame && !local){
		gsockets.send(data.socketID, 'challenge_accept', {socketID: s_id});
		o_id = data.socketID
		console.log('ITS ON');
		$('.lobby').addClass('hide');
		$('.game').removeClass('hide');
		yourturn = true;
		$('.yourturn').removeClass('hide').addClass('team-1');
		$('.enemyturn').addClass('hide').addClass('team-2');
		ingame = true;
		yourteam = 1;
	}
	
})

gsockets.on('challenge_accept', function(data){
	o_id = data.socketID
	console.log('ITS ON');
	$('.lobby').addClass('hide');
	$('.game').removeClass('hide');
	$('.enemyturn').removeClass('hide').addClass('team-1');
	$('.yourturn').addClass('hide').addClass('team-2');
	ingame = true;
	yourteam = 2;
})

gsockets.on('move', function(data){
	//add_point(data.x,data.y);
	//grid = JSON.parse(data.grid);
	
	add_point(data.changed.x, data.changed.y);
	changed = data.changed;

	if(document.hidden) new Notification("Your turn in Chain Reaction");
	
	yourturn = true;
	$('.yourturn').removeClass('hide');
	$('.enemyturn').addClass('hide');
})

gsockets.onDisconnect(function(data){
	if(data.socketID == o_id) window.reload();
})

gsockets.on('message', function(data){
	var enemyteam = yourteam==1?2:1;

	$('.message').append('<div class="message">'+data.text+'</div>');
})

$('.chat button').on('click', function(){
	gsockets.send(o_id, 'message', {text: $('.chat .message').val()});
	$('.chat .message').val('');
})

$('#playlocal').on('click', function(){
	$('.chat').addClass('hide');
	$('.lobby').addClass('hide');
	$('.game').removeClass('hide');
	$('.enemyturn').removeClass('hide').addClass('team-1');
	$('.yourturn').addClass('hide').addClass('team-2');
	yourturn = true;
	yourteam = 1;
	local = true;
})

function create_grid(){
	// generate grid
	for(var y=0;y<h;y++){
		grid[y] = {};

		$('.grid').append('<div class="row"></div>');

		for(var x=0;x<w;x++){
			grid[y][x] = {
				value: 0,
				team: 0
			};

			$('.grid .row:last-child').append('<div class="cell" data-cell="'+x+'" data-row="'+y+'" data-team="" data-amount="0"></div>')

			if(x == 0 && y == 0 || x == w-1 && y == 0 ||
				y == h-1 && x == 0 || y == h-1 && x == w-1){

				$('.cell[data-cell="'+x+'"][data-row="'+y+'"]').attr('data-pos', 'corner');

			}else if(  (x == 0 || x == w-1) || (y == 0 || y == h-1)  ){
				$('.cell[data-cell="'+x+'"][data-row="'+y+'"]').attr('data-pos', 'edge');
			}else{
				$('.cell[data-cell="'+x+'"][data-row="'+y+'"]').attr('data-pos', 'open');
			}
		}
	}

	for(var i=0;i<randomlySeed*2;i++){
		var x = parseInt(Math.random()*w);
		var y = parseInt(Math.random()*h);

		add_point(x, y);
	}

	update_display();
}

create_grid();



//$('.row').css('height', (100/h)+'%');

$(document)
	//.css('width', (100/w)+'%')
	.on('click', '.cell', function(){
		var x = $(this).attr('data-cell');
		var y = $(this).attr('data-row');
		var thisteam = $(this).attr('data-team');

		if((thisteam == team || thisteam == '' || thisteam == '0') && !gameover && yourturn && !moved){
			moved = true;

			add_point(x,y);
			update_display();

			gsockets.send(o_id, 'move', {grid: JSON.stringify(grid), changed: changed})

			if(!local) yourturn = false;
			$('.enemyturn').removeClass('hide');
			$('.yourturn').addClass('hide');
		}else{
			console.log('Not your turn!');
		}
	})

function add_point(x,y){
	grid[y][x].value++;
	grid[y][x].team = team;
	changed = {x: x, y: y}

	$(this).attr('data-team', team).attr('data-amount', grid[y][x].value);
	//$(this).text(grid[y][x].value);

	turns++;

	react(x,y);
	setTimeout(function(){
		explode();
	}, animTime);
}

function react(x,y){

	// corner
	if(x == 0 && y == 0 || x == w-1 && y == 0 ||
	   y == h-1 && x == 0 || y == h-1 && x == w-1){

		if(grid[y][x].value > 1){
			exploding.push({x: x,y: y});
		}

	}else if(  (x == 0 || x == w-1) || (y == 0 || y == h-1)  ){
		if(grid[y][x].value > 2){
			exploding.push({x: x,y: y});
		}
	}else{
		if(grid[y][x].value > 3){
			exploding.push({x: x,y: y});
		}
	}

	//update_display();
}

function explode(){


	if(!exploding.length){
		team = team==1?2:1;

		moved = false;

		if(!local){
			
		}else{

			$('.yourturn').removeClass('hide');
			$('.enemyturn').addClass('hide');
		}

		update_display();

		return;
	}
	
	for(var i=0;i<exploding.length;i++){
		var x = exploding[i].x;
		var y = exploding[i].y;

		// above
		if(typeof grid[parseInt(y)-1] != 'undefined' && typeof grid[parseInt(y)-1][x] != 'undefined'){
			grid[parseInt(y)-1][x].value++;
			grid[parseInt(y)-1][x].team = team;
			grid[y][x].value--;

			$('.cell[data-cell="'+x+'"][data-row="'+(parseInt(y)-1)+'"]')
				.attr('data-amount', grid[parseInt(y)-1][x].value)
				.attr('data-team', team)
		}

		// below
		if(typeof grid[parseInt(y)+1] != 'undefined' && typeof grid[parseInt(y)+1][x] != 'undefined'){
			grid[parseInt(y)+1][x].value++;
			grid[parseInt(y)+1][x].team = team;
			grid[y][x].value--;

			$('.cell[data-cell="'+x+'"][data-row="'+(parseInt(y)+1)+'"]')
				.attr('data-amount', grid[parseInt(y)+1][x].value)
				.attr('data-team', team)
		}
		

		// left
		if(typeof grid[y] != 'undefined' && typeof grid[y][parseInt(x)-1] != 'undefined'){
			grid[y][parseInt(x)-1].value++;
			grid[y][parseInt(x)-1].team = team;
			grid[y][x].value--;

			$('.cell[data-cell="'+(parseInt(x)-1)+'"][data-row="'+y+'"]')
				.attr('data-amount', grid[y][parseInt(x)-1].value)
				.attr('data-team', team)
		}

		// right
		if(typeof grid[y] != 'undefined' && typeof grid[y][parseInt(x)+1] != 'undefined'){
			grid[y][parseInt(x)+1].value++;
			grid[y][parseInt(x)+1].team = team;
			grid[y][x].value--;

			$('.cell[data-cell="'+(parseInt(x)+1)+'"][data-row="'+y+'"]')
				.attr('data-amount', grid[y][parseInt(x)+1].value)
				.attr('data-team', team)
		}

		grid[y][x].value = 0;
		grid[y][x].team = 0;
	}

	exploding = [];

	// $('div[data-cell='+x+'][data-row='+y+']')
	// 	.attr('data-team', 0)
	// 	.attr('data-amount', 0)

	//update_display();

	if(turns > 2 && check_victory()){
		return;
	}else{
		for(var i=0;i<h;i++){
			for(var j=0;j<w;j++){
				react(j,i);
			}
		}
		setTimeout(function(){
			explode();
		}, animTime);
	}
}

function update_display(){

	$('.cell').removeClass('changed');
	$('.cell[data-cell='+changed.x+'][data-row='+changed.y+']').addClass('changed');

	for(var i=0;i<h;i++){
		for(var j=0;j<w;j++){
			$('div[data-cell='+j+'][data-row='+i+']')
				//.text(grid[i][j].value!=0?grid[i][j].value:'')
				.attr('data-team', grid[i][j].team)
				.attr('data-amount', grid[i][j].value)
		}
	}
}

function check_victory(){
	if(turns < 2) return false;

	var player_counts = {
		1: 0,
		2: 0
	};

	iterate(function(g,x,y){
		player_counts[g.team]++;
	})

	if(player_counts[1] == 0){
		victory(2);
		return true;
	}else if(player_counts[2] == 0){
		victory(1);
		return true;
	}else{
		return false;
	}
}

function victory(team){
	if(!gameover){
		$('.victory').removeClass('hide').text((team==1?'Blue':'Red')+' Wins!');
		gameover = true;
	}
}

function iterate(cb){
	for(var y=0;y<h;y++){ for(var x=0;x<w;x++){
		cb(grid[y][x],x,y);
	} }
}

$('#startover').on('click', function(){
	if(!local) gsockets.send(o_id, 'reset');
	reset();
})

gsockets.on('reset', function(){
	reset();
})

function reset(){
	gameover = false;
	grid = {};
	turns = 0;

	$('.victory').addClass('hide')

	$('.row').remove();

	create_grid();
}
