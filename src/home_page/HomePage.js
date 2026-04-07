import React, { Component } from 'react'
import './homePage.css'
import { ArrowLeft, ArrowRight, Check, Link, RefreshDouble } from 'iconoir-react'

class ImageBlock extends Component {
    constructor(){
        super();
        this.state = {is_copied: false};
    }
    onCopyLink = ()=>{
        navigator.clipboard.writeText(`https://${window.location.host}/use/${this.props.img_ep}/${this.props.img_name}`);
        this.setState({is_copied: true});
        setTimeout(() => {
            this.setState({is_copied: false});
        }, 3000);
    }
    render(){
        let {img_src, img_name, img_ep} = this.props;
        return (
            <div className='image_block'>
                <img src={img_src} alt="block class derived" className='image_holder' />
                <div className='info_box'>
                    <span className='into_text image_name'>Name : {img_name}</span>
                    <span className='into_text endpoint'>Endpoint : /{img_ep}</span>
                    {this.state.is_copied ? 
                    <Check width={25} height={25} className='copy_link' />
                    :
                    <Link width={25} height={25} className='copy_link' onClick={this.onCopyLink} />
                    }
                </div>
            </div>
        )
    }
}

export default class HomePage extends Component {
    constructor(){
        super();
        this.state = {doc_no: 1, document_to_show: {}, total_docs: 1, loader_show: false};
    }  

    getImageUrls = async (doc_no)=>{
        let to_send = {
            "doc_no": doc_no,
        }
        this.setState({loader_show: true});
        let http_resp = await fetch("/get_img_links", {method: 'POST', body: JSON.stringify(to_send)});
        http_resp = JSON.parse(await http_resp.text());
        this.setState({document_to_show: http_resp["doc"][0], total_docs: http_resp["total_docs"], loader_show: false});
    }

    componentDidMount = ()=>{
        this.getImageUrls(this.state.doc_no);
    }

    onClickNext = ()=>{
        if (this.state.doc_no + 1 <= this.state.total_docs-1){
            this.setState({doc_no: this.state.doc_no+1});
            this.getImageUrls(this.state.doc_no+1);
        }
    }

    onClickPrevious = ()=>{
        if (this.state.doc_no-1 >= 1){
            this.setState({doc_no: this.state.doc_no-1});
            this.getImageUrls(this.state.doc_no-1);
        }
    }
  render() {
    return (
      <div className='home_page_main_body'>
        <div className='home_controls'>
            <input type="text" name="" id="" placeholder='search...' className='good_input search_input' />
            <select name="search_by" defaultValue={"0"} className='search_by_menu'>
                <option value="0" disabled>Search By</option>
                <option value="">Image Name</option>
                <option value="">Endpoint</option>
            </select>
        </div>
        <div className='items_holder'>
            <div className='nxt_prv_btn'>
                <ArrowLeft width={30} height={30} color='#05b41c' strokeWidth={2} style={{marginRight: "auto", cursor: "pointer"}} onClick={this.onClickPrevious} />
                <span style={{textAlign: "center", margin: "auto"}}>{this.state.doc_no}/{this.state.total_docs-1}</span>
                <ArrowRight width={30} height={30} color='#05b41c' strokeWidth={2} style={{marginLeft: "auto", cursor: "pointer"}} onClick={this.onClickNext}/>
            </div>
            <div className='holder_'>
                {this.state.loader_show ? 
                <RefreshDouble width={35} height={35} color='green' className='loader'/>
                :
                this.state.document_to_show && Object.keys(this.state.document_to_show).length ?
                Object.keys(this.state.document_to_show).map((key, idx_)=>{
                    return key !== "endpoint" ? <ImageBlock img_src={this.state.document_to_show[key]} img_name={key} img_ep={this.state.document_to_show["endpoint"]} key={`${idx_}imageviewerbox`}/>
                    :
                    null
                })
                :
                <span style={{marginLeft: "auto", marginRight: "auto"}}>No images are available yet!</span>
                }
            </div>
        </div>
      </div>
    )
  }
}
