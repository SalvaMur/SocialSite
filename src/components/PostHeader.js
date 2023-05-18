import React, { useContext } from 'react';
import { Link } from 'react-router-dom';

// Import context from parent component
import { UserContext } from '../Site';

// Import stylesheet
import '../styles/PostHeader.css';

function PostHeader(props) {
	const { username, by_userID, profilePic } = props.data;
	const { sessionID } = useContext(UserContext);

	// If post is made by user themself, go to 'myprofile' instead
	const userpath = (sessionID != by_userID) ? `/site/${by_userID}` : '/site/myprofile';

	return (
		<div className='postInfo'>
			<Link to={userpath}>
				<img className='pfp' src={`http://${window.location.hostname}:3001/userPics/${profilePic}`} />
			</Link>
			<Link to={userpath}>@{username}</Link>
		</div>
	);
}

export default PostHeader;