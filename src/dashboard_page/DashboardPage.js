import React, { Component } from 'react'
import './dashboardPage.css'
import { PlusCircle, Settings, UserStar } from 'iconoir-react'
import { Link, Navigate } from 'react-router-dom';

export default class DashboardPage extends Component {
  render() {
    let {login_creds} = this.props;
    if (!login_creds){
        return (<Navigate to={"/"} />)
    }

    return (
        <div className='dashboard_main_body'>
            <h1 style={{ color: "green", textAlign: 'center', margin: "0", marginTop: "10px" }}>Dashboard</h1>
            <div className='dashboard_opt_holder'>
                <Link to={"/add_image"} style={{textDecoration: "none"}}>
                    <div className='opt_'>
                        <PlusCircle width={50} height={50} color='green'/>
                        <span className='opt_name'>Add Image</span>
                    </div>
                </Link>

                <Link to={"/management"} style={{textDecoration: "none"}}>
                    <div className='opt_'>
                        <Settings width={50} height={50} color='green'/>
                        <span className='opt_name'>Manage Images</span>
                    </div>
                </Link>

                <Link to={"/add_itag_img"} style={{textDecoration: "none"}}>
                    <div className='opt_'>
                        <PlusCircle width={50} height={50} color='green'/>
                        <span className='opt_name'>Add Itag</span>
                    </div>
                </Link>

                <Link to={"#"} style={{textDecoration: "none"}}>
                    <div className='opt_'>
                        <UserStar width={50} height={50} color='green'/>
                        <span className='opt_name'>Manage Account</span>
                    </div>
                </Link>
            </div>
        </div>
    )
  }
}
