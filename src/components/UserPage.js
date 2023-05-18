import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

// Import context from parent component
import { UserContext } from '../Site';

// Import stylesheet and components
import Post from './Post';

const socket = io(`http://${window.location.host}`);

const initialProfile = {
	username: null,
	profilePic: null,
	firstName: null,
	lastName: null,
	birthdate: null,
	bio: null,
	numFollowers: 0,
	numFollowing: 0,
};

function UserPage() {
	const [profile, setProfile] = useState(initialProfile);
	const [myposts, setMyPosts] = useState([]);
	const { sessionID, following, setFollowing } = useContext(UserContext);
	const { userID } = useParams();
	const imagepath = (profile.profilePic == null) ? null : `http://${window.location.hostname}:3001/userPics/${profile.profilePic}`;

	// Get user's information for user page
	useEffect(() => {
		const profileReq = new XMLHttpRequest();
		profileReq.open('POST', `http://${window.location.hostname}:3001/profile`);
		profileReq.setRequestHeader('Content-Type', 'application/json');
		profileReq.onload = function() {
			const { errno, username, profilePic, firstName, lastName, birthdate, bio, numFollowers, numFollowing } = JSON.parse(this.response);
			
			// Guard against errors
			if (errno != 0) {
				console.log('[ERROR]: Could not get profile data');
				return;
			}

			// Determine age of user
			let age = 0;
			const today = new Date();
			const birthday = new Date(birthdate);
			if (today.getMonth() > birthday.getMonth()) {
				age = today.getFullYear() - birthday.getFullYear();
			}

			else if (today.getMonth() < birthday.getMonth()) {
				age = today.getFullYear() - birthday.getFullYear() - 1;
			}

			else if (today.getMonth() == birthday.getMonth()) {
				if (today.getDate() < birthday.getDate()) {
					age = today.getFullYear() - birthday.getFullYear() - 1;
				}

				else if (today.getDate() >= birthday.getDate()) {
					age = today.getFullYear() - birthday.getFullYear();
				}
			}

			setProfile({
				username: username,
				profilePic: profilePic,
				firstName: firstName,
				lastName: lastName,
				age: age,
				bio: bio,
				numFollowers: numFollowers,
				numFollowing: numFollowing
			});
		};

		const postsReq = new XMLHttpRequest();
		postsReq.open('POST', `http://${window.location.hostname}:3001/userposts`);
		postsReq.setRequestHeader('Content-Type', 'application/json');
		postsReq.onload = function() {
			setMyPosts(JSON.parse(this.response));
		};

		profileReq.send(JSON.stringify({userID: userID}));
		postsReq.send(JSON.stringify({userID: userID}));
	}, []);

	// Refresh userpage with live posting
	useEffect(() => {
		socket.on(`userpost-${userID}`, (post) => {
			setMyPosts((pastposts) => [post, ...pastposts]);
		});

		return () => {
			socket.off(`userpost-${userID}`);
		}
	}, [myposts]);

	// Handle follow button being pressed
	function follow() {
		const followReq = new XMLHttpRequest();
		followReq.open('POST', `http://${window.location.hostname}:3001/follow`);
		followReq.setRequestHeader('Content-Type', 'application/json');
		followReq.onload = function() {
			const { isFollowed, errno } = JSON.parse(this.response);

			// Hanlde generic error
			if (!isFollowed) {
				alert('Could not follow user, try again later');
				return;
			}

			// Update user's followed users
			const newFollowing = {...following};
			newFollowing[userID] = profile.username;
			setFollowing(newFollowing);

			// Update followers number
			const newProfile = {...profile};
			newProfile.numFollowers += 1;
			setProfile(newProfile);

			alert(`Followed ${profile.username}`);
		}

		followReq.send(JSON.stringify({followerID: sessionID, userID: userID}));
	}

	// Handle unfollow button being pressed
	function unfollow() {
		const followReq = new XMLHttpRequest();
		followReq.open('POST', `http://${window.location.hostname}:3001/unfollow`);
		followReq.setRequestHeader('Content-Type', 'application/json');
		followReq.onload = function() {
			const { isUnfollowed, errno } = JSON.parse(this.response);

			// Handle generic error
			if (!isUnfollowed) {
				alert('Could not unfollow user, try again later');
				return;
			}

			// Update user's followed users
			const newFollowing = {...following};
			delete newFollowing[userID];
			setFollowing(newFollowing);
			
			// Update followers number
			const newProfile = {...profile};
			newProfile.numFollowers -= 1;
			setProfile(newProfile);

			alert(`Unfollowed ${profile.username}`);
		}

		followReq.send(JSON.stringify({followerID: sessionID, userID: userID}));
	}

	function FollowBtn() {
		if (userID in following) {
			return (
				<button onClick={unfollow}>UNFOLLOW</button>
			);
		}

		else {
			return (
				<button onClick={follow}>FOLLOW</button>
			);
		}
	}

	return (
		<div>
			<p>USER'S PAGE</p>
			<p>USER ID: {userID}</p>
			<img src={imagepath} />
			<p>Username: {profile.username}</p>

			<FollowBtn />

			<p>First name: {profile.firstName}</p>
			<p>Last name: {profile.lastName}</p>
			<p>Age: {profile.age}</p>
			<p>Followers: {profile.numFollowers}</p>
			<p>Following: {profile.numFollowing}</p>
			<p>Bio: {profile.bio}</p>

			<br/>

			<p>USER'S POSTS</p>
			<div>
				{
					(myposts.length == 0) ? <p>NO POSTS</p> :
					myposts.map((key) => {
						return (<Post key={key.postID} data={key} />);
					})
				}
			</div>
		</div>
	);
}

export default UserPage;