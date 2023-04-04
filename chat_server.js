// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const file = "client.html";
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, res) {
    // This callback runs when a new connection is made to our HTTP server.
    fs.readFile(file, function (err, data) {
        // This callback runs when the client.html file has been read from the filesystem.

        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(port);

let allRooms = []; 
let allRoomsAndOwners = {};
let allUsernames = [];
let allRoomsAndUsers = {};
let allUsersAndSockets = {};

// to list out people in rooms
// for each user check what room

// To kick someone
// let kickingPersonsSocket = allUsersAndSockets[(username of person were kicking)];
// kickingPersonsSocket.leave(allUsersAndRooms['username']);

// adding socket to dict
// after a .join
// allUsersAndSockets.append({username: socket})

//if user joins back into a room that they created, it should change the delete button to allow them to delete that room

//they can only delete if they "own" the room


// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.on("connection", function (socket) {
    socket.emit("rooms_to_client", allRooms); // broadcast the message to other users

    // This callback runs when a new Socket.IO connection is established.
    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        // one join is enough
        //socket.join(data["room"]);
        console.log("username: " + data["username"] + " message: " + data["message"] + " room: " + data["room"]); // log it to the Node.JS output
        // socket vs io.sockets vs io. vs socketsio?
        // .to(data["room"])
        io.to(data["room"]).emit("message_to_client", data) // broadcast the message to other users
    });

    socket.on('newUser', function (username) {
        const regEx = /[a-zA-Z]/; 
        console.log("hello"+username); 
        //if (!regEx.test(username) ||) 
        if (allUsernames.includes(username) || !regEx.test(username) || username == null) {
            console.log("username"+username); 
            socket.emit("username_to_client", false);
        } else {
            console.log("usernameelse:"+username); 
            socket.emit("username_to_client", true);
        }
    }) 

    socket.on("newRoom_to_server", function (data){
        if (!allRooms.includes(data["roomName"])) {
            socket.join(data["roomName"]);
            console.log(`User ${data["owner"]} created room ${data["roomName"]}`);
            allRooms.push(data["roomName"]);
            allRoomsAndOwners[data["roomName"]] = data["owner"];
            //allRoomsAndUsers.data["roomName"].push(data["owner"]);
            io.emit("newRoom_to_client", {roomName:data["roomName"], allRooms: allRooms});
            socket.emit("room_to_client", {roomName:data["roomName"], allRoomsAndUsers:allRoomsAndUsers});
            socket.emit("createDelete", data["roomName"]);
        }
    });

    socket.on("roomName_to_server", function (data) {
        if (allRooms.includes(data["roomName"])) {
            socket.leave(data["oldRoom"]);
            socket.join(data["roomName"]);
            console.log(`User ${data["username"]} joined room ${data["roomName"]}`);
           // allRoomsAndUsers.data["roomName"].push(data["username"])
            socket.emit("room_to_client", {roomName:data["roomName"], allRoomsAndUsers:allRoomsAndUsers});
            if (allRoomsAndOwners[data["roomName"]] == data['username']) {
                socket.emit("createDelete", data["roomName"]);
            }
        }
    });

    
    // needs work
    socket.on("delete_room", function(roomName) {
        //kick all users in room out and bring them back to homepage
        
        let newAllRooms = [];
        for(let i=0; i <allRooms.length; i++) {
            if (allRooms[i] != roomName) {
                newAllRooms.push(allRooms[i]);
            }
        }
        allRooms = newAllRooms;
        // how to make all sockets leave?
        //io.leave(roomName);
        io.emit("deletionCompleted", {message:roomName + "has been deleted", allRooms:allRooms});
        io.emit("rooms_to_client", allRooms);
    });


});