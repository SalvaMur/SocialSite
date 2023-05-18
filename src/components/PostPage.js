import React, { useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Import context from parent component
import { UserContext } from '../Site';

// Import stylesheet and components
import Comment from './Comment';
import { useParams } from 'react-router-dom';

const socket = io(`http://${window.location.host}`);

const initialState = {
	by_userID: null,
	username: null,
	profilePic: null,
	content: null,
	imageURL: null,
	postedOn: null
}

function PostPage() {
	const [state, setState] = useState(initialState);
	const [comments, setComments] = useState([]);
	const { sessionID } = useContext(UserContext);
	const { postID } = useParams();
	const imagepath = (state.imageURL == null) ? null : `http://${window.location.hostname}:3001/posts/${state.imageURL}`;
	const pfppath = (state.profilePic == null) ? null : `http://${window.location.hostname}:3001/userPics/${state.profilePic}`;

	useEffect(() => {
		const postReq = new XMLHttpRequest();
		postReq.open('POST', `http://${window.location.hostname}:3001/getpost`);
		postReq.setRequestHeader('Content-Type', 'application/json');
		postReq.onload = function() {
			setState(JSON.parse(this.response));
		};

		const commentsReq = new XMLHttpRequest();
		commentsReq.open('POST', `http://${window.location.hostname}:3001/getcomments`);
		commentsReq.setRequestHeader('Content-Type', 'application/json');
		commentsReq.onload = function() {
			setComments(JSON.parse(this.response));
		};

		postReq.send(JSON.stringify({postID: postID}));
		commentsReq.send(JSON.stringify({postID: postID}));
	}, []);

	// Refresh comments with live posting
	useEffect(() => {
		socket.on(`newcomment-${postID}`, (comment) => {
			setComments((pastcomments) => [comment, ...pastcomments]);
		});

		return () => {
			socket.off(`newcomment-${postID}`);
		}
	}, [comments]);

	function postComment(e) {
		e.preventDefault();

		const query = {};
		const form = e.target.querySelectorAll('input');
		form.forEach((entry) => {
			query[entry.name] = entry.value;
		});

		query.postID = postID;
		query.userID = sessionID;
		query.commentedOn = (new Date()).toISOString();

		// Send comment post request, and handle response
		const commentReq = new XMLHttpRequest();
		commentReq.open('POST', `http://${window.location.hostname}:3001/comment`);
		commentReq.setRequestHeader('Content-Type', 'application/json');
		commentReq.onload = function() {
			const { isUploaded, errno } = JSON.parse(this.response);

			if (!isUploaded) {
				alert('Could not post comment. Try again later');
				return;
			}

			alert('Posted comment');
		};

		commentReq.send(JSON.stringify(query));

		// Clear input fields
		form.forEach((entry) => entry.value = null);
	}

	return (
		<div>
			<p>POST PAGE</p>

			<br/><br/>

			<p>SESSION ID: {sessionID}</p>
			<p>USER ID: {state.by_userID}</p>
			<p>POST ID: {postID}</p>
			<img src={imagepath} />

			<br/><br/>

			<img className='pfp' src={pfppath} />
			<p>Posted By @{state.username}</p>
			<p>Posted On {state.postedOn}</p>
			<p>{state.content}</p>

			<br/><br/>

			<form onSubmit={postComment}>
				<input type='text' name='comment' placeholder='Enter comment' autoComplete='off' required />
				<button type='submit'>COMMENT</button>
			</form>

			<br/><br/>

			<p>COMMENTS</p>
			<div>
				{
					(comments.length == 0) ? <p>NO COMMENTS</p> :
					comments.map((key) => {
						return (
							<Comment key={key.commentID} data={key} />
						);
					})
				}
			</div>
		</div>
	);
}

export default PostPage;