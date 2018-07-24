let request_string = '';

let sel_gamemode = 2, sel_bot_difficulty = 'easy', sel_teacup = 0, teacup_id;

function get_prolog_request(requestString, onSuccess, onError, port) {
    var requestPort = port || 8081
    var request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:'+requestPort+'/'+requestString, false);

    request.onload = onSuccess ||  function(data){console.log("Request successful. Reply: " + data.target.response);};
    request.onerror = onError || function(){console.log("Error waiting for response");};

    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    
    try {
        request.send();
    }
    catch(err) {
        swal({type: 'error', title: `Prolog communication unavailable!`, text:`The server didn't get any response from Prolog. Did you run SICstus?`});
    }
    return request.response;
}

function make_request(request) {           
    return this.get_prolog_request(request, this.handleReply); // Make request.
}

function handleReply(data){ 
    if (data.target.response == 'Syntax Error' || data.target.response == 'Bad Request') {
        swal('No game was found!', 'Set your gamemode and difficulty and touch the gong!', 'error')
        return;
    }
    return data.target.response;
}

window.addEventListener('keypress', (event) => {
    if (event.code == 'KeyF') {
        this.graph.scene.switch_root = !this.graph.scene.switch_root;

        if (this.graph.scene.switch_root)
            swal({type: 'info', title: 'Theme switched!', text:'Red theme selected.', timer: 1500});
        else
            swal({type: 'info', title: 'Theme switched!', text:'Blue theme selected.', timer: 1500});
    }

    if (event.code == 'KeyM') {
        play_movie_reel();
    }

    if (event.code == 'KeyT') {
        if (this.gamestate == undefined) {
            swal('No game found!', 'Set your gamemode and difficulty and touch the gong!', 'error')
            return;
        } 
        swal({type: 'info', title: `${60 - this.gamestate.turn_elapsed} seconds remaining!`, text:'Place a piece or else you\'ll automatically forfeit.'});
    }

    if (event.code == 'KeyS') {
        if (this.gamestate == undefined) {
            swal('No game found!', 'Set your gamemode and difficulty and touch the gong!', 'error')
            return;
        } 

        if (this.gamestate.black_score > this.gamestate.green_score)
            swal({type: 'info', title: `Black leads!`, text:`The majority marker tells you it's ${this.gamestate.black_score}-${this.gamestate.green_score}.`});

        else if (this.gamestate.green_score > this.gamestate.black_score)
            swal({type: 'info', title: `Green leads!`, text:`The majority marker tells you it's ${this.gamestate.black_score}-${this.gamestate.green_score}.`});

        else
            swal({type: 'info', title: `You're tied!`, text:`The majority marker tells you it's ${this.gamestate.black_score}-${this.gamestate.green_score}.`});
    } 

    if (event.code == 'KeyP') {
        let response = make_request('handshake');

        if (response == 'handshake')
            swal({type: 'success', title: `Prolog communication operational!`, text:`The server has successfully established Prolog communication and is ready for requests.`});
    }

});

/** GAME LOGIC **/

/**
 *  Stores information about the match's current state.
 *  @param this.board       Matrix (list of lists) board.
 *  @param this.majority    List with each index mapped to a table indicating its majority.
 *  @param this.markers     List with each index mapped to a table indicating its marker.
 *  @param this.turn        Char (either 'b' or 'g') indicative of current turn.
 *  @param this.waiter      Coordinates (pair) of waiter, first table then plate.
 *  @param this.gamemode    Gamemode selected for the current match.
 *  @param this.difficulty  Bot's difficulty ('easy' or 'normal') for the current match.
 **/
 class GameState {
    constructor(board, majority, markers, turn, waiter, gamemode, difficulty) {
        this.board = board;
        this.majority = majority;
        this.markers = markers;
        this.turn = turn;
        this.waiter = waiter;
        this.gamemode = gamemode;
        this.difficulty = difficulty;

        this.black_score = 0;
        this.green_score = 0;

        this.moves = new Array();

        this.turn_elapsed = 0;
        this.changed = 0;
    }
}

/**
 *  Stores information about the user's picked object.
 *  @param this.table_prolog    Selected table's index (1-9) for Prolog.
 *  @param this.table_pick      Selected table's picking ID.
 *  @param this.seat_id         Selected seat's index (1-9) for Prolog.
 *  @param this.seat_pick       Selected seat's picking ID.
 **/
 class Selection {
    constructor(table_id, table_pick, seat_id, seat_pick) {
        this.table_prolog = table_id;
        this.table_pick = table_pick;

        if (seat_id != undefined && seat_pick != undefined) {
            this.seat_prolog = seat_id;
            this.seat_pick = seat_pick;
        }
    }
}

