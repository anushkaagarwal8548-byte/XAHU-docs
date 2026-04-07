import React, { Component } from 'react'
import './loginPage.css'
import { Eye, EyeClosed, RefreshDouble } from 'iconoir-react';
import { Navigate } from 'react-router-dom';

export default class LoginPage extends Component {
    constructor() {
        super();
        this.state = { username: "", password: "", is_logging_in: false, show_password: false };

    }

    onClickPasswordEye = ()=>{
        this.setState({show_password: !this.state.show_password});
    }
    onChangeUserName = (ele) => {
        this.setState({ username: ele.target.value });
    }
    onChangePassword = (ele) => {
        this.setState({ password: ele.target.value });
    }
    onClickLogin = async () => {
        this.setState({is_logging_in: true});
        let http_resp = await fetch("/login/login_now", { method: "POST", body: JSON.stringify({ "username": this.state.username, "password": this.state.password }) });
        http_resp = JSON.parse(await http_resp.text());
        if (http_resp["status"] === "OK") {
            this.props.checkIfUserLogin();
            this.setState({redirection: <Navigate to={"/"}/>})
            this.props.create_msg("Login successful.");
        }
        else if (http_resp["status"] === "ACCOUNT_NOT_EXISTS") {
            this.props.create_msg("Login failed, incorrect username or password.");
        }
        else {
            this.props.create_msg("Login failed, unknown error.");
        }
        this.setState({is_logging_in: false});
    }
    
    render() {
        let {login_creds} = this.props;
        if (login_creds){
            return (<Navigate to={"/"}/>)
        }
        return (
            <div className='login_main_body'>
                <h1 style={{ color: "green", textAlign: "center", marginBottom: "0px" }}>Login</h1>
                <label className='entry_lbl'>Username</label>
                <input type="text" className='good_input login_entry' onChange={this.onChangeUserName} />
                <label className='entry_lbl'>Password</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type={this.state.show_password ? "text" : "password"} className='good_input login_entry' onChange={this.onChangePassword} />
                    {this.state.show_password ?
                        <Eye width={25} height={25} color='green' onClick={this.onClickPasswordEye} />
                        :
                        <EyeClosed width={25} height={25} color='green' onClick={this.onClickPasswordEye} />
                    }
                </div>
                {this.state.is_logging_in ?
                    <button className='normal_btn_a'>Login <RefreshDouble width={25} height={25} strokeWidth={2} color='white' className='loader' /></button>
                    :
                    <button className='normal_btn_a' onClick={this.onClickLogin}>Login</button>
                }
            </div>
        )
    }
}
