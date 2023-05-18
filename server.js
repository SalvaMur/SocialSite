const mysql = require('mysql');
const express = require('express');
const socketIO = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create and edit .env config for MySQL DB connection info
require('dotenv').config();

// MySQL DB connection info
const conn = mysql.createConnection({
	host: process.env.HOST,
	user: process.env.USER,
	password: process.env.PASSWORD,
	database: process.env.DATABASE
});

// Connect to MySQL DB
conn.connect((err) => {
	if (err) {
		console.log('[ERROR]: Connection to MySQL DB failed');
		process.exit(1);
	}

	console.log('Connected to MySQL DB');
});

// Directories that hold user's image media. Saved locally on computer running 'server.js'
const postImgDir = multer({ dest: 'img/post/' });
const userImgDir = multer({ dest: 'img/user/' });

// Port numbers and domain for server and client
const sPort = 3001;
const cPort = 3000;
const cDomain = process.env.CLIENTHOST;

// Initialize seperate servers for front-end and back-end
const serverSide = express();
const clientSide = express();

// Allow requests to be received from clientside
serverSide.use(cors({
	origin: [`http://localhost:${cPort}`, `http://${cDomain}:${cPort}`]
}));

// Give serverside ability to read JSON queries
serverSide.use(bodyParser.urlencoded({ extended: false }));
serverSide.use(bodyParser.json());

// Clientside will host webpage
clientSide.use(express.static('build')); // NOTE: Comment out while developing. Uncomment for final build

// Handle GET requests for 
clientSide.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, 'build/index.html'));
});

// Start serverside
serverSide.listen(sPort, () => {
	console.log(`Server running on port ${sPort}`);
});

// Start clientside and get server for web socket
const server = clientSide.listen(cPort, () => {
	console.log(`Client server running on port ${cPort}`);
});

// Initialize web socket for client side
const io = socketIO(server); // Use websocket to emit changes done by users

// Handle GET requests from client
serverSide.get('/action', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	res.end('HOWDY');
});

