import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom'; // For multi-page setup

// Import of stylesheet and components
import './styles/App.css';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Site from './Site';

function App() {
	return (
		<div className='App'>
			<BrowserRouter>
				<Routes>
					<Route exact path='/' Component={LoginPage} />
					<Route path='register' Component={RegisterPage} />
					<Route path='/site/*' Component={Site} />
				</Routes>
			</BrowserRouter>
		</div>
	);
}

export default App;