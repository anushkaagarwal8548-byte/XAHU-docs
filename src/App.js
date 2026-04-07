import React, { Component } from 'react'
import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Header from './header/Header';
import { XmarkCircle } from 'iconoir-react';
import SignupPage from './signup_page/SignupPage';
import LoginPage from './login_page/LoginPage';
import AddPostPage from './add_post_page/AddPostPage';
import HomePage from './home_page/HomePage';
import ManagementPage from './management/ManagementPage';
import DashboardPage from './dashboard_page/DashboardPage';
import AddItag from './add_itag_page/AddItag';
import ListItags from './list_itags/ListItags';

class MessageBar extends Component {
  render() {
    return (
      <div className='message_box'>
        <span className='msg_text'>{this.props.msg_}</span>
        <XmarkCircle width={35} height={35} color='red' strokeWidth={2} style={{marginLeft: "auto", marginRight: "10px", cursor: "pointer"}} onClick={this.props.onClose} />
      </div>
    )
  }
}

export default class App extends Component {
  constructor(){
    super();
    this.state = {msg_to_show: null, login_creds: null};
  }

  create_msg = (msg_)=>{
    this.setState({msg_to_show: <MessageBar msg_={msg_} onClose={this.close_msg} />});
    setTimeout(() => {
      this.close_msg();
    }, 5000);
  }

  close_msg = ()=>{
    this.setState({msg_to_show: null});
  }

  checkIfUserLogin = async()=>{
    let http_resp = await fetch("/login/get_user_login", {method: "POST"});
    http_resp = JSON.parse(await http_resp.text())
    if (http_resp["failed"] === "NOT_LOGGED_IN"){
      this.setState({login_creds: null});
    }
    else{
      this.setState({login_creds: http_resp});
    }
  }

  onLogout = async()=>{
    let http_resp = await fetch("/login/logout", {method: "POST"});
    http_resp = await http_resp.text();
    if (http_resp === "OK"){
      this.create_msg("Logged out successfully!");
      this.setState({login_creds: null});
    }
    else{
      this.create_msg("Failed to logout : Unknown error!");
    }
  }

  componentDidMount(){
    this.checkIfUserLogin();  
  }

  render() {
    return (
      <Router>
        <div className='main_body'>
          <Header login_creds={this.state.login_creds} onLogout={this.onLogout} />
          {this.state.msg_to_show}
          <div className='content'>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/signup' element={<SignupPage create_msg={this.create_msg} checkIfUserLogin={this.checkIfUserLogin} login_creds={this.state.login_creds}/>} />
              <Route path='/login' element={<LoginPage create_msg={this.create_msg} checkIfUserLogin={this.checkIfUserLogin} login_creds={this.state.login_creds} />} />
              <Route path='/dashboard' element={<DashboardPage create_msg={this.create_msg} login_creds={this.state.login_creds} />} />
              <Route path='/add_image' element={<AddPostPage create_msg={this.create_msg} login_creds={this.state.login_creds} />} />
              <Route path='/management' element={<ManagementPage create_msg={this.create_msg} login_creds={this.state.login_creds}/>} />
              <Route path='/add_itag_img' element={<AddItag create_msg={this.create_msg} login_creds={this.state.login_creds}/>} />
              <Route path='/list_itags' element={<ListItags />} />
            </Routes>
          </div>
        </div>
      </Router>
    )
  }
}
