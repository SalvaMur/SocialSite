import React from 'react';
import { Link } from 'react-router-dom';

// Import stylesheet
import '../styles/Post.css';

function Post(props) {
	const { postID, content, imageURL, postedOn } = props.data;

	const date = new Date(postedOn);
	const postpath = `/site/post/${postID}`;

	return (
		<div>
			<div className='postImgContainer'>
				<Link to={postpath}>
					<img className='postImg' src={`http://${window.location.hostname}:3001/posts/${imageURL}`} />
				</Link>
			</div>
			<p className='postDesc'>{content}</p>
			<p className='postDate'>
				{date.getMonth() + 1}-{date.getDate()}-{date.getFullYear()}
			</p>
		</div>
	);
}

export default Post;