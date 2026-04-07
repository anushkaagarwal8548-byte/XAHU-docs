import React, { Component } from 'react'
import './managementPage.css'
import { Navigate } from 'react-router-dom';
import { RefreshDouble } from 'iconoir-react';

class PostItemElement extends Component{
    constructor(){
        super();
        this.state = {is_deleting: false};
    }

    onDeletePost = async()=>{
        this.setState({is_deleting: true});
        let http_resp = await fetch("/delete_post/by_creds", {method: "POST", body: this.props.img_name});
        http_resp = await http_resp.text();
        if (http_resp === "OK"){
            this.props.create_msg("Deleted successfully!")
            this.props.refresh_post();
        }
        else{
            this.props.create_msg("Failed to delete!")
        }
        this.setState({is_deleting: false});
    }

    render(){
        return (
            <div className='post_item_element'>
                <img src={this.props.img_url} alt="view" className='image_preview' />
                <div style={{display: "flex", flexDirection: "column"}}>
                    <span style={{color: "green", fontWeight: "600"}}><b>Image Name : </b>{this.props.img_name}</span>
                    <span style={{color: "green", fontWeight: "600"}}><b>Image URL : </b>{this.props.img_url}</span>
                </div>
                {this.state.is_deleting ? 
                <RefreshDouble width={25} height={25} color='green' strokeWidth={2} className='loader' style={{marginLeft: "auto"}}/>
                :
                <button className='btn_delete' onClick={this.onDeletePost}>Delete</button>
                }
            </div>
        )
    }
}
export default class ManagementPage extends Component {
    constructor(){
        super();
        this.state = {my_posts: {}, is_loading: false}
    }

    get_posts_data = async ()=>{
        this.setState({is_loading: true});
        let http_resp = await fetch("/get_img_links/by_creds", {method: "POST"});
        http_resp = JSON.parse(await http_resp.text());
        this.setState({my_posts: http_resp["doc"], is_loading: false});
    }
    componentDidMount(){
        this.get_posts_data();
    }

  render() {
    let {login_creds, create_msg} = this.props;
    if (!login_creds){
        return <Navigate to={"/"}/>
    }

    return (
      <div className='management_main_body'>
        <span className='plistheading' style={{fontSize: "1.3rem", fontWeight: "600", textAlign: "center"}}>Your Posts</span>
        <div className='posts_holder'>
            <div className='p_holder_scrollable'>
                {this.state.is_loading ?
                <div style={{marginLeft: 'auto', marginRight: "auto", marginTop: "10px"}}>
                    <RefreshDouble width={35} height={35} strokeWidth={2} color='green' className='loader' />
                </div>
                :
                !this.state.is_loading && !Object.keys(this.state.my_posts).length ?
                <span style={{marginLeft: 'auto', marginRight: "auto", marginTop: "10px"}}>No posts are available yet.</span>
                :
                Object.keys(this.state.my_posts).map((key, idx_)=>{
                    return <PostItemElement img_name={key} img_url={this.state.my_posts[key]} key={`${idx_}_post_holder`} create_msg={create_msg} refresh_post={this.get_posts_data}/>
                })
                }
            </div>
        </div>
      </div>
    )
  }
}
