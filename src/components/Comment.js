import React, { useContext } from 'react';
import { Link } from 'react-router-dom';

// Import context from parent component
import { UserContext } from '../Site';

function Comment(props) {
	const { userID, username, profilePic, commentedOn, comment } = props.data;
	const { sessionID } = useContext(UserContext);

	const pfppath = `http://${window.location.hostname}:3001/userPics/${profilePic}`;
	const userpath = (sessionID != userID) ? `/site/${userID}` : '/site/myprofile';

	return (
		<div>
			<Link to={userpath}>
				<img className='pfp' src={pfppath} />
				<p>@{username}</p>
			</Link>
			<p>COMMENTED ON {commentedOn}</p>
			<p>COMMENT: {comment}</p>
		</div>
	);
}

export default Comment;