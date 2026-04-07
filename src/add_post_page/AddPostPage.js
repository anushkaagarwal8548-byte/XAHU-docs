import React, { Component } from 'react'
import './addPostPage.css'
import { RefreshDouble } from 'iconoir-react'
import { Navigate } from 'react-router-dom';

export default class AddPostPage extends Component {
    constructor() {
        super();
        this.state = { image_name: "", image_url: "#", is_sending: false };
    }

    onChangeName = (ele) => {
        this.setState({ image_name: ele.target.value });
    }

    onChangeUrl = (ele) => {
        this.setState({ image_url: ele.target.value });
    }

    onClickAdd = async () => {
        if (!this.state.image_name || !this.state.image_url) {
            this.props.create_msg("Both entries are required.");
            return;
        }
        let special_chars = "!*'();:@&=+$,/?#[].~ ";
        for (let i = 0; i < special_chars.length; i++) {
            if (this.state.image_name.includes(special_chars.charAt(i))) {
                this.props.create_msg("FAILED : Only - OR _ are allowed special characters for image name, please remove all other special characters.");
                return;
            }
        }

        this.setState({ is_sending: true });
        let http_resp = await fetch("/dashboard/put_img_link", { method: "POST", body: JSON.stringify({ "image_name": this.state.image_name, "image_url": this.state.image_url }) });
        http_resp = await http_resp.text()
        if (http_resp === "OK") {
            this.props.create_msg("Successfully added new image.");
        }
        else if (http_resp === "FAILED") {
            this.props.create_msg("This image name already exists please provide a unique image name.");
        }
        else if (http_resp === "USER_NOT_LOGGED_IN") {
            this.props.create_msg("Please make sure you are logged in.");
        }
        else if (http_resp === "OUT_OF_LIMIT") {
            this.props.create_msg("Limit Reached: You’ve added 70 images. Due to database limits, no more can be added to this account.");
        }
        else {
            this.props.create_msg("Failed : Unknown Error.");
        }
        this.setState({ is_sending: false });
    }

    render() {
        let {login_creds} = this.props;
        if (!login_creds){
            return (<Navigate to={"/"} />)
        }
        
        return (
            <div className='add_postmain_body'>
                <h1 style={{ color: "green", textAlign: 'center', margin: "0", marginTop: "10px" }}>Add Image</h1>
                <div className='form_'>
                    <span className='input_lbl'>Image Name (identifire)</span>
                    <input type="text" className='image_name' onChange={this.onChangeName} max={"true"} maxLength="50" />
                    <span className='input_lbl'>Image URL</span>
                    <input type="text" className='image_url' onChange={this.onChangeUrl} />
                </div>
                <img className='image_preview' src={this.state.image_url ? this.state.image_url : "#"} alt="If nothing loaded here after putting the link it means the URL is invalid and not gonna work please consider changing the url" />

                {this.state.is_sending ?
                    <button className='normal_btn_a'>Add <RefreshDouble width={20} height={20} color='white' strokeWidth={2} className='loader' /></button>
                    :
                    <button className='normal_btn_a' onClick={this.onClickAdd}>Add</button>
                }
            </div>
        )
    }
}