/**
 *  Parses a Game object string and distributes it along the gamestate structure.
 **/
 function response_to_gamestate(game_object) {
    let flat_array = game_object.substring(2, 181).replace(/\[*\]*/g, '').split(','); // Flattens matrix.
    let board = new Array();

    for (let i = 0; i < 9; i++) {
        let board_column = flat_array.slice(i * 9, i * 9 + 9);
        board.push(board_column);
    }

    let majority = game_object.substring(183, game_object.indexOf('\]', 183)).replace(/\[*\]*/g, '').split(',');
    let markers = game_object.substring(203, game_object.indexOf('\]', 203)).replace(/\[*\]*/g, '').split(',');

    let turn = game_object[295];
    let waiter = game_object.substring(297, game_object.indexOf('\]', 297)).replace(/\[*\]*/g, '').split(',').map(Number);

    let gamemode = game_object[303];
    let difficulty = game_object.substring(305, game_object.length - 1);

    return new GameState(board, majority, markers, turn, waiter, gamemode, difficulty);
}

function second_response_to_gamestate(game_object) {
    let flat_array = game_object.substring(5, 184).replace(/\[*\]*/g, '').split(','); // Flattens matrix.
    let board = new Array();

    for (let i = 0; i < 9; i++) {
        let board_column = flat_array.slice(i * 9, i * 9 + 9);
        board.push(board_column);
    }

    let majority = game_object.substring(186, game_object.indexOf('\]', 186)).replace(/\[*\]*/g, '').split(',');
    let markers = game_object.substring(206, game_object.indexOf('\]', 206)).replace(/\[*\]*/g, '').split(',');

    let turn = game_object[298];
    let waiter = game_object.substring(300, game_object.indexOf('\]', 300)).replace(/\[*\]*/g, '').split(',').map(Number);

    let gamemode = game_object[306];
    let difficulty = game_object.substring(308, game_object.length - 2);

    return new GameState(board, majority, markers, turn, waiter, gamemode, difficulty);
}

/**
 *  Transforms a gamestate object and converts it to a string ready for request.
 **/
 function gamestate_to_request(gamestate) {

    // Board matrix conversion to string.
    let board_s = '[';
    gamestate.board.map((line) => {
        board_s = board_s.concat(`[${line.join()}]`);
    });
    board_s = board_s.replace(/\]\[/g, '\],\[');
    board_s += ']';
    
    let majority_s = `[${gamestate.majority.join()}]`; // Majority list conversion to string.
    let markers_s = '['; // Markers list conversion to string.

    gamestate.markers.map((line) => {
        markers_s = markers_s.concat(`\'${line}\'`);
    });
    markers_s = markers_s.replace(/\'\'/g, '\',\'');
    markers_s += ']';

    let waiter_s = `[${gamestate.waiter.join()}]`; // Waiter list conversion to string.
    return `[${board_s},${majority_s},${markers_s},${this.gamestate.turn},${waiter_s},${this.gamestate.gamemode},${this.gamestate.difficulty}]`;
}

function request_play_piece(seat_id) {
    let request = `game_loop(${gamestate_to_request(this.gamestate)},${seat_id})`;
    let response = make_request(request);
    let second = response_to_gamestate(response); 
    return second;
}

function retrieve_black_score() {
    let request = `get_score_black(${gamestate_to_request(this.gamestate)})`;
    let response = make_request(request);
    //let second = response_to_gamestate(response);
    return response;
}

function retrieve_green_score() {
    let request = `get_score_green(${gamestate_to_request(this.gamestate)})`;
    let response = make_request(request);
    //let second = response_to_gamestate(response);
    return response;
}

function play_bot_easy() {
    let request = `bot_play_easy(${gamestate_to_request(this.gamestate)})`;
    let response = make_request(request);
    return response;
}

