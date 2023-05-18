import React from 'react';
import { Link } from 'react-router-dom';
import { deleteCookie } from '../session';

function Navbar() {
	function logOut() {
		deleteCookie();
	}

	return (
		<div>
			<p>NAVBAR</p>
			<Link to='/'>LOGIN</Link>
			<br/><br/>
			<Link to='activity'>ACTIVITY</Link>
			<br/><br/>
			<Link to='myprofile'>PROFILE</Link>
			<br/><br/>
			<Link to='/' onClick={logOut}>LOG OUT</Link>
		</div>
	);
}

export default Navbar;