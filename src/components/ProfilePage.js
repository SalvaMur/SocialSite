import React, { useContext, useEffect, useState } from 'react';

// Import context from parent component
import { UserContext } from '../Site';

// Import stylesheet and components
import Post from './Post';

const initialProfile = {
	username: null,
	profilePic: null,
	firstName: null,
	lastName: null,
	birthdate: null,
	bio: null,
	numFollowers: 0,
	numFollowing: 0
};

function ProfilePage() {
	const [profile, setProfile] = useState(initialProfile);
	const [myposts, setMyPosts] = useState([]);
	const { sessionID } = useContext(UserContext);
	const imagepath = (profile.profilePic == null) ? null : `http://${window.location.hostname}:3001/userPics/${profile.profilePic}`;

	// Get user's information for profile page
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
				numFollowers,
				numFollowing
			});
		};

		const postsReq = new XMLHttpRequest();
		postsReq.open('POST', `http://${window.location.hostname}:3001/userposts`);
		postsReq.setRequestHeader('Content-Type', 'application/json');
		postsReq.onload = function() {
			setMyPosts(JSON.parse(this.response));
		};
		
		profileReq.send(JSON.stringify({userID: sessionID}));
		postsReq.send(JSON.stringify({userID: sessionID}));
	}, []);

	return (
		<div>
			<p>PROFILE PAGE</p>
			<p>SessionID: {sessionID}</p>
			<img src={imagepath} />
			<p>Username: {profile.username}</p>
			<p>First name: {profile.firstName}</p>
			<p>Last name: {profile.lastName}</p>
			<p>Age: {profile.age}</p>
			<p>Followers: {profile.numFollowers}</p>
			<p>Following: {profile.numFollowing}</p>
			<p>Bio: {profile.bio}</p>

			<br/>

			<p>MY POSTS</p>
			<div>
				{
					(myposts.length == 0) ? <p>NO POSTS</p> :
					myposts.map((key) => {
						return (
							<div key={key.postID} className='postContainer'>
								<Post data={key} />
							</div>
							
						);
					})
				}
			</div>
		</div>
	);
}

export default ProfilePage;