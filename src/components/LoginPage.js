import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie, deleteCookie } from '../session';

function LoginPage() {
	const navigate = useNavigate();
	const sessionID = getCookie('sessionID');

	function displayText() {
		const req = new XMLHttpRequest();
		req.open('GET', `http://${window.location.hostname}:3001/action`);
		req.onload = function() {
			console.log(this.responseText);
		};
	
		req.send();
	}

	// User logs in with credentials (username and password)
	function login(e) {
		e.preventDefault();

		// Prepare login query
		const query = {};
		const form = e.target.querySelectorAll('input');
		form.forEach((entry) => {
			query[entry.name] = entry.value;
		});

		// Send login request, and handle response
		const logRequest = new XMLHttpRequest();
		logRequest.open('POST', `http://${window.location.hostname}:3001/login`);
		logRequest.setRequestHeader('Content-Type', 'application/json');
		logRequest.onload = function() {
			const { isValid, errno, sessionID } = JSON.parse(this.response);

			// Login unsuccesful due to username being taken
			if (!isValid && errno == 300) {
				alert(`Username or password incorrect`);
			}

			else if (!isValid && errno == 100) {
				alert('Could not login. Try again later');
			}

			// Login successful, go back to login page
			else {
				alert(`Login successful`);

				// Pass credentials to site
				navigate('/site/activity', {state: {sessionID: sessionID}});
			}
		}

		logRequest.send(JSON.stringify(query));
	}

	function goToRegister() {
		navigate('/register');
	}

	function goToSite() {
		navigate('/site/activity');
	}

	function logout() {
		deleteCookie();
		navigate('/');
	}

	if (sessionID != null) {
		return (
			<div>
				<p>LOGIN PAGE</p>
				<button onClick={displayText} >TEST DB, CHECK CONSOLE</button>
				<br/><br/>

				<div>
					<button onClick={goToSite}>CONTINUE SESSION</button>
					<button onClick={logout}>LOG OUT</button>
				</div>
			</div>
		);
	}

	else {
		return (
			<div>
				<p>LOGIN PAGE</p>
				<button onClick={displayText} >TEST DB, CHECK CONSOLE</button>
				<br/><br/>

				<div>
					<form onSubmit={login}>
						<input type='text' name='username' placeholder='Enter Username' autoComplete='off' required />
						<input type='password' name='password' placeholder='Enter Password' autoComplete='off' required />
						<button type='submit'>LOGIN</button>
					</form>
				</div>

				<div>
					<p>or</p>
					<button onClick={goToRegister}>SIGN UP</button>
				</div>
			</div>
		);
	}
}

export default LoginPage;