const mysql = require('mysql');

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

// Execute several queries to initialize tables
conn.beginTransaction((err) => {
	if(err) {
		console.log('[ERROR]: Could not resolve transaction');
		throw err;
	}

	// Create table to hold users' posts if it does not exist already
	conn.query(
		`create table if not exists posts(
			postID int primary key auto_increment,
			by_userID int not null,
			postedOn datetime,
			content text,
			imageURL text
		);`, (err) => {
			if (err) {
				console.log('[ERROR]: Cannot create Posts table');
				throw err;
			}

			console.log('Posts table exists in MySQL DB');
		}
	);

	// Create table to hold users if it does not exist already
	conn.query(
		`create table if not exists users(
			userID int primary key auto_increment,
			username varchar(255) unique,
			profilePic text,
			password varchar(8),
			firstName varchar(255),
			lastName varchar(255),
			birthdate date,
			bio text,
			numFollowers int,
			numFollowing int
		);`, (err) => {
			if (err) {
				console.log('[ERROR]: Cannot create Users table');
				throw err;
			}

			console.log('Users table exists in MySQL DB');
		}
	);

	// Create table to hold follower relations if it does not exist already
	conn.query(
		`create table if not exists followers(
			userID int not null,
			followerID int not null,

			primary key (userID, followerID),
			foreign key (userID) references users(userID),
			foreign key (followerID) references users(userID)
		);`, (err) => {
			if (err) {
				console.log('[ERROR]: Cannot create Followers table');
				throw err;
			}

			console.log('Followers table exists in MySQL DB');
		}
	);

	// Create table to hold comments on a post if it does not exist already
	conn.query(
		`create table if not exists comments(
			commentID int primary key auto_increment,
			postID int not null,
			userID int not null,
			commentedOn datetime,
			comment text,

			foreign key (postID) references posts(postID),
			foreign key (userID) references users(userID)
		);`, (err) => {
			if (err) {
				console.log('[ERROR]: Cannot create Comments table');
				throw err;
			}

			console.log('Comments table exists in MySQL DB');
		}
	);

	// Add FK_byUser constraint to Posts
	conn.query(
		`alter table Posts
		add constraint FK_byUser foreign key (by_userID) references users(userID)`,
		(err) => {
			if (err && err.errno == 1826) {
				console.log('[DUPLICATE]: Constraint already in Posts table');
			}
			else if (err) {
				console.log('[ERROR]: Could not add FK_byUser constraint');
				throw err;
			}
		}
	);

	conn.commit((err) => {
		if (err) {
			console.log('[ERROR: Could not commit changes');
			throw err;
		}
	});

	// End connection to MySQL DB once queries finishes
	conn.end((err) => {
		if (err) {
			console.log('[ERROR]: Could not end connection');
			throw err;
		}
	
		console.log('MySQL DB initialization complete, now ending connection');
	});
});