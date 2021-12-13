import FingerprintJS from '@fingerprintjs/fingerprintjs-pro'
import './App.css';
import './bootstrap.min.css';
import React, { useState } from 'react';
import axios from "axios";
import env from "react-dotenv";

const App =() => {

  const [state, setState] = useState({
    username: '',
    password: ''
  })

  const [message, setMessage] = useState('')

  const onChange = (event) => {
    const { name, value } = event.target
    setState(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  const fpPromise = FingerprintJS.load({ token: env.BROWSER_API_KEY })

  const handleSubmit = async(event) => {
    event.preventDefault();
    
    const {username, password} = state;
    const fp = await fpPromise
    const fpresult = await fp.get();
    console.log(fpresult);
    let formData = {
      "username": username,
      "password": password,
      "visitorId": fpresult.visitorId
    }
 
    axios({
      method: "post", 
      url: "http://localhost:5000/login", 
      data: formData,
      headers: { "Content-Type": "application/json" }
    })
    .then(function (response) {
      setMessage(response.data.message);
    })
    .catch(function (error) {
      console.log(error.response)
      setMessage(error.response.data.message);
    });
   
  };

  return (
    <div className="App">
      <form className="form-group" onSubmit={handleSubmit}>
        <input 
        type="text" 
          className="form-control" 
          placeholder="username" 
          name="username"
          id="username"
          onChange={onChange}
          value={state.username} 
        />
        <input 
          type="password" 
          className="form-control" 
          placeholder="password" 
          name="password"
          id="password"  
          onChange={onChange}
          value={state.password} 
        />
        <button type="submit" className="btn btn-primary">Log in</button>
      </form>
      <div>{message}</div>
    </div>
  );
}

export default App;