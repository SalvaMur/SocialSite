import React from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
	const navigate = useNavigate();

	function registerUser(e) {
		e.preventDefault();

		const form = new FormData(e.target);

		// Send registration request, and handle response
		const regRequest = new XMLHttpRequest();
		regRequest.open('POST', `http://${window.location.hostname}:3001/register`);
		regRequest.onload = function() {
			const { isRegistered, errno } = JSON.parse(this.response);

			// Registration unsuccesful due to username being taken
			if (!isRegistered && errno == 200) {
				alert(`Username already taken`);
			}

			else if (!isRegistered && errno == 100) {
				alert('Could not register. Try again later');
			}

			// Registration successful, go back to login page
			else {
				alert(`Registration succeeded`);
				navigate('/');
			}
		}

		regRequest.send(form);
	}

	return (
		<div>
			<p>REGISTER PAGE</p>

			<form onSubmit={registerUser}>
				<input type='file' name='image' accept='image/*' autoComplete='off' />
				<br/>
				<input type='text' name='firstName' placeholder='Enter first name' autoComplete='off' required />
				<br/>
				<input type='text' name='lastName' placeholder='Enter last name' autoComplete='off' required />
				<br/>
				<input type='date' name='birthdate' placeholder='Enter birthdate' autoComplete='off' required />
				<br/>
				<input type='text' name='username' placeholder='Enter username' autoComplete='off' required />
				<br/>
				<input type='password' name='password' placeholder='Enter password' autoComplete='off' required />
				<br/>
				<button type='submit'>REGISTER</button>
			</form>
		</div>
	);
}

export default RegisterPage;