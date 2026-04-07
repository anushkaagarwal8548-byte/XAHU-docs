import React, { Component } from 'react'
import './signupPage.css'
import { Eye, EyeClosed, RefreshDouble } from 'iconoir-react'
import { Navigate } from 'react-router-dom';

export default class SignupPage extends Component {
    constructor(){
        super();
        this.state = {show_password: false, user_name: "", password: "", endpoint: "", is_signing_up: false, redirection: null};
    }

    onClickPasswordEye = ()=>{
        this.setState({show_password: !this.state.show_password});
    }
    onChangeUserName = (ele)=>{
        this.setState({user_name: ele.target.value});
    }
    onChangePassword = (ele)=>{
        this.setState({password: ele.target.value});
    }
    onChangeEndpoint = (ele)=>{
        this.setState({endpoint: ele.target.value.toLowerCase()});
        ele.target.value = ele.target.value.toLowerCase();
    }

    onSubmitSignup = async ()=>{
        let special_chars = "!*'();:@&=+$,/?#[].~ ";
        for (let i = 0; i < special_chars.length; i++) {
            if (this.state.endpoint.includes(special_chars.charAt(i))) {
                this.props.create_msg("FAILED : Only - OR _ are allowed special characters for end point, please remove all other special characters.");
                return;
            }
        }

        let to_send = {
            "username": this.state.user_name,
            "password": this.state.password,
            "endpoint": this.state.endpoint
        }

        this.setState({is_signing_up: true});
        let http_resp = await fetch("/signup/register", {method: "POST", body: JSON.stringify(to_send)});
        http_resp = await http_resp.text();
        if (http_resp === "OK"){
            this.props.create_msg("Successfully Signed Up. (redirecting...)");
            this.props.checkIfUserLogin();
        }
        else if (http_resp === "USERNAME_ALREADY_EXISTS"){
            this.props.create_msg("Username already exists! Please provide an unique username.");
        }
        else if (http_resp === "ENDPOINT_ALREADY_EXISTS"){
            this.props.create_msg("Endpoint already exists! Please provide an unique endpoint.");
        }
        else if (http_resp === "FAILED"){
            this.props.create_msg("Failed to create account!");
        }
        else{
            this.props.create_msg("Signing up failed : Unknown error!");
        }
        this.setState({is_signing_up: false});
    }
  render() {
    let {login_creds} = this.props;
    if (login_creds){
        return (<Navigate to={"/"}/>)
    }
    return (
      <div className='signup_main_body'>
        {this.state.redirection}
        <h1 style={{color: "green", textAlign: "center", marginBottom: "0px"}}>Signup</h1>
        <label className='entry_lbl'>Username</label>
        <input type="text" className='good_input signup_entry' onChange={this.onChangeUserName}/>
        <label className='entry_lbl'>Password</label>
        <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
            <input type={this.state.show_password ? "text": "password"} className='good_input signup_entry' onChange={this.onChangePassword}/>
            {this.state.show_password ? 
            <Eye width={25} height={25} color='green' onClick={this.onClickPasswordEye} />
            :
            <EyeClosed width={25} height={25} color='green' onClick={this.onClickPasswordEye} />
            }
        </div>
        <label className='entry_lbl'>Endpoint Name</label>
        <span style={{color: "green", fontSize: "0.8rem", fontWeight: "400", marginLeft: "5px"}}>No uppercase & special characters allowed</span>
        <input type="text" className='good_input signup_entry' onChange={this.onChangeEndpoint}/>
        {this.state.is_signing_up ? 
        <button className='normal_btn_a'>SignUp <RefreshDouble width={25} height={25} strokeWidth={2} color='white' className='loader'/></button>
        :
        <button className='normal_btn_a' onClick={this.onSubmitSignup}>SignUp</button>
        }
      </div>
    )
  }
}
