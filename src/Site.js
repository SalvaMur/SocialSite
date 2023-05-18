import React, { createContext, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom'; // For multi-page setup
import { getCookie, createCookie } from './session';

// Import of stylesheet and components
import Navbar from './components/Navbar';
import ActivityPage from './components/ActivityPage';
import ProfilePage from './components/ProfilePage';
import UserPage from './components/UserPage';
import PostPage from './components/PostPage';

// Provide access to user for child components
export const UserContext = createContext();

function Site() {
	const [sessionID, setSession] = useState(getCookie('sessionID'));
	const [following, setFollowing] = useState({});
	const location = useLocation();

	// Save sessionID to state and to session cookie
	useEffect(() => {
		if (location.state != null) {
			setSession(location.state.sessionID);
			createCookie(location.state.sessionID);
		}
	}, [location.state]);

	// Get list of who the user is following
	useEffect(() => {
		if (sessionID != null) {
			const followingReq = new XMLHttpRequest();
			followingReq.open('POST', `http://${window.location.hostname}:3001/getfollowers`);
			followingReq.setRequestHeader('Content-Type', 'application/json');
			followingReq.onload = function() {
				setFollowing(JSON.parse(this.response));
			}

			followingReq.send(JSON.stringify({sessionID: sessionID}));
		}
	}, [sessionID]);

	return (
		<UserContext.Provider value={{sessionID: sessionID, following: following, setFollowing: (e) => setFollowing(e)}}>
			<div>
				<Navbar />
				<Routes>
					<Route path='activity' Component={ActivityPage} />
					<Route path='myprofile' Component={ProfilePage} />
					<Route path=':userID' Component={UserPage} />
					<Route path='post/:postID' Component={PostPage} />
				</Routes>
			</div>
		</UserContext.Provider>
	);
}

export default Site;