function picking_hub(id) {
    let tables_pickings = [1, 11, 21, 31, 81, 41, 51, 71, 61];
    let seat_pickings = [
    [ 4, 3, 5, 6, 2, 7, 8,10, 9], [14,13,15,16,12,17,18,20,19], [24,23,25,26,22,27,28,30,29],
    [34,33,35,36,32,37,38,40,39], [84,83,85,86,82,87,88,90,89], [44,43,45,46,42,47,48,50,49],
    [54,53,55,56,52,57,58,60,59], [74,73,75,76,72,77,78,80,79], [64,63,65,66,62,67,68,70,69]
    ]

    let table_id, table_pick, seat_id, seat_pick;

    if (id == 0) {
        return;
    }
    else if (tables_pickings.includes(id)) {
        table_id = tables_pickings.indexOf(id) + 1; // Extracts table index.
        table_pick = tables_pickings[table_id - 1]; // Extracts table picking ID.

        console.log(`You've selected table ${table_id}.`);
    }

    // Sends START GAME Prolog request on gong click.
    else if (id == 91) {
        let response = make_request(`oolong(${sel_gamemode},${sel_bot_difficulty})`);
        this.gamestate = response_to_gamestate(response);
        swal({type: 'success', title: 'Match started!', text:'May the best tea manufacturer win.', timer:3000});
        this.graph.reset_teacups();

    }

    else if (id == 92) {
        swal({type: 'info', title: 'Gamemode set!', text:'The gamemode will be singleplayer.', timer:1500});
        sel_gamemode = id - 91;
    }

    else if (id == 93) {
        swal({type: 'info', title: 'Gamemode set!', text:'The gamemode will be multiplayer.', timer:1500});
        sel_gamemode = id - 91;
    }

    else if (id == 94) {
        swal({type: 'info', title: 'Gamemode set!', text:'The gamemode will be AI battle.', timer:1500});
        sel_gamemode = id - 91;
    }

    else if (id == 95) {
        swal({type: 'info', title: 'Difficulty set!', text:'The bot will be on the easy difficulty.', timer:1500});
        sel_bot_difficulty = 'easy';
    }

    else if (id == 96) {
        swal({type: 'info', title: 'Difficulty set!', text:'The bot will be on the normal difficulty.', timer:1500});
        sel_bot_difficulty = 'normal';
    }

    /**
     *  The game pieces are mapped as follows:
     *  - Black teacups: 97 to 136 (inclusive).
     *  - Green teacups: 137 to 176 (inclusive).
     **/
     else if (id >= 97 && id <= 176) {
        sel_teacup = id;

        for (let key in this.graph.nodes) {
            if (this.graph.nodes[key].picking_id == id)
                return this.graph.nodes[key];
        }
    }
    else {
        for (let i = 0; i < seat_pickings.length; i++) {
            table_id = i + 1; // Extracts table index.
            table_pick = tables_pickings[table_id - 1]; // Extracts table picking ID.

            if (seat_pickings[i].indexOf(id) != -1) {
                seat_id = seat_pickings[i].indexOf(id) + 1; // Extracts seat index.
                seat_pick = seat_pickings[i][seat_id - 1]; // Extracts seat picking ID.
                break;
            }
        }

        if (this.gamestate == undefined) {
            swal('No game was found!', 'Set your gamemode and difficulty and touch the gong!', 'error')
            return;
        }
        if (table_id != this.gamestate.waiter[0]) {
            swal({type: 'error', title: 'Invalid play!', text:`The waiter tells you people at table number #${this.gamestate.waiter[0]} are thirsty...`, timer:3000});
            return;
        }

        console.log(`You've selected seat ${seat_id} from table ${table_id}.`);

        if (sel_teacup == undefined) {
            swal('Which piece?', 'Select a teacup before choosing a table!', 'warning');
            return;
        }

        let new_board = request_play_piece(seat_id);
        

        let differences = get_diff_board(new_board.board, this.gamestate.board);
        this.gamestate.turn_elapsed = 0;
        
        this.gamestate = new_board;

        if (differences[0] == undefined) {
            swal('No game was found!', 'Set your gamemode and difficulty and touch the gong!', 'error')
            return;
        }
        this.gamestate.changed = differences[0].changed;

        let score_black = retrieve_black_score();
        let score_green = retrieve_green_score();

        if (score_black != this.gamestate.black_score) {
            swal({type: 'info', title: 'Table claimed!', text:`Black player claimed majority on a table!\nThe score's ${score_black}-${score_green}.`});
            this.gamestate.black_score = score_black;
        }
        
        else if (score_green != this.gamestate.green_score) {
            swal({type: 'info', title: 'Table claimed!', text:`Green player claimed majority on a table!\nThe score's ${score_black}-${score_green}.`});
            this.gamestate.green_score = score_green;
        }

        let cup_animation = create_new_animation(sel_teacup, id);
        this.gamestate.moves.push(cup_animation);

        sel_teacup = undefined;
    }
    return new Selection(table_id, table_pick, seat_id, seat_pick);
}

/**
 *  Returns an array with the differences between the previous and the next boards.
 **/
 function get_diff_board(new_board, old_board) { 
    let differences = [];

    for (let i = 0; i < old_board.length; i++) {
        for (let j = 0; j < old_board[i].length; j++) {

            if (old_board[i][j] != new_board[i][j]) {
                //if((i + 1) == gamestate.waiter[0])
                let picking_dict = get_picking_id(i, j);
                differences.push({table_prolog: i+1, seat_prolog: j+1, table_picking: picking_dict['table'], seat_picking: picking_dict['seat'], changed: 1});
            }
        }
    }
    return differences;
}

function get_picking_id(table, seat) {
    let tables_pickings = [1, 11, 21, 31, 81, 41, 51, 71, 61];
    let seat_pickings = [
    [ 4, 3, 5, 6, 2, 7, 8,10, 9], [14,13,15,16,12,17,18,20,19], [24,23,25,26,22,27,28,30,29],
    [34,33,35,36,32,37,38,40,39], [84,83,85,86,82,87,88,90,89], [44,43,45,46,42,47,48,50,49],
    [54,53,55,56,52,57,58,60,59], [74,73,75,76,72,77,78,80,79], [64,63,65,66,62,67,68,70,69]
    ];
    return {table: tables_pickings[table], seat: seat_pickings[table][seat]};
}

/**
 *  Establishes a pointer between MySceneGraph.js and GameLoop.js.
 **/
 function save_graph(graph) {
    this.graph = graph;
}



/**
 *  Returns a new bezier curve which will serve as animation for the selected game piece.
 *  The curve is a parabola between the auxiliary table and the final board position.
 **/
 function create_new_animation(teacup, table) {
    let selected_teacup, selected_table, teacup_coords, table_coords;

    // Extracts node from picking ID given on arguments.
    for (let key in this.graph.nodes) {
        if (this.graph.nodes[key].picking_id == teacup)
            selected_teacup = this.graph.nodes[key];

        if (this.graph.nodes[key].picking_id == table)
            selected_table = this.graph.nodes[key];
    }

    // Extracts relative coordinates of nodes.
    for (let i = 0; i < this.graph.all_teacups.length; i++) {
        if (this.graph.all_teacups[i].id == selected_teacup.nodeID){
            teacup_coords = this.graph.all_teacups[i];
            teacup_id = teacup_coords.index;
        }
    }

    for (let i = 0; i < this.graph.all_seats.length; i++) {
        if (this.graph.all_seats[i].id == selected_table.nodeID)
            table_coords = this.graph.all_seats[i];
    }

    if (teacup_coords == undefined)
        return;

    let p1 = {x: 0, y: 0, z: 0};
    let p2 = {x: 0, y: 15, z: 0};
    let p3 = {x: table_coords.x - teacup_coords.x, y: table_coords.y - teacup_coords.y + 15, z: table_coords.z - teacup_coords.z};
    let p4 = {x: table_coords.x - teacup_coords.x, y: table_coords.y - teacup_coords.y, z: table_coords.z - teacup_coords.z};

    let final_animation = new BezierAnimation([p1, p2, p3, p4], 4);

    selected_teacup.animations = [final_animation];
    return {node: selected_teacup, animation: final_animation};
}

 function increment_second() {

    if (this.gamestate == undefined)
        return;

    if (this.gamestate.turn_elapsed == 30)
        swal({type: 'warning', title: '30 seconds remaining!', text:'Place a piece or else you\'ll automatically forfeit.', timer:3000});

    if (this.gamestate.turn_elapsed == 50)
        swal({type: 'warning', title: '10 seconds remaining!', text:'Place a piece or else you\'ll automatically forfeit.', timer:3000});

    if (this.gamestate.turn_elapsed < 60)
        this.gamestate.turn_elapsed++;

    if (this.gamestate.turn_elapsed >= 60) {
        swal({type: 'success', title: 'Game completed!', text:'You ran out of time...'});
        this.gamestate.turn_elapsed = 0;
    }
}

function play_movie_reel() {
    if (this.gamestate == undefined || this.gamestate.moves.length == 0) {
        swal('No movie found!', `No saved moves found! Did you start a match?`, 'error');
        return;
    }

    this.graph.reset_teacups();

    for (let i = 0; i < this.gamestate.moves.length; i++) {
        this.gamestate.moves[i].node.animations[0].completed = false;
    }

}

function play_bot(){
    let response = play_bot_easy();

    let table_bot = this.gamestate.waiter[0] - 1;
    let seat_bot = response[1];
    
    let pick_info_bot = get_picking_id(table_bot, seat_bot);

    //create_new_animation(this.graph.green_index + 137, pick_info_bot.seat);
    this.graph.move_bot_teacup(pick_info_bot);

    let second = second_response_to_gamestate(response);

    let seat_final = parseInt(seat_bot);

    this.gamestate = second;
    this.gamestate.waiter[0] = seat_final + 1;
    
}