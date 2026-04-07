import React, { Component } from 'react'
import './header.css'
import { Link } from 'react-router-dom'

export default class Header extends Component {
  render() {
    let {login_creds, onLogout} = this.props;

    return (
      <div className='header_'>
        <h1 style={{marginLeft: "15px"}}>Whatapp Image Popper</h1>
        <div className='nevigations'>
          <Link to={"/"} className='btns'>Home</Link>
          <Link to={"/list_itags"} className='btns'>All Itags</Link>
          {login_creds ? 
          <>
          <Link to={"/dashboard"} className='btns'>Dashboard</Link>
          <Link className='btns' onClick={onLogout}>Logout</Link>
          </>
          :
          <>
          <Link to={"/login"} className='btns'>Login</Link>
          <Link to={"/signup"} className='btns'>Signup</Link>
          </>
          }
          <Link to={"https://github.com/PowerPizza/XAHU-docs?tab=readme-ov-file#whatsapp-image-popper"} target='_black' className='btns'>Docs</Link>
        </div>
      </div>
    )
  }
}