// Handle registration queries
serverSide.post('/register', userImgDir.single('image'), (req, res) => {
	const resPacket = {};
	const { firstName, lastName, birthdate, username, password } = req.body;
	const filename = (req.file) ? req.file.filename : 'default.jpg';

	const today = new Date();
	const bio = `Hi, I registered on ${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}.`;

	conn.query(
		`insert into users (firstName, lastName, birthdate, profilePic, username, password, bio, numFollowers, numFollowing) 
		values (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
		[firstName, lastName, birthdate, filename, username, password, bio], 
		(err) => {
			// Username already taken
			if (err && err.errno == 1062) {
				console.log(`[DUPLICATE]: @${username} already taken`);
				resPacket.isRegistered = false;
				resPacket.errno = 200;

				// Remove file uploaded to 'user' directory
				if (filename !== 'default.jpg') {
					fs.unlink(
						req.file.path,
						(err) => {
							if (err) { 
								console.log('[ERROR]: Could not unlink uploaded file');
							}
						}
					);
				}
			}

			// Generic error
			else if (err) {
				console.log(`[ERROR]: Could not register @${username}`);
				resPacket.isRegistered = false;
				resPacket.errno = 100;

				// Remove file uploaded to 'user' directory
				if (filename !== 'default.jpg') {
					fs.unlink(
						req.file.path,
						(err) => {
							if (err) { 
								console.log('[ERROR]: Could not unlink uploaded file');
							}
						}
					);
				}
			}

			// User successfully registered
			else {
				console.log(`Registered user @${username}`);
				resPacket.isRegistered = true;
				resPacket.errno = 0;
			}

			// Send response packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resPacket));
		}
	);
});

// Handle login queries
serverSide.post('/login', (req, res) => {
	const resPacket = {};
	const { username, password } = req.body;

	conn.query(
		'select userID from users where username = ? and password = ?',
		[username, password],
		(err, result) => {
			// Generic error
			if (err) {
				console.log(`[ERROR]: Could not login @${username}`);
				resPacket.isValid = false;
				resPacket.errno = 100;
				resPacket.sessionID = null;
			}

			// Username or password is not in MySQL DB
			else if (!err && result.length == 0) {
				console.log(`[ERROR]: Could not find @${username}`);
				resPacket.isValid = false;
				resPacket.errno = 300;
				resPacket.sessionID = null;
			}

			// Username and password found
			else {
				console.log(`User @${username} logged in`);
				resPacket.isValid = true;
				resPacket.errno = 0;
				resPacket.sessionID = (result[0].userID);
			}

			// Send response packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resPacket));
		}
	);
});

// Handle fetch of users followed by requesting user
serverSide.post('/getfollowers', (req, res) => {
	const users = {};
	const { sessionID } = req.body;

	conn.query(
		`select f.userID, u.username
		from followers as f
		join users as u
		on u.userID = f.userID
		where f.followerID = ?`,
		[sessionID],
		(err, results) => {
			if (err) {
				console.log('[ERROR]: Could not get users followed');
			}

			else {
				results.forEach((row) => {
					users[row.userID] = row.username;
				});
			}

			// Send users followed
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(users));
		}
	);
});

// Handle follow requests
serverSide.post('/follow', (req, res) => {
	const resPacket = {};
	const { followerID, userID } = req.body;

	conn.beginTransaction(() => {
		// Insert follower relation in Followers table
		conn.query(
			`insert into followers (followerID, userID)
			values (?, ?)`,
			[followerID, userID]
		);

		// Increase the number of users followed for follower
		conn.query(
			`update users
			set numFollowing = numFollowing + 1
			where userID = ?`,
			[followerID]
		);

		// Increase the number of followers for user
		conn.query(
			`update users
			set numFollowers = numFollowers + 1
			where userID = ?`,
			[userID]
		);

		// Submit changes to MySQL DB
		conn.commit((err) => {
			if (err) {
				console.log('[ERROR]: Could not commit transaction');
				resPacket.isFollowed = false;
				resPacket.errno = 100;
			}

			else {
				resPacket.isFollowed = true;
				resPacket.errno = 0;
			}

			// Send response packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resPacket));
		});
	});
});

// Handle unfollow requests
serverSide.post('/unfollow', (req, res) => {
	const resPacket = {};
	const { followerID, userID } = req.body;

	conn.beginTransaction(() => {
		// Remove follower relation in Followers table
		conn.query(
			`delete from followers
			where followerID = ? and userID = ?`,
			[followerID, userID]
		);

		// Decrement the number of users followed for follower
		conn.query(
			`update users
			set numFollowing = numFollowing - 1
			where userID = ?`,
			[followerID]
		);

		// Decrement the number of followers for user
		conn.query(
			`update users
			set numFollowers = numFollowers - 1
			where userID = ?`,
			[userID]
		);

		// Submit changes to MySQL DB
		conn.commit((err) => {
			if (err) {
				console.log('[ERROR]: Could not commit transaction');
				resPacket.isUnfollowed = false;
				resPacket.errno = 100;
			}

			else {
				resPacket.isUnfollowed = true;
				resPacket.errno = 0;
			}

			// Send response packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resPacket));
		});
	});
});

// Handle creation of user's post
serverSide.post('/post', postImgDir.single('image'), (req, res) => {
	const resPacket = {};
	const { content, sessionID, postedOn } = req.body;
	const { filename } = req.file;

	conn.query(
		`insert into posts (by_userID, postedOn, content, imageURL)
		values (?, ?, ?, ?)`,
		[sessionID, new Date(postedOn), content, filename],
		(err, result) => {
			if (err) {
				console.log('[ERROR]: Could not insert post into Posts');
				resPacket.isUploaded = false;
				resPacket.errno = 100;
				
				// Remove file uploaded to 'post' directory
				fs.unlink(
					req.file.path,
					(err) => {
						if (err) { 
							console.log('[ERROR]: Could not unlink uploaded file');
						}
					}
				);
			}

			// Successfully inserted post into table Posts
			else {
				// Broadcast insertion to all users
				conn.query(
					`select u.username, u.profilePic, p.*
					from posts as p
					join users as u
					on p.by_userID = u.userID
					where p.postID = ?`,
					[result.insertId],
					(err, result) => {
						io.emit(`userpost-${sessionID}`, result[0]); // For user page
						io.emit('newpost', result[0]); // For activity
					}
				);

				resPacket.isUploaded = true;
				resPacket.errno = 0;
			}

			// Send response packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resPacket));		
		}
	);
});

// Handle post page fetching
serverSide.post('/getpost', (req, res) => {
	let data = {};
	const { postID } = req.body;

	conn.query(
		`select u.username, u.profilePic, p.*
		from posts as p
		join users as u
		on p.by_userID = u.userID
		where p.postID = ?`,
		[postID],
		(err, result) => {
			if (err) {
				console.log('[ERROR]: Could not resolve query');
				data = {
					by_userID: null,
					username: null,
					profilePic: null,
					content: null,
					imageURL: null,
					postedOn: null,
				};
			}

			else {
				const { by_userID, username, profilePic, content, imageURL, postedOn } = result[0];
				data = {
					by_userID: by_userID,
					username: username,
					profilePic: profilePic,
					content: content,
					imageURL: imageURL,
					postedOn: postedOn,
				}
			}

			// Send data packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(data));
		}
	);
});

// Handle comment post requests
serverSide.post('/comment', (req, res) => {
	const resPacket = {};
	const { postID, userID, commentedOn, comment } = req.body;

	conn.query(
		`insert into comments (postID, userID, commentedOn, comment)
		values (?, ?, ?, ?)`,
		[postID, userID, new Date(commentedOn), comment],
		(err, result) => {
			if (err) {
				console.log('[ERROR]: Could not post comment');
				resPacket.isUploaded = false;
				resPacket.errno = 100;
			}

			else {
				// Broadcast insertion to all users
				conn.query(
					`select c.*, u.username, u.profilePic
					from comments as c
					join users as u
					on u.userID = c.userID
					where c.commentID = ?`,
					[result.insertId],
					(err, result) => {
						io.emit(`newcomment-${postID}`, result[0]);
					}
				);

				resPacket.isUploaded = true;
				resPacket.errno = 0;
			}

			// Send response packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(resPacket));
		}
	);
});

// Handle comment fetching
serverSide.post('/getcomments', (req, res) => {
	const comments = [];
	const { postID } = req.body;

	conn.query(
		`select c.*, u.username, u.profilePic
		from posts as p
		join comments as c
		on p.postID = c.postID
		join users as u
		on u.userID = c.userID
		where p.postID = ?
		order by commentedOn desc`,
		[postID],
		(err, results) => {
			if (err) {
				console.log('[ERROR]: Could not get post\'s comments');
			}

			else {
				results.forEach((row) => {
					comments.push(row);
				});
			}

			// Send posts
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(comments));
		}
	);
});

// Handle profile information fetching
serverSide.post('/profile', (req, res) => {
	let data = {};
	const { userID } = req.body;

	conn.query(
		'select username, profilePic, firstName, lastName, birthdate, bio, numFollowers, numFollowing from users where userID = ?',
		[userID],
		(err, result) => {
			if (err) {
				console.log('[ERROR]: Could not resolve query');
				data = {
					errno: 100,
					username: null,
					profilePic: null,
					firstName: null,
					lastName: null,
					birthdate: null,
					bio: null,
					numFollowers: 0,
					numFollowing: 0
				};
			}

			else {
				const { username, profilePic, firstName, lastName, birthdate, bio, numFollowers, numFollowing } = result[0];
				data = {
					errno: 0,
					username: username,
					profilePic: profilePic,
					firstName: firstName,
					lastName: lastName,
					birthdate: birthdate,
					bio: bio,
					numFollowers: numFollowers,
					numFollowing: numFollowing
				};
			}

			// Send data packet
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(data));
		}
	);
});

// Handle user posts fetching
serverSide.post('/userposts', (req, res) => {
	const posts = [];
	const { userID } = req.body;

	conn.query(
		`select u.username, u.profilePic, p.*
		from posts as p
		join users as u
		on p.by_userID = u.userID
		where u.userID = ?
		order by postedOn desc`,
		[userID],
		(err, results) => {
			if (err) {
				console.log('[ERROR]: Could not get user\'s posts');
			}

			else {
				results.forEach((row) => {
					posts.push(row);
				});
			}

			// Send posts
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(posts));
		}
	);
});

// Handle get requests from activity. Return posts sorted by post date
serverSide.get('/activity', (req, res) => {
	const posts = [];

	conn.query(
		`select u.username, u.profilePic, p.*
		from posts as p
		join users as u
		on p.by_userID = u.userID
		order by postedOn desc`,
		(err, results) => {
			if (err) {
				console.log('[ERROR]: Could not get posts');
			}

			else {
				results.forEach((row) => {
					posts.push(row);
				});
			}

			// Send posts
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(posts));
		}
	);
});

// Handle profile image fetching
serverSide.get('/userPics/:imageID', (req, res) => {
	const filename = req.params.imageID;
	res.sendFile(`img/user/${filename}`, {root: __dirname});
});

// Handle post image fetching
serverSide.get('/posts/:imageID', (req, res) => {
	const filename = req.params.imageID;
	res.sendFile(`img/post/${filename}`, {root: __dirname});
});