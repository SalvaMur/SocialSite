import React, { useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Import context from parent component
import { UserContext } from '../Site';

// Import stylesheet and components
import '../styles/ActivityPage.css'
import PostHeader from './PostHeader';
import Post from './Post';

const socket = io(`http://${window.location.host}`);

function ActivityPage() {
	const [posts, setPosts] = useState([]);
	const { sessionID, following } = useContext(UserContext);

	// Get DB posts for activity page
	useEffect(() => {
		const activityReq = new XMLHttpRequest();
		activityReq.open('GET', `http://${window.location.hostname}:3001/activity`);
		activityReq.onload = function() {
			setPosts(JSON.parse(this.response));
		};

		activityReq.send();
	}, []);

	// Refresh activity with live posting
	useEffect(() => {
		socket.on('newpost', (post) => {
			setPosts((pastposts) => [post, ...pastposts]);
		});

		return () => {
			socket.off('newpost');
		}
	}, [posts]);

	function createPost(e) {
		e.preventDefault();

		// Prepare post form data
		const form = new FormData(e.target);
		form.append('sessionID', sessionID);
		form.append('postedOn', (new Date()).toISOString());

		// Send post creation request, and handle response
		const postRequest = new XMLHttpRequest();
		postRequest.open('POST', `http://${window.location.hostname}:3001/post`);
		postRequest.onload = function() {
			const { isUploaded, errno } = JSON.parse(this.response);

			// Handle if post was not uploaded
			if (!isUploaded) {
				alert('Could not create post. Try again later');
				return;
			}

			alert('Post created and uploaded!');
		};

		postRequest.send(form);

		// Clear input fields
		e.target.querySelectorAll('input').forEach((entry) => entry.value = null);
	}

	return (
		<div>
			<p>ACTIVITY PAGE</p>
			<p>SessionID: {sessionID}</p>

			<br/><br/>

			<div>
				<p>CREATE A POST</p>

				<form onSubmit={createPost}>
					<input type='file' name='image' accept='image/*' autoComplete='off' required />
					<input type='text' name='content' autoComplete='off' required />
					<button type='submit'>POST</button>
				</form>
			</div>

			<br/><br/>

			<p>MY FEED</p>
			<div className='postList'>
				{
					(Object.keys(following).length == 0) ? <p>NO ACTIVITY</p> :
					posts.map((key) => {
						if (!(key.by_userID in following)) {
							return;
						}
						else {
							return (
								<div key={`${key.postID}`} className='postContainer'>
									<PostHeader data={key} />
									<Post data={key} />
								</div>
							);
						}
					})
				}
			</div>

			<br/><br/>

			<p>ACTIVITY</p>
			<div className='postList'>
				{
					(posts.length == 0) ? <p>NO ACTIVITY</p> :
					posts.map((key) => {
						return (
							<div key={key.postID} className='postContainer'>
								<PostHeader data={key} />
								<Post data={key} />
							</div>
						);
					})
				}
			</div>
		</div>
	);
}

export default ActivityPage